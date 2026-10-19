import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import type { Transaction } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  isStoreTestProduct,
  STORE_TRANSFERS_TEST_ONLY,
} from "../utils/storeCatalog";
import type { OrderActor, Product, ProductVariant } from "../types";
import type {
  StoreTransfer,
  StoreTransferInputItem,
  StoreTransferItem,
  StoreTransferRequest,
} from "../types/storeTransfer";

export const DEFAULT_STORE = {
  id: "tsintsadze-2",
  name: "ცინცაძის 2",
  address: "ცინცაძის 2",
};
export const transferItemKey = (
  item: Pick<StoreTransferInputItem, "productId" | "variantId">,
): string => JSON.stringify([item.productId, item.variantId || ""]);
const validId = (id: string) =>
  typeof id === "string" &&
  !!id &&
  !id.includes("/") &&
  !id.startsWith("manual_");

function normalize(items: StoreTransferInputItem[]): StoreTransferInputItem[] {
  if (!Array.isArray(items) || !items.length || items.length > 200)
    throw Error("აირჩიე 1–200 პროდუქტის ხაზი");
  const grouped = new Map<string, StoreTransferInputItem>();
  for (const item of items) {
    if (
      !validId(item.productId) ||
      (item.variantId !== undefined && !validId(item.variantId))
    )
      throw Error("აირჩიე არსებული პროდუქტი");
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
      throw Error("რაოდენობა უნდა იყოს დადებითი მთელი რიცხვი");
    const key = transferItemKey(item),
      previous = grouped.get(key);
    const quantity = (previous?.quantity || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity))
      throw Error("რაოდენობა ზედმეტად დიდია");
    grouped.set(key, {
      productId: item.productId,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      quantity,
    });
  }
  return [...grouped.values()].sort((a, b) =>
    transferItemKey(a).localeCompare(transferItemKey(b)),
  );
}

async function adminActor(tx: Transaction): Promise<OrderActor> {
  const user = auth.currentUser;
  if (!user) throw Error("საჭიროა ადმინისტრატორის ანგარიშით შესვლა");
  const profile = await tx.get(doc(db, "users", user.uid));
  if (profile.data()?.role !== "admin")
    throw Error("მაღაზიაზე წვდომა მხოლოდ ადმინისტრატორს აქვს");
  return {
    uid: user.uid,
    email: user.email || "",
    ...(user.displayName ? { name: user.displayName } : {}),
  };
}

// ყველა პროდუქტი იკითხება პირველ ჩაწერამდე. ერთი SKU-ის ხაზები ერთად მუშავდება.
async function applyStockDeltasInTransaction(
  tx: Transaction,
  deltas: (StoreTransferInputItem & { delta: number })[],
  reason: string,
  now: Date,
): Promise<Map<string, Product>> {
  const ids = [...new Set(deltas.map((item) => item.productId))];
  const refs = ids.map((id) => doc(db, "products", id));
  const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
  const products = new Map<string, Product>();
  const changes: { index: number; values: Record<string, unknown> }[] = [];
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists()) throw Error(`პროდუქტი ვერ მოიძებნა: ${ids[index]}`);
    const product = { ...snapshot.data(), id: ids[index] } as Product;
    if (STORE_TRANSFERS_TEST_ONLY && !isStoreTestProduct(product)) {
      throw Error(
        "ტესტირებისას დასაშვებია მხოლოდ TEST-STORE პროდუქტები. რეალურ საწყობზე მოქმედება დაბლოკილია.",
      );
    }
    products.set(product.id, product);
    const grouped = new Map<string, number>();
    for (const item of deltas.filter((item) => item.productId === product.id))
      grouped.set(
        item.variantId || "",
        (grouped.get(item.variantId || "") || 0) + item.delta,
      );
    const history = (quantity: number) => ({
      timestamp: now,
      quantity,
      reason,
    });
    const check = (stock: number, delta: number) => {
      if (
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
        !Number.isSafeInteger(delta) ||
        stock + delta < 0 ||
        !Number.isSafeInteger(stock + delta)
      )
        throw Error(`არასაკმარისი მარაგი: ${product.name}`);
      return stock + delta;
    };
    if (product.hasVariants) {
      if (grouped.has(""))
        throw Error(`აირჩიე პროდუქტის ვარიანტი: ${product.name}`);
      const variants: ProductVariant[] = (product.variants || []).map(
        (variant) => ({ ...variant }),
      );
      for (const [variantId, delta] of grouped) {
        const position = variants.findIndex(
          (variant) => variant.id === variantId,
        );
        if (position < 0) throw Error(`ვარიანტი ვერ მოიძებნა: ${product.name}`);
        if (!delta) continue;
        const variant = variants[position],
          stock = check(variant.stock ?? 0, delta);
        variants[position] = {
          ...variant,
          stock,
          updatedAt: now,
          stockHistory: [...(variant.stockHistory || []), history(stock)],
        };
      }
      if ([...grouped.values()].some(Boolean)) {
        const stock = variants.reduce(
          (sum, variant) => sum + check(variant.stock ?? 0, 0),
          0,
        );
        if (!Number.isSafeInteger(stock))
          throw Error(`არასწორი მარაგი: ${product.name}`);
        changes.push({
          index,
          values: {
            variants,
            stock,
            totalStock: stock,
            updatedAt: now,
            lastStockReason: reason,
            stockHistory: [...(product.stockHistory || []), history(stock)],
          },
        });
      }
    } else {
      if ([...grouped.keys()].some(Boolean))
        throw Error(`პროდუქტს ვარიანტი არ აქვს: ${product.name}`);
      const delta = grouped.get("") || 0;
      if (delta) {
        const stock = check(product.stock ?? 0, delta);
        changes.push({
          index,
          values: {
            stock,
            totalStock: stock,
            updatedAt: now,
            lastStockReason: reason,
            stockHistory: [...(product.stockHistory || []), history(stock)],
          },
        });
      }
    }
  });
  for (const change of changes) tx.update(refs[change.index], change.values);
  return products;
}

function snapshots(
  items: StoreTransferInputItem[],
  products: Map<string, Product>,
  previous: StoreTransferItem[] = [],
): StoreTransferItem[] {
  return items.map((item) => {
    const existing = previous.find(
      (old) => transferItemKey(old) === transferItemKey(item),
    );
    if (existing) return { ...existing, quantity: item.quantity };
    const product = products.get(item.productId)!;
    const variant = item.variantId
      ? product.variants?.find((value) => value.id === item.variantId)
      : undefined;
    const value = variant || product;
    const price =
      value.salePrice && value.salePrice > 0 && value.salePrice < value.price
        ? value.salePrice
        : value.price;
    if (!Number.isFinite(price) || price < 0)
      throw Error(`პროდუქტის ფასი არასწორია: ${product.name}`);
    return {
      ...item,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      price,
    };
  });
}
const totals = (items: StoreTransferItem[]) => ({
  totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  totalValue:
    Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    ) / 100,
});
const date = (value: unknown): Date =>
  value instanceof Date ? value : (value as { toDate: () => Date }).toDate();

export class StoreTransferService {
  static newId(): string {
    return doc(collection(db, "storeTransfers")).id;
  }

  static subscribe(
    next: (items: StoreTransfer[]) => void,
    error: (error: Error) => void,
  ): () => void {
    return onSnapshot(
      query(collection(db, "storeTransfers"), orderBy("date", "desc")),
      (snapshot) =>
        next(
          snapshot.docs.map((item) => {
            const data = item.data();
            return {
              ...data,
              id: item.id,
              date: date(data.date),
              createdAt: date(data.createdAt),
              ...(data.updatedAt ? { updatedAt: date(data.updatedAt) } : {}),
            } as StoreTransfer;
          }),
        ),
      error,
    );
  }

  static async create(
    request: StoreTransferRequest,
    id = this.newId(),
  ): Promise<string> {
    if (!validId(id) || !["out", "return"].includes(request.type))
      throw Error("გატანის მონაცემები არასწორია");
    const items = normalize(request.items),
      note = (request.note || "").trim();
    if (note.length > 2000) throw Error("კომენტარი ზედმეტად გრძელია");
    const requestKey = JSON.stringify({ type: request.type, items, note });
    const ref = doc(db, "storeTransfers", id),
      storeRef = doc(db, "stores", DEFAULT_STORE.id),
      now = new Date();
    await runTransaction(db, async (tx) => {
      const actor = await adminActor(tx);
      const [existing, store] = await Promise.all([
        tx.get(ref),
        tx.get(storeRef),
      ]);
      if (existing.exists()) {
        if (
          existing.data().requestKey === requestKey &&
          existing.data().createdBy.uid === actor.uid
        )
          return;
        throw Error("ეს ოპერაცია უკვე შენახულია — გადაამოწმე ისტორია");
      }
      if (store.exists() && store.data().isActive === false)
        throw Error("მაღაზია არააქტიურია");
      const transferNumber = `ST-${now.getFullYear()}-${id.slice(0, 10).toUpperCase()}`;
      const sign = request.type === "out" ? -1 : 1;
      const products = await applyStockDeltasInTransaction(
        tx,
        items.map((item) => ({ ...item, delta: sign * item.quantity })),
        `${request.type === "out" ? "Store transfer" : "Store return"} #${transferNumber}`,
        now,
      );
      const savedItems = snapshots(items, products);
      if (!store.exists())
        tx.set(storeRef, {
          name: DEFAULT_STORE.name,
          address: DEFAULT_STORE.address,
          isActive: true,
          createdAt: now,
        });
      tx.set(ref, {
        transferNumber,
        type: request.type,
        storeId: DEFAULT_STORE.id,
        storeName: DEFAULT_STORE.name,
        storeAddress: DEFAULT_STORE.address,
        items: savedItems,
        ...totals(savedItems),
        note,
        date: now,
        createdAt: now,
        createdBy: actor,
        requestKey,
      });
    });
    return id;
  }

  static async update(
    id: string,
    request: Pick<StoreTransferRequest, "items" | "note">,
  ): Promise<void> {
    if (!validId(id)) throw Error("ჩანაწერი არასწორია");
    const items = normalize(request.items),
      note = (request.note || "").trim();
    if (note.length > 2000) throw Error("კომენტარი ზედმეტად გრძელია");
    await runTransaction(db, async (tx) => {
      const actor = await adminActor(tx),
        ref = doc(db, "storeTransfers", id),
        snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw Error("ჩანაწერი აღარ არსებობს");
      const previous = snapshot.data() as StoreTransfer,
        sign = previous.type === "out" ? -1 : 1,
        now = new Date();
      const deltas = [
        ...previous.items.map((item) => ({
          ...item,
          delta: -sign * item.quantity,
        })),
        ...items.map((item) => ({ ...item, delta: sign * item.quantity })),
      ];
      const products = await applyStockDeltasInTransaction(
        tx,
        deltas,
        `${previous.type === "out" ? "Store transfer" : "Store return"} edit #${previous.transferNumber}`,
        now,
      );
      const savedItems = snapshots(items, products, previous.items);
      tx.update(ref, {
        items: savedItems,
        ...totals(savedItems),
        note,
        updatedAt: now,
        updatedBy: actor,
      });
    });
  }

  static async remove(id: string): Promise<void> {
    if (!validId(id)) throw Error("ჩანაწერი არასწორია");
    await runTransaction(db, async (tx) => {
      await adminActor(tx);
      const ref = doc(db, "storeTransfers", id),
        snapshot = await tx.get(ref);
      if (!snapshot.exists()) return;
      const previous = snapshot.data() as StoreTransfer,
        sign = previous.type === "out" ? 1 : -1;
      await applyStockDeltasInTransaction(
        tx,
        previous.items.map((item) => ({
          ...item,
          delta: sign * item.quantity,
        })),
        `${previous.type === "out" ? "Store transfer" : "Store return"} deleted #${previous.transferNumber}`,
        new Date(),
      );
      tx.delete(ref);
    });
  }
}
