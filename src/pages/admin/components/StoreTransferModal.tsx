import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import {
  StoreTransferService,
  transferItemKey,
} from "../../../services/storeTransferService";
import type {
  StoreTransfer,
  StoreTransferInputItem,
  StoreTransferType,
} from "../../../types/storeTransfer";
import { STORE_TRANSFER_UI } from "./storeTransferUi";

interface Props {
  type: StoreTransferType;
  transfer?: StoreTransfer;
  onClose: () => void;
}
interface CatalogItem {
  productId: string;
  variantId?: string;
  name: string;
  code: string;
  stock: number;
  image?: string;
  hidden: boolean; // საიტზე არააქტიური (მაგ. მხოლოდ მაღაზიისთვის ნაყიდი)
}

// ძებნის სიაში ერთდროულად ნაჩვენები შედეგები — დანარჩენზე ძებნის დაზუსტება სჯობს
const SEARCH_RESULTS_LIMIT = 30;

const StoreTransferModal: React.FC<Props> = ({ type, transfer, onClose }) => {
  const { products } = useProductStore();
  const [items, setItems] = useState<StoreTransferInputItem[]>(
    () =>
      transfer?.items.map(({ productId, variantId, quantity }) => ({
        productId,
        ...(variantId ? { variantId } : {}),
        quantity,
      })) || [],
  );
  const [note, setNote] = useState(transfer?.note || "");
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const quantityInputs = useRef(new Map<string, HTMLInputElement>());
  const resultButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingQuantityFocus = useRef<string | null>(null);
  const ui = STORE_TRANSFER_UI[type];
  const [requestId] = useState(() => StoreTransferService.newId());
  // მთელი კატალოგი (პროდუქტები/საწყობი) real-time-ში — ახალი პროდუქტი აქ ავტომატურად ჩნდება.
  // არააქტიურიც ჩანს: საიტზე დამალული საქონელიც შეიძლება გადავიდეს მაღაზიაში.
  const catalog = useMemo(
    () =>
      products
        .flatMap<CatalogItem>((product) =>
          product.hasVariants
            ? (product.variants || []).map((variant) => ({
                productId: product.id,
                variantId: variant.id,
                name: `${product.name} — ${variant.name}`,
                code: product.productCode,
                stock: variant.stock || 0,
                image: product.images?.[0],
                hidden: product.isActive === false || variant.isActive === false,
              }))
            : [
                {
                  productId: product.id,
                  name: product.name,
                  code: product.productCode,
                  stock: product.stock || 0,
                  image: product.images?.[0],
                  hidden: product.isActive === false,
                },
              ],
        )
        .sort((a, b) => a.name.localeCompare(b.name, "ka")),
    [products],
  );
  const findProduct = (item: StoreTransferInputItem) =>
    catalog.find(
      (product) => transferItemKey(product) === transferItemKey(item),
    );
  const oldQuantity = (
    item: Pick<StoreTransferInputItem, "productId" | "variantId">,
  ) =>
    transfer?.items.find(
      (old) => transferItemKey(old) === transferItemKey(item),
    )?.quantity || 0;
  const afterSave = (item: StoreTransferInputItem) =>
    (findProduct(item)?.stock || 0) +
    (type === "out" ? -1 : 1) * (item.quantity - oldQuantity(item));
  const removed =
    transfer?.items.filter(
      (old) =>
        !items.some((item) => transferItemKey(item) === transferItemKey(old)),
    ) || [];
  const invalid =
    items.some(
      (item) =>
        !findProduct(item) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        afterSave(item) < 0,
    ) ||
    // კატალოგიდან წაშლილი პროდუქტის ამოღება ნაშთს არ ცვლის — მხოლოდ არსებულს ვამოწმებთ
    removed.some(
      (item) => !!findProduct(item) && afterSave({ ...item, quantity: 0 }) < 0,
    );
  const quantity = items.reduce(
    (sum, item) =>
      sum +
      (Number.isSafeInteger(item.quantity) && item.quantity > 0
        ? item.quantity
        : 0),
    0,
  );
  const allMatching = catalog.filter((product) =>
    `${product.name} ${product.code}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const matching = allMatching.slice(0, SEARCH_RESULTS_LIMIT);
  const availableMatches = matching.filter(
    (product) =>
      !items.some((item) => transferItemKey(item) === transferItemKey(product)) &&
      !(type === "out" && product.stock + oldQuantity(product) <= 0),
  );
  const highlightedProduct = availableMatches[Math.min(highlightIndex, availableMatches.length - 1)];
  const highlightedKey = highlightedProduct ? transferItemKey(highlightedProduct) : null;
  useEffect(() => {
    const key = pendingQuantityFocus.current;
    if (!key) return;
    const input = quantityInputs.current.get(key);
    if (input) {
      input.focus();
      input.select();
      pendingQuantityFocus.current = null;
    }
  }, [items]);
  useEffect(() => {
    if (pickerOpen && highlightedKey) {
      resultButtons.current.get(highlightedKey)?.scrollIntoView({ block: "nearest" });
    }
  }, [pickerOpen, highlightedKey]);
  const add = (product: CatalogItem) => {
    if (
      items.some((item) => transferItemKey(item) === transferItemKey(product))
    )
      return;
    pendingQuantityFocus.current = transferItemKey(product);
    setItems((previous) => [
      ...previous,
      {
        productId: product.productId,
        ...(product.variantId ? { variantId: product.variantId } : {}),
        quantity: 1,
      },
    ]);
    setSearch("");
    setPickerOpen(false);
    setHighlightIndex(0);
    setError("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    if (!items.length || invalid) {
      setError("გადაამოწმე არჩეული პროდუქტები და რაოდენობები");
      return;
    }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      if (transfer)
        await StoreTransferService.update(transfer.id, { items, note });
      else await StoreTransferService.create({ type, items, note }, requestId);
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "შენახვა ვერ მოხერხდა",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 p-2 sm:p-5 flex items-center justify-center">
      <form
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing) event.preventDefault();
        }}
        aria-label="მაღაზიის მოძრაობა"
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <header className="px-4 sm:px-6 py-5 border-b border-gray-200 flex justify-between items-start gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">მაღაზია · ცინცაძის 2</p>
            <h2 className={`font-bold text-xl ${ui.text}`}>
              {transfer
                ? type === "out"
                  ? "გადატანის რედაქტირება"
                  : "დაბრუნების რედაქტირება"
                : type === "out"
                  ? "მაღაზიაში გადატანა"
                  : "საწყობში დაბრუნება"}
            </h2>
            <p className={`flex items-center gap-2 text-sm mt-2 ${ui.text}`}>
              {type === "out" ? "საწყობი" : "მაღაზია"}
              <ArrowRight size={14} />
              {type === "out" ? "მაღაზია" : "საწყობი"}
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-lg">
              {transfer
                ? "მიუთითე სრული რაოდენობები. საწყობის ნაშთი მხოლოდ ძველ და ახალ რაოდენობებს შორის სხვაობით გასწორდება."
                : type === "out"
                  ? "აირჩიე პროდუქტები და მიუთითე გადატანილი რაოდენობები."
                  : "აირჩიე პროდუქტები და მიუთითე დაბრუნებული რაოდენობები."}
            </p>
          </div>
          <button
            type="button"
            aria-label="დახურვა"
            disabled={saving}
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          <section aria-label="პროდუქტის დამატება" className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 block">
              პროდუქტის დამატება
              <div className="relative mt-2">
                <Search
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <input
                  ref={searchInput}
                  autoFocus
                  value={search}
                  disabled={saving}
                  onFocus={() => { setPickerOpen(true); setHighlightIndex(0); }}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPickerOpen(true);
                    setHighlightIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (pickerOpen && highlightedProduct) add(highlightedProduct);
                    }
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setPickerOpen(true);
                      if (availableMatches.length) {
                        const step = event.key === "ArrowDown" ? 1 : -1;
                        setHighlightIndex((index) => pickerOpen ? (index + step + availableMatches.length) % availableMatches.length : 0);
                      }
                    }
                    if (event.key === "Escape") setPickerOpen(false);
                  }}
                  aria-describedby="store-product-search-help"
                  placeholder="სახელი ან პროდუქტის კოდი"
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 font-normal placeholder:text-gray-500 ${ui.focus}`}
                />
              </div>
            </label>
            <p id="store-product-search-help" className="text-xs text-gray-500">
              ↑↓ არჩევა · Enter დამატება · რაოდენობიდან Enter ძებნაზე დაბრუნება
            </p>
            {pickerOpen && (
              <div
                role="region"
                aria-label="ძებნის შედეგები"
                className="border border-gray-200 rounded-xl overflow-y-auto max-h-72 divide-y divide-gray-100"
              >
                {matching.map((product) => {
                  const selected = items.some(
                    (item) =>
                      transferItemKey(item) === transferItemKey(product),
                  );
                  const unavailable =
                    type === "out" && product.stock + oldQuantity(product) <= 0;
                  return (
                    <button
                      key={transferItemKey(product)}
                      type="button"
                      ref={(node) => { const key = transferItemKey(product); if (node) resultButtons.current.set(key, node); else resultButtons.current.delete(key); }}
                      aria-label={`დამატება: ${product.name}`}
                      aria-current={highlightedKey === transferItemKey(product) ? "true" : undefined}
                      disabled={saving || selected || unavailable}
                      onClick={() => add(product)}
                      className={`w-full min-h-11 text-left px-3 py-3 flex items-center gap-3 disabled:opacity-50 ${ui.result} ${highlightedKey === transferItemKey(product) ? ui.selectedResult : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.code} · საწყობში: {product.stock} ცალი
                          {product.hidden && (
                            <span className="ml-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                              საიტზე დამალულია
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-xs shrink-0 ${ui.text}`}>
                        {selected ? (
                          "დამატებულია"
                        ) : unavailable ? (
                          "მარაგი არ არის"
                        ) : (
                          <Plus size={19} />
                        )}
                      </span>
                    </button>
                  );
                })}
                {!matching.length && (
                  <p className="p-4 text-sm text-gray-500">
                    პროდუქტი ვერ მოიძებნა
                  </p>
                )}
                {allMatching.length > matching.length && (
                  <p className="p-3 text-xs text-gray-500 bg-gray-50">
                    ნაჩვენებია {matching.length} / {allMatching.length} — დააზუსტე
                    ძებნა სახელით ან კოდით
                  </p>
                )}
              </div>
            )}
          </section>
          <section aria-label="გატარების პროდუქტები" className="space-y-3">
            <div className="flex justify-between items-center gap-3">
              <h3 className="font-semibold text-sm text-gray-900">
                არჩეული პროდუქტები
              </h3>
              <span className="text-xs text-gray-500">
                {items.length} პროდუქტი
              </span>
            </div>
            {!items.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-8 px-4 text-center">
                <Package size={28} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  ჯერ დაამატე პროდუქტი
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  მოძებნე სახელით ან კოდით. ერთ ჩანაწერში შეგიძლია
                  რამდენიმე პროდუქტი დაამატო.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                <div aria-hidden="true" className="hidden md:grid grid-cols-[minmax(0,1fr)_5rem_6.5rem_6rem_2.75rem] gap-x-2 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span>პროდუქტი / კოდი</span>
                  <span className="text-center">საწყობში ახლა</span>
                  <span className="text-center">{transfer ? "სრული რაოდენობა" : "რაოდენობა"}</span>
                  <span className="text-center">შენახვის შემდეგ</span>
                  <span className="sr-only">ამოშლა</span>
                </div>
                {items.map((item, index) => {
                  const product = findProduct(item),
                    original = transfer?.items.find(
                      (old) => transferItemKey(old) === transferItemKey(item),
                    );
                  const name =
                    product?.name || original?.name || item.productId;
                  const valid =
                    !!product &&
                    Number.isSafeInteger(item.quantity) &&
                    item.quantity > 0 &&
                    afterSave(item) >= 0;
                  return (
                    <div
                      key={transferItemKey(item)}
                      role="group"
                      aria-label={name}
                      className={`relative grid grid-cols-3 md:grid-cols-[minmax(0,1fr)_5rem_6.5rem_6rem_2.75rem] items-center gap-x-2 gap-y-2 px-3 py-2 border-l-2 ${valid ? "border-l-transparent" : "border-l-red-600 bg-red-50"}`}
                    >
                      <div className="col-span-3 md:col-span-1 min-w-0 pr-11 md:pr-0">
                          <p className="font-medium text-sm text-gray-900 truncate" title={name}>
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {product?.code}
                            {transfer ? ` · ამ ჩანაწერში იყო: ${oldQuantity(item)} ცალი` : ""}
                          </p>
                      </div>
                      <div className="min-w-0 text-center" aria-label={`საწყობში ახლა: ${product?.stock || 0} ცალი`}>
                        <p className="md:hidden text-xs text-gray-500">ახლა</p>
                        <p className="text-sm text-gray-700 tabular-nums">{product?.stock || 0}</p>
                      </div>
                      <label className="min-w-0 text-center text-xs text-gray-600">
                          <span className="md:sr-only">{transfer ? "სრული რაოდენობა" : "რაოდენობა"}</span>
                          <input
                            ref={(node) => { const key = transferItemKey(item); if (node) quantityInputs.current.set(key, node); else quantityInputs.current.delete(key); }}
                            aria-label={`რაოდენობა: ${name}`}
                            type="number"
                            min="1"
                            step="1"
                            required
                            max={
                              type === "out"
                                ? (product?.stock || 0) + oldQuantity(item)
                                : undefined
                            }
                            value={item.quantity || ""}
                            disabled={saving}
                            aria-invalid={!valid}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                                event.preventDefault();
                                searchInput.current?.focus();
                              }
                            }}
                            onChange={(event) =>
                              setItems((previous) =>
                                previous.map((value, position) =>
                                  position === index
                                    ? {
                                        ...value,
                                        quantity: Number(event.target.value),
                                      }
                                    : value,
                                ),
                              )
                            }
                            className={`w-full min-w-0 min-h-11 border rounded-lg px-2 text-center text-base bg-white outline-none focus:ring-2 ${ui.focus} ${valid ? "border-gray-300" : "border-red-400"}`}
                          />
                      </label>
                      <div className="min-w-0 text-center" aria-label={`შენახვის შემდეგ: ${name}`}>
                        <p className="md:hidden text-xs text-gray-500">შემდეგ</p>
                        <p className={`text-sm font-semibold tabular-nums ${valid ? ui.text : "text-red-700"}`}>{valid ? afterSave(item) : "—"}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`ამოშლა: ${name}`}
                        disabled={saving}
                        onClick={() => setItems((previous) => previous.filter((_, position) => position !== index))}
                        className="absolute right-3 top-2 md:static min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                      {!valid && (
                        <p role="alert" className="col-span-3 md:col-span-5 text-xs text-red-700">
                          {!product
                            ? "პროდუქტი კატალოგიდან წაშლილია — ამოშალე ეს ხაზი."
                            : afterSave(item) < 0
                              ? "საწყობში საკმარისი მარაგი არ არის."
                              : "ჩაწერე დადებითი მთელი რაოდენობა."}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          {!!removed.length && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p className="font-medium">ჩანაწერიდან ამოღებული პროდუქტები</p>
              {removed.map((item) => (
                <p
                  key={transferItemKey(item)}
                  aria-label={`შენახვის შემდეგ: ${item.name}`}
                >
                  {item.name} ·{" "}
                  {findProduct(item)
                    ? `შენახვის შემდეგ საწყობში: ${afterSave({ ...item, quantity: 0 })} ცალი`
                    : "პროდუქტი კატალოგიდან წაშლილია — ნაშთი არ შეიცვლება"}
                </p>
              ))}
            </div>
          )}
          <label className="block text-sm font-semibold text-gray-800">
            კომენტარი{" "}
            <span className="font-normal text-xs text-gray-500">
              · სურვილისამებრ
            </span>
            <textarea
              rows={2}
              maxLength={2000}
              value={note}
              disabled={saving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="მაგალითად: ამ კვირაში მაღაზიაში გადატანილი საქონელი"
              className={`block mt-2 w-full border border-gray-300 rounded-xl p-3 text-sm font-normal outline-none focus:ring-2 placeholder:text-gray-500 ${ui.focus}`}
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <div>
            <p className="font-semibold text-sm">
              {items.length} პროდუქტი · {quantity} ცალი
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {transfer
                ? "შენახვისას განახლდება ეს ჩანაწერი და გასწორდება ნაშთები."
                : type === "out"
                  ? `შენახვისას საწყობს გამოაკლდება ${quantity} ცალი.`
                  : `შენახვისას საწყობს დაემატება ${quantity} ცალი.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-11 px-4 rounded-lg border border-gray-300 bg-white"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={saving || !items.length || invalid}
              className={`min-h-11 px-5 rounded-lg disabled:opacity-40 ${ui.button}`}
            >
              {saving
                ? "ინახება…"
                : transfer
                  ? "ცვლილებების შენახვა"
                  : type === "out"
                    ? "გადატანის შენახვა"
                    : "დაბრუნების შენახვა"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
export default StoreTransferModal;
