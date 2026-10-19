import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import {
  StoreTransferService,
  transferItemKey,
} from "../../../services/storeTransferService";
import {
  isStoreTestProduct,
  STORE_TRANSFERS_TEST_ONLY,
} from "../../../utils/storeCatalog";
import type {
  StoreTransfer,
  StoreTransferInputItem,
  StoreTransferType,
} from "../../../types/storeTransfer";

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
}

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const [requestId] = useState(() => StoreTransferService.newId());
  const catalog = useMemo(
    () =>
      products
        .filter(
          (product) =>
            !STORE_TRANSFERS_TEST_ONLY || isStoreTestProduct(product),
        )
        .flatMap<CatalogItem>((product) =>
          product.hasVariants
            ? (product.variants || []).map((variant) => ({
                productId: product.id,
                variantId: variant.id,
                name: `${product.name} — ${variant.name}`,
                code: product.productCode,
                stock: variant.stock || 0,
                image: product.images?.[0],
              }))
            : [
                {
                  productId: product.id,
                  name: product.name,
                  code: product.productCode,
                  stock: product.stock || 0,
                  image: product.images?.[0],
                },
              ],
        ),
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
    removed.some(
      (item) => !findProduct(item) || afterSave({ ...item, quantity: 0 }) < 0,
    );
  const quantity = items.reduce(
    (sum, item) =>
      sum +
      (Number.isSafeInteger(item.quantity) && item.quantity > 0
        ? item.quantity
        : 0),
    0,
  );
  const matching = catalog
    .filter((product) =>
      `${product.name} ${product.code}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
    )
    .slice(0, 8);
  const add = (product: CatalogItem) => {
    if (
      items.some((item) => transferItemKey(item) === transferItemKey(product))
    )
      return;
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
        aria-label="მაღაზიის მოძრაობა"
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <header className="px-4 sm:px-6 py-5 border-b border-gray-200 flex justify-between items-start gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">მაღაზია · ცინცაძის 2</p>
            <h2 className="font-bold text-xl text-gray-900">
              {transfer
                ? type === "out"
                  ? "გადატანის რედაქტირება"
                  : "დაბრუნების რედაქტირება"
                : type === "out"
                  ? "მაღაზიაში გადატანა"
                  : "საწყობში დაბრუნება"}
            </h2>
            <p className="flex items-center gap-2 text-sm text-gray-500 mt-2">
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
            className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </header>
        {STORE_TRANSFERS_TEST_ONLY && (
          <p className="px-4 sm:px-6 pt-3 text-xs text-amber-800">
            სატესტო რეჟიმი · მხოლოდ TEST-STORE პროდუქტები
          </p>
        )}
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
                  value={search}
                  disabled={saving}
                  onFocus={() => setPickerOpen(true)}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPickerOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                    if (event.key === "Escape") setPickerOpen(false);
                  }}
                  placeholder="სახელი ან პროდუქტის კოდი"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-normal"
                />
              </div>
            </label>
            {pickerOpen && (
              <div
                role="region"
                aria-label="ძებნის შედეგები"
                className="border border-gray-200 rounded-xl overflow-y-auto max-h-48 divide-y divide-gray-100"
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
                      aria-label={`დამატება: ${product.name}`}
                      disabled={saving || selected || unavailable}
                      onClick={() => add(product)}
                      className="w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.code} · საწყობში: {product.stock} ცალი
                        </p>
                      </div>
                      <span className="text-xs text-emerald-700 shrink-0">
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
                      className="p-3 sm:p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="hidden sm:flex w-12 h-12 rounded-lg bg-gray-50 items-center justify-center shrink-0 overflow-hidden">
                          {product?.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="text-gray-300 w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 break-words">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {product?.code}
                          </p>
                          {transfer && (
                            <p className="text-xs text-gray-500 mt-1">
                              ამ ჩანაწერში იყო: {oldQuantity(item)} ცალი
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`ამოშლა: ${name}`}
                          disabled={saving}
                          onClick={() =>
                            setItems((previous) =>
                              previous.filter(
                                (_, position) => position !== index,
                              ),
                            )
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>საწყობში ახლა: {product?.stock || 0} ცალი</p>
                          <p aria-label={`შენახვის შემდეგ: ${name}`}>
                            შენახვის შემდეგ საწყობში:{" "}
                            <strong
                              className={
                                valid ? "text-gray-700" : "text-red-700"
                              }
                            >
                              {valid
                                ? `${afterSave(item)} ცალი`
                                : "შეამოწმე რაოდენობა"}
                            </strong>
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          {transfer ? "სრული რაოდენობა" : "რაოდენობა"}
                          <input
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
                            className={`w-24 min-h-11 border rounded-lg px-3 text-center text-base bg-white ${valid ? "border-gray-300" : "border-red-400"}`}
                          />
                          <span>ცალი</span>
                        </label>
                      </div>
                      {!valid && (
                        <p role="alert" className="text-xs text-red-700">
                          {!product
                            ? "პროდუქტი აღარ არის ხელმისაწვდომი."
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
                  {item.name} · შენახვის შემდეგ საწყობში:{" "}
                  {afterSave({ ...item, quantity: 0 })} ცალი
                </p>
              ))}
            </div>
          )}
          <label className="block text-sm font-semibold text-gray-800">
            კომენტარი{" "}
            <span className="font-normal text-xs text-gray-400">
              · სურვილისამებრ
            </span>
            <textarea
              rows={2}
              maxLength={2000}
              value={note}
              disabled={saving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="მაგალითად: ამ კვირაში მაღაზიაში გადატანილი საქონელი"
              className="block mt-2 w-full border border-gray-300 rounded-xl p-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
              className="min-h-11 px-5 rounded-lg bg-emerald-600 text-white disabled:opacity-40"
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
