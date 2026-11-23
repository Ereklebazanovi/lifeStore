// მიღება (docs/stock-receipts.md §1): ტვირთი ერთ ჩანაწერად; ნაწილი შეიძლება იქვე გადავიდეს მაღაზიაში.
// ყველაფერი ერთ ტრანზაქციაშია: მიღება + მარაგი + ახალი პროდუქტი + მიბმული გადატანა — ან ყველაფერი, ან არაფერი.
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import type { DocumentSnapshot, Transaction } from "firebase/firestore";
import { auth, db } from "./firebase";
import { DEFAULT_STORE } from "./storeTransferService";
import { parseStoreTransferDate } from "../utils/storeTransferDate";
import { generateProductSlug } from "../utils/slug";
import type { OrderActor, Product, StockHistory } from "../types";
import type { StoreTransferItem } from "../types/storeTransfer";
import type {
  NewReceiptProduct,
  StockReceipt,
  StockReceiptInputItem,
  StockReceiptItem,
  StockReceiptRequest,
} from "../types/stockReceipt";

const MAX_LINES = 200;
const CODE_PATTERN = /^[A-Z0-9-]+$/;
const validId = (id: unknown): id is string =>
  typeof id === "string" && !!id && id.length <= 200 && !id.includes("/") && !id.startsWith("manual_");

interface Line {
  productId: string;
  quantity: number;
  toStore: number;
  newProduct?: NewReceiptProduct;
}
interface Fields {
  date: Date;
  supplier: string;
  documentNumber: string;
  note: string;
  items: Line[];
}

function normalizeNewProduct(value: NewReceiptProduct): NewReceiptProduct {
  const name = (value?.name || "").trim();
  const productCode = (value?.productCode || "").trim().toUpperCase();
  const category = (value?.category || "").trim();
  if (!name || name.length > 200) throw Error("ახალ პროდუქტს სახელი სჭირდება (მაქს. 200 სიმბოლო)");
  if (!productCode || productCode.length > 50 || !CODE_PATTERN.test(productCode))
    throw Error(`კოდი „${productCode || "—"}“ არასწორია: მხოლოდ დიდი ასოები, ციფრები და „-“`);
  if (category.length > 200) throw Error("კატეგორიის სახელი ზედმეტად გრძელია");
  return { name, productCode, ...(category ? { category } : {}) };
}

function normalize(request: StockReceiptRequest, allowNew: boolean): Fields {
  const supplier = (request.supplier || "").trim();
  if (!supplier) throw Error("მიუთითე მომწოდებელი");
  if (supplier.length > 200) throw Error("მომწოდებლის სახელი ზედმეტად გრძელია");
  const documentNumber = (request.documentNumber || "").trim();
  if (documentNumber.length > 100) throw Error("დოკუმენტის ნომერი ზედმეტად გრძელია");
  const note = (request.note || "").trim();
  if (note.length > 2000) throw Error("კომენტარი ზედმეტად გრძელია");
  const date = parseStoreTransferDate(request.date);
  if (!Array.isArray(request.items) || !request.items.length || request.items.length > MAX_LINES)
    throw Error(`აირჩიე 1–${MAX_LINES} პროდუქტის ხაზი`);
  const grouped = new Map<string, Line>();
  const codes = new Set<string>();
  for (const item of request.items as StockReceiptInputItem[]) {
    if (!validId(item.productId)) throw Error("აირჩიე არსებული პროდუქტი");
    const quantity = item.quantity;
    const toStore = item.toStore ?? 0;
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw Error("რაოდენობა უნდა იყოს დადებითი მთელი რიცხვი");
    if (!Number.isSafeInteger(toStore) || toStore < 0 || toStore > quantity)
      throw Error("„აქედან მაღაზიაში“ უნდა იყოს 0-დან მიღებულ რაოდენობამდე");
    const newProduct = item.newProduct ? normalizeNewProduct(item.newProduct) : undefined;
    if (newProduct && !allowNew) throw Error("ახალი პროდუქტი მხოლოდ ახალ მიღებაში ემატება");
    if (newProduct) {
      if (codes.has(newProduct.productCode)) throw Error(`კოდი ${newProduct.productCode} ორჯერაა ჩაწერილი`);
      codes.add(newProduct.productCode);
    }
    const previous = grouped.get(item.productId);
    if (previous && (previous.newProduct || newProduct)) throw Error("ახალი პროდუქტი ერთხელ უნდა იყოს ჩაწერილი");
    const line: Line = previous
      ? { ...previous, quantity: previous.quantity + quantity, toStore: previous.toStore + toStore }
      : { productId: item.productId, quantity, toStore, ...(newProduct ? { newProduct } : {}) };
    if (!Number.isSafeInteger(line.quantity) || !Number.isSafeInteger(line.toStore)) throw Error("რაოდენობა ზედმეტად დიდია");
    grouped.set(item.productId, line);
  }
  return {
    date,
    supplier,
    documentNumber,
    note,
    items: [...grouped.values()].sort((a, b) => a.productId.localeCompare(b.productId)),
  };
}

async function adminActor(tx: Transaction): Promise<OrderActor> {
  const user = auth.currentUser;
  if (!user) throw Error("საჭიროა ადმინისტრატორის ანგარიშით შესვლა");
  const profile = await tx.get(doc(db, "users", user.uid));
  if (profile.data()?.role !== "admin") throw Error("მიღებაზე წვდომა მხოლოდ ადმინისტრატორს აქვს");
  return { uid: user.uid, email: user.email || "", ...(user.displayName ? { name: user.displayName } : {}) };
}

const salePrice = (product: Pick<Product, "price" | "salePrice">): number => {
  const price = product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price;
  return Number.isFinite(price) && price > 0 ? price : 0;
};
const transferTotals = (items: StoreTransferItem[]) => ({
  totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  totalValue: Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100,
});
const receiptTotals = (items: StockReceiptItem[]) => ({
  totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  totalToStore: items.reduce((sum, item) => sum + item.toStore, 0),
});

/**
 * პროდუქტის მარაგზე რამდენიმე ჩანაწერი ერთ ტრანზაქციაში — თითო თავისი მიზეზით (ბრუნვითში
 * „მიღება“ და „გადატანა მაღაზიაში“ ცალ-ცალკე ჩანს). დადებითი ჯერ, უარყოფითი მერე: შუალედური ნაშთი მინუსში არ ჩადის.
 */
type ReceiptTag = { receiptId: string; effectiveAt: Date };

function stockUpdate(
  product: Product,
  movements: { delta: number; reason: string }[],
  now: Date,
  tag: ReceiptTag,
): { stock: number; history: StockHistory[] } | null {
  const ordered = movements.filter((movement) => movement.delta !== 0).sort((a, b) => b.delta - a.delta);
  if (!ordered.length) return null;
  if (product.hasVariants) throw Error(`ვარიანტიანი პროდუქტი მიღებაში არ მუშავდება: ${product.name}`);
  let stock = product.stock ?? 0;
  if (!Number.isSafeInteger(stock) || stock < 0) throw Error(`არასწორი მარაგი: ${product.name}`);
  const history: StockHistory[] = [];
  for (const movement of ordered) {
    stock += movement.delta;
    if (!Number.isSafeInteger(stock) || stock < 0) throw Error(`არასაკმარისი მარაგი: ${product.name} — ეს საქონელი უკვე გაიყიდა ან გადავიდა`);
    // effectiveAt: ბრუნვითში მიღების არჩეული თარიღით ჩანს (docs/stock-receipts.md §3)
    history.push({ timestamp: now, quantity: stock, reason: movement.reason, delta: movement.delta, ...tag });
  }
  return { stock, history };
}

const productUpdate = (product: Product, update: { stock: number; history: StockHistory[] }, now: Date) => ({
  stock: update.stock,
  totalStock: update.stock,
  updatedAt: now,
  lastStockReason: update.history[update.history.length - 1].reason,
  stockHistory: [...(product.stockHistory || []), ...update.history],
});

const asDate = (value: unknown): Date =>
  value instanceof Date ? value : (value as { toDate: () => Date }).toDate();

/** მიღების თარიღი შეიცვალა → ამ მიღების ძველი ჩანაწერებიც ახალ თარიღზე გადადის, რომ ბრუნვითში ერთად ჩანდეს */
function retag(history: StockHistory[], tag: ReceiptTag): StockHistory[] | null {
  let changed = false;
  const next = history.map((entry) => {
    if (entry.receiptId !== tag.receiptId || (entry.effectiveAt && asDate(entry.effectiveAt).getTime() === tag.effectiveAt.getTime())) return entry;
    changed = true;
    return { ...entry, effectiveAt: tag.effectiveAt };
  });
  return changed ? next : null;
}

const readProduct = (snapshot: DocumentSnapshot): Product | null =>
  snapshot.exists() ? ({ ...(snapshot.data() as Product), id: snapshot.id }) : null;

/** კოდი და slug უნიკალური უნდა იყოს — ტრანზაქციაში query შეუძლებელია, ამიტომ წინასწარ ვამოწმებთ. */
async function prepareNewProducts(lines: Line[]): Promise<Map<string, string>> {
  const slugs = new Map<string, string>();
  for (const line of lines) {
    if (!line.newProduct) continue;
    const { productCode, name } = line.newProduct;
    const taken = await getDocs(query(collection(db, "products"), where("productCode", "==", productCode), limit(1)));
    if (!taken.empty) throw Error(`კოდი ${productCode} უკვე აქვს პროდუქტს „${taken.docs[0].data().name || taken.docs[0].id}“ — აირჩიე ის სიიდან`);
    const base = generateProductSlug(name) || productCode.toLowerCase();
    let slug = base;
    for (const candidate of [base, `${base}-${productCode.toLowerCase()}`, `${base}-${line.productId.slice(0, 6).toLowerCase()}`]) {
      slug = candidate;
      const used = await getDocs(query(collection(db, "products"), where("slug", "==", candidate), limit(1)));
      if (used.empty && ![...slugs.values()].includes(candidate)) break;
    }
    slugs.set(line.productId, slug);
  }
  return slugs;
}

export class StockReceiptService {
  static newId(): string {
    return doc(collection(db, "stockReceipts")).id;
  }
  static newProductId(): string {
    return doc(collection(db, "products")).id;
  }

  static subscribe(next: (items: StockReceipt[]) => void, error: (error: Error) => void): () => void {
    return onSnapshot(
      query(collection(db, "stockReceipts"), orderBy("date", "desc")),
      (snapshot) =>
        next(
          snapshot.docs.map((item) => {
            const data = item.data();
            return {
              ...data,
              id: item.id,
              date: asDate(data.date),
              createdAt: asDate(data.createdAt),
              ...(data.updatedAt ? { updatedAt: asDate(data.updatedAt) } : {}),
            } as StockReceipt;
          }),
        ),
      error,
    );
  }

  static async create(request: StockReceiptRequest, id = this.newId(), transferId = doc(collection(db, "storeTransfers")).id): Promise<string> {
    if (!validId(id) || !validId(transferId)) throw Error("მიღების მონაცემები არასწორია");
    const fields = normalize(request, true);
    const requestKey = JSON.stringify({ ...fields, date: request.date });
    const receiptRef = doc(db, "stockReceipts", id);
    // ორმაგ დაჭერაზე: თუ ეს მიღება უკვე შენახულია, ახალ პროდუქტებს თავიდან აღარ ვამოწმებთ
    const slugs = await prepareNewProducts(fields.items).catch(async (failure) => {
      const existing = await getDoc(receiptRef).catch(() => null);
      if (existing?.exists()) return new Map<string, string>();
      throw failure;
    });
    await runTransaction(db, async (tx) => {
      const actor = await adminActor(tx);
      const existing = await tx.get(receiptRef);
      if (existing.exists()) {
        if (existing.data().requestKey === requestKey && existing.data().createdBy?.uid === actor.uid) return;
        throw Error("ეს მიღება უკვე შენახულია — გადაამოწმე ჟურნალი");
      }
      const toStoreTotal = fields.items.reduce((sum, line) => sum + line.toStore, 0);
      const storeRef = doc(db, "stores", DEFAULT_STORE.id);
      const store = toStoreTotal > 0 ? await tx.get(storeRef) : null;
      if (store?.exists() && store.data().isActive === false) throw Error("მაღაზია არააქტიურია — „აქედან მაღაზიაში“ ცარიელი დატოვე");
      const refs = fields.items.map((line) => doc(db, "products", line.productId));
      const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
      const now = new Date();
      const receiptNumber = `MR-${now.getFullYear()}-${id.slice(0, 10).toUpperCase()}`;
      const transferNumber = `ST-${now.getFullYear()}-${transferId.slice(0, 10).toUpperCase()}`;
      const receiptReason = `Receipt #${receiptNumber}`;
      const transferReason = `Store transfer #${transferNumber}`;
      const tag: ReceiptTag = { receiptId: id, effectiveAt: fields.date };
      const receiptItems: StockReceiptItem[] = [];
      const transferItems: StoreTransferItem[] = [];
      const writes: (() => void)[] = [];
      fields.items.forEach((line, index) => {
        const existingProduct = readProduct(snapshots[index]);
        const movements = [
          { delta: line.quantity, reason: receiptReason },
          { delta: -line.toStore, reason: transferReason },
        ];
        if (line.newProduct) {
          if (existingProduct) throw Error("ახალი პროდუქტის შექმნა ვერ მოხერხდა — სცადე თავიდან");
          const { name, productCode, category } = line.newProduct;
          const update = stockUpdate({ id: line.productId, name, stock: 0, stockHistory: [] } as unknown as Product, movements, now, tag)!;
          writes.push(() =>
            tx.set(refs[index], {
              name,
              slug: slugs.get(line.productId) || generateProductSlug(name),
              productCode,
              description: "",
              category: category || "",
              images: [],
              priority: 0,
              isActive: false,
              hasVariants: false,
              price: 0,
              minPrice: 0,
              maxPrice: 0,
              stock: update.stock,
              totalStock: update.stock,
              stockHistory: update.history,
              lastStockReason: update.history[update.history.length - 1].reason,
              createdFromReceiptId: id,
              createdFromReceiptNumber: receiptNumber,
              createdAt: now,
              updatedAt: now,
            }),
          );
          receiptItems.push({ productId: line.productId, name, productCode, quantity: line.quantity, toStore: line.toStore, createdProduct: true });
          if (line.toStore) transferItems.push({ productId: line.productId, name, price: 0, quantity: line.toStore });
          return;
        }
        if (!existingProduct) throw Error(`პროდუქტი ვერ მოიძებნა: ${line.productId}`);
        const update = stockUpdate(existingProduct, movements, now, tag)!;
        writes.push(() => tx.update(refs[index], productUpdate(existingProduct, update, now)));
        receiptItems.push({
          productId: line.productId,
          name: existingProduct.name,
          productCode: existingProduct.productCode || "",
          quantity: line.quantity,
          toStore: line.toStore,
        });
        if (line.toStore)
          transferItems.push({ productId: line.productId, name: existingProduct.name, price: salePrice(existingProduct), quantity: line.toStore });
      });
      writes.forEach((write) => write());
      if (transferItems.length) {
        if (!store?.exists())
          tx.set(storeRef, { name: DEFAULT_STORE.name, address: DEFAULT_STORE.address, isActive: true, createdAt: now });
        tx.set(doc(db, "storeTransfers", transferId), {
          transferNumber,
          type: "out",
          storeId: DEFAULT_STORE.id,
          storeName: DEFAULT_STORE.name,
          storeAddress: DEFAULT_STORE.address,
          items: transferItems,
          ...transferTotals(transferItems),
          note: `მიღება #${receiptNumber}`,
          date: fields.date,
          createdAt: now,
          createdBy: actor,
          receiptId: id,
          receiptNumber,
        });
      }
      tx.set(receiptRef, {
        receiptNumber,
        date: fields.date,
        supplier: fields.supplier,
        documentNumber: fields.documentNumber,
        note: fields.note,
        items: receiptItems,
        ...receiptTotals(receiptItems),
        ...(transferItems.length ? { storeTransferId: transferId, storeTransferNumber: transferNumber } : {}),
        createdAt: now,
        createdBy: actor,
        requestKey,
      });
    });
    return id;
  }

  static async update(id: string, request: StockReceiptRequest, newTransferId = doc(collection(db, "storeTransfers")).id): Promise<void> {
    if (!validId(id) || !validId(newTransferId)) throw Error("ჩანაწერი არასწორია");
    const fields = normalize(request, false);
    await runTransaction(db, async (tx) => {
      const actor = await adminActor(tx);
      const receiptRef = doc(db, "stockReceipts", id);
      const receiptSnapshot = await tx.get(receiptRef);
      if (!receiptSnapshot.exists()) throw Error("მიღება აღარ არსებობს");
      const previous = receiptSnapshot.data() as StockReceipt;
      const hadTransfer = !!previous.storeTransferId;
      const transferId = previous.storeTransferId || newTransferId;
      const transferRef = doc(db, "storeTransfers", transferId);
      const toStoreTotal = fields.items.reduce((sum, line) => sum + line.toStore, 0);
      const storeRef = doc(db, "stores", DEFAULT_STORE.id);
      const [transferSnapshot, store] = await Promise.all([
        hadTransfer ? tx.get(transferRef) : Promise.resolve(null),
        !hadTransfer && toStoreTotal > 0 ? tx.get(storeRef) : Promise.resolve(null),
      ]);
      if (store?.exists() && store.data().isActive === false) throw Error("მაღაზია არააქტიურია — „აქედან მაღაზიაში“ ცარიელი დატოვე");
      const ids = [...new Set([...previous.items.map((item) => item.productId), ...fields.items.map((line) => line.productId)])];
      const refs = ids.map((productId) => doc(db, "products", productId));
      const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
      const now = new Date();
      const transferNumber = previous.storeTransferNumber || `ST-${now.getFullYear()}-${transferId.slice(0, 10).toUpperCase()}`;
      const transferWillExist = toStoreTotal > 0;
      const storeReason = !hadTransfer
        ? `Store transfer #${transferNumber}`
        : transferWillExist
          ? `Store transfer edit #${transferNumber}`
          : `Store transfer deleted #${transferNumber}`;
      const receiptItems: StockReceiptItem[] = [];
      const writes: (() => void)[] = [];
      const products = new Map<string, Product>();
      const tag: ReceiptTag = { receiptId: id, effectiveAt: fields.date };
      ids.forEach((productId, index) => {
        const found = readProduct(snapshots[index]);
        const old = previous.items.find((item) => item.productId === productId);
        const line = fields.items.find((item) => item.productId === productId);
        if (!found) {
          // კატალოგიდან წაშლილი: ამოღებული ხაზი ნაშთს არ ეხება; დარჩენილი/ახალი ხაზი — შეცდომა
          if (line) throw Error(`პროდუქტი კატალოგიდან წაშლილია — ამოშალე ხაზი: ${old?.name || productId}`);
          return;
        }
        const retagged = retag(found.stockHistory || [], tag);
        const product = retagged ? { ...found, stockHistory: retagged } : found;
        products.set(productId, product);
        const update = stockUpdate(
          product,
          [
            { delta: (line?.quantity || 0) - (old?.quantity || 0), reason: `Receipt edit #${previous.receiptNumber}` },
            { delta: (old?.toStore || 0) - (line?.toStore || 0), reason: storeReason },
          ],
          now,
          tag,
        );
        if (update) writes.push(() => tx.update(refs[index], productUpdate(product, update, now)));
        else if (retagged) writes.push(() => tx.update(refs[index], { stockHistory: retagged, updatedAt: now }));
      });
      for (const line of fields.items) {
        const product = products.get(line.productId)!;
        const old = previous.items.find((item) => item.productId === line.productId);
        receiptItems.push({
          productId: line.productId,
          name: product.name,
          productCode: product.productCode || "",
          quantity: line.quantity,
          toStore: line.toStore,
          ...(old?.createdProduct ? { createdProduct: true } : {}),
        });
      }
      writes.forEach((write) => write());
      if (transferWillExist) {
        const oldTransferItems = (transferSnapshot?.exists() ? (transferSnapshot.data().items as StoreTransferItem[]) : []) || [];
        const transferItems: StoreTransferItem[] = fields.items
          .filter((line) => line.toStore > 0)
          .map((line) => {
            const product = products.get(line.productId)!;
            const kept = oldTransferItems.find((item) => item.productId === line.productId);
            // არსებული ხაზი ინარჩუნებს შენახვის მომენტის ფასს (როგორც მაღაზიაში), ახალი — მიმდინარეს.
            // 0 ფასი (ახალი პროდუქტი ფასამდე) ფასი არ არის — რედაქტირებისას მიმდინარე ფასს იღებს.
            return { productId: line.productId, name: product.name, price: kept && kept.price > 0 ? kept.price : salePrice(product), quantity: line.toStore };
          });
        if (hadTransfer && transferSnapshot?.exists()) {
          tx.update(transferRef, { items: transferItems, ...transferTotals(transferItems), date: fields.date, updatedAt: now, updatedBy: actor });
        } else {
          if (!store?.exists() && !hadTransfer)
            tx.set(storeRef, { name: DEFAULT_STORE.name, address: DEFAULT_STORE.address, isActive: true, createdAt: now });
          tx.set(transferRef, {
            transferNumber,
            type: "out",
            storeId: DEFAULT_STORE.id,
            storeName: DEFAULT_STORE.name,
            storeAddress: DEFAULT_STORE.address,
            items: transferItems,
            ...transferTotals(transferItems),
            note: `მიღება #${previous.receiptNumber}`,
            date: fields.date,
            createdAt: now,
            createdBy: actor,
            receiptId: id,
            receiptNumber: previous.receiptNumber,
          });
        }
      } else if (hadTransfer && transferSnapshot?.exists()) {
        tx.delete(transferRef);
      }
      tx.update(receiptRef, {
        date: fields.date,
        supplier: fields.supplier,
        documentNumber: fields.documentNumber,
        note: fields.note,
        items: receiptItems,
        ...receiptTotals(receiptItems),
        ...(transferWillExist
          ? { storeTransferId: transferId, storeTransferNumber: transferNumber }
          : { storeTransferId: deleteField(), storeTransferNumber: deleteField() }),
        updatedAt: now,
        updatedBy: actor,
      });
    });
  }

  static async remove(id: string): Promise<void> {
    if (!validId(id)) throw Error("ჩანაწერი არასწორია");
    await runTransaction(db, async (tx) => {
      await adminActor(tx);
      const receiptRef = doc(db, "stockReceipts", id);
      const receiptSnapshot = await tx.get(receiptRef);
      if (!receiptSnapshot.exists()) return;
      const previous = receiptSnapshot.data() as StockReceipt;
      const transferRef = previous.storeTransferId ? doc(db, "storeTransfers", previous.storeTransferId) : null;
      const transferSnapshot = transferRef ? await tx.get(transferRef) : null;
      const refs = previous.items.map((item) => doc(db, "products", item.productId));
      const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
      const now = new Date();
      const tag: ReceiptTag = { receiptId: id, effectiveAt: asDate(previous.date) };
      const writes: (() => void)[] = [];
      previous.items.forEach((item, index) => {
        const product = readProduct(snapshots[index]);
        if (!product) return; // კატალოგიდან წაშლილი — დასაბრუნებელი არსად არის
        const update = stockUpdate(
          product,
          [
            { delta: -item.quantity, reason: `Receipt deleted #${previous.receiptNumber}` },
            { delta: item.toStore, reason: `Store transfer deleted #${previous.storeTransferNumber || "—"}` },
          ],
          now,
          tag,
        );
        if (update) writes.push(() => tx.update(refs[index], productUpdate(product, update, now)));
      });
      writes.forEach((write) => write());
      if (transferRef && transferSnapshot?.exists()) tx.delete(transferRef);
      tx.delete(receiptRef);
    });
  }
}
