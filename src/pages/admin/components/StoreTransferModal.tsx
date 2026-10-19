import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, Package, Search, X } from "lucide-react";
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
  const [selectedOnly, setSelectedOnly] = useState(false);
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
              }))
            : [
                {
                  productId: product.id,
                  name: product.name,
                  code: product.productCode,
                  stock: product.stock || 0,
                },
              ],
        ),
    [products],
  );
  const currentItem = (
    item: Pick<StoreTransferInputItem, "productId" | "variantId">,
  ) => items.find((value) => transferItemKey(value) === transferItemKey(item));
  const previousQuantity = (
    item: Pick<StoreTransferInputItem, "productId" | "variantId">,
  ) =>
    transfer?.items.find(
      (value) => transferItemKey(value) === transferItemKey(item),
    )?.quantity || 0;
  const available = (item: CatalogItem) =>
    item.stock + (type === "out" ? previousQuantity(item) : 0);
  const afterSave = (item: CatalogItem) =>
    item.stock +
    (type === "out" ? -1 : 1) *
      ((currentItem(item)?.quantity || 0) - previousQuantity(item));
  const validQuantity = (quantity: number) =>
    Number.isSafeInteger(quantity) && quantity > 0;
  const invalid =
    items.some((item) => {
      const product = catalog.find(
        (value) => transferItemKey(value) === transferItemKey(item),
      );
      return (
        !product || !validQuantity(item.quantity) || afterSave(product) < 0
      );
    }) ||
    catalog.some(
      (product) => previousQuantity(product) > 0 && afterSave(product) < 0,
    );
  const matching = catalog.filter(
    (item) =>
      (!selectedOnly || !!currentItem(item)) &&
      `${item.name} ${item.code}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const shown = matching.slice(0, 100);
  const quantity = items.reduce(
    (sum, item) => sum + (validQuantity(item.quantity) ? item.quantity : 0),
    0,
  );
  const setQuantity = (product: CatalogItem, value: number) => {
    setError("");
    const key = transferItemKey(product);
    setItems((previous) => {
      const rest = previous.filter((item) => transferItemKey(item) !== key);
      return value === 0
        ? rest
        : [
            ...rest,
            {
              productId: product.productId,
              ...(product.variantId ? { variantId: product.variantId } : {}),
              quantity: value,
            },
          ];
    });
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
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 sm:px-6 sm:py-5 border-b border-gray-200 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-bold text-lg text-gray-900">
              {transfer
                ? "ჩანაწერის რედაქტირება"
                : type === "out"
                  ? "გატანა მაღაზიაში"
                  : "დაბრუნება საწყობში"}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              {type === "out" ? "საწყობი" : "ცინცაძის 2"}
              <ArrowRight size={14} />
              {type === "out" ? "ცინცაძის 2" : "საწყობი"}
            </p>
          </div>
          <button
            type="button"
            aria-label="დახურვა"
            disabled={saving}
            onClick={onClose}
            className="p-3 rounded-xl text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-900">
          {STORE_TRANSFERS_TEST_ONLY ? (
            <>
              <strong>მხოლოდ სატესტო პროდუქტები.</strong> რეალური პროდუქტების
              გატარება გამორთულია.
            </>
          ) : type === "out" ? (
            "მიუთითე, რამდენი ცალი გაგაქვს მაღაზიაში."
          ) : (
            "მიუთითე, რამდენი ცალი ბრუნდება საწყობში."
          )}
        </div>
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3.5 text-gray-400"
            />
            <input
              aria-label="პროდუქტის ძებნა"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="სახელი ან პროდუქტის კოდი"
              className="border border-gray-300 rounded-xl pl-10 pr-3 py-3 w-full focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-gray-500">
              რაოდენობა ჩაწერე პირდაპირ სიაში. ცარიელი ველი = არ შედის
              გატარებაში.
            </p>
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOnly}
                onChange={(event) => setSelectedOnly(event.target.checked)}
                className="accent-emerald-600 w-4 h-4"
              />
              მხოლოდ არჩეული ({items.length})
            </label>
          </div>
        </div>
        <div
          className="overflow-y-auto min-h-0 flex-1"
          role="region"
          aria-label="პროდუქტების რაოდენობები"
        >
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_100px_140px_110px] gap-4 px-6 py-3 bg-gray-50 text-xs text-gray-500 sticky top-0 border-b border-gray-200 z-10">
            <span>პროდუქტი</span>
            <span className="text-center">საწყობში ახლა</span>
            <span className="text-center">
              {type === "out"
                ? "გასატანი რაოდენობა"
                : "დასაბრუნებელი რაოდენობა"}
            </span>
            <span className="text-center">შენახვის შემდეგ</span>
          </div>
          {shown.map((product) => {
            const selected = currentItem(product),
              oldQuantity = previousQuantity(product),
              nextStock = afterSave(product);
            const changed = (selected?.quantity || 0) !== oldQuantity;
            const rowInvalid =
              (!!selected && !validQuantity(selected.quantity)) ||
              nextStock < 0;
            return (
              <div
                key={transferItemKey(product)}
                role="group"
                aria-label={product.name}
                className={`grid grid-cols-[1fr_110px] sm:grid-cols-[minmax(0,1fr)_100px_140px_110px] gap-x-4 gap-y-3 items-center px-4 sm:px-6 py-4 border-b border-gray-100 ${selected ? "bg-emerald-50/60" : oldQuantity ? "bg-amber-50/50" : "bg-white"}`}
              >
                <div className="min-w-0 col-span-2 sm:col-span-1">
                  <p className="font-medium text-sm text-gray-900 break-words">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{product.code}</p>
                  {transfer && oldQuantity > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ამ ჩანაწერში შენახულია: {oldQuantity} ცალი
                      {!selected ? " · სიიდან ამოღებულია" : ""}
                    </p>
                  )}
                </div>
                <div className="text-sm sm:text-center">
                  <span className="block sm:hidden text-xs text-gray-500 mb-1">
                    საწყობში ახლა
                  </span>
                  <strong className="text-gray-700">{product.stock}</strong>
                  <span className="sm:hidden text-gray-500"> ცალი</span>
                </div>
                <div className="sm:text-center">
                  <label className="block text-xs text-gray-500 sm:hidden mb-1">
                    {type === "out" ? "გასატანი" : "დასაბრუნებელი"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    max={type === "out" ? available(product) : undefined}
                    aria-label={`რაოდენობა: ${product.name}`}
                    value={selected?.quantity ?? ""}
                    placeholder="0"
                    disabled={
                      saving || (type === "out" && available(product) === 0)
                    }
                    onChange={(event) =>
                      setQuantity(product, Number(event.target.value))
                    }
                    className={`border rounded-lg px-3 min-h-11 w-full sm:w-28 text-base text-center bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 ${rowInvalid ? "border-red-400" : "border-gray-300 focus:border-emerald-600"}`}
                  />
                </div>
                <div
                  className="col-span-2 sm:col-span-1 flex sm:block items-center justify-between rounded-lg bg-gray-50 sm:bg-transparent px-3 py-2 sm:p-0 text-sm sm:text-center"
                  aria-label={`შენახვის შემდეგ: ${product.name}`}
                >
                  <span className="text-gray-500 sm:hidden">
                    შენახვის შემდეგ დარჩება
                  </span>
                  <strong
                    className={
                      rowInvalid
                        ? "text-red-700"
                        : changed
                          ? "text-emerald-700"
                          : "text-gray-500"
                    }
                  >
                    {rowInvalid ? "შეამოწმე" : nextStock}
                    <span className="sm:hidden font-normal">
                      {!rowInvalid && " ცალი"}
                    </span>
                  </strong>
                  {transfer && changed && !rowInvalid && (
                    <span className="block text-xs text-gray-500 sm:mt-1">
                      ცვლილება: {nextStock - product.stock > 0 ? "+" : ""}
                      {nextStock - product.stock}
                    </span>
                  )}
                </div>
                {rowInvalid && (
                  <p
                    role="alert"
                    className="col-span-2 sm:col-span-4 text-xs text-red-700"
                  >
                    {nextStock < 0
                      ? "საწყობში საკმარისი მარაგი არ არის."
                      : "ჩაწერე დადებითი მთელი რაოდენობა."}
                  </p>
                )}
              </div>
            );
          })}
          {!shown.length && (
            <div className="p-10 text-center text-gray-500">
              <Package size={30} className="mx-auto mb-3 text-gray-300" />
              <p>
                {selectedOnly && !items.length
                  ? "ჯერ რაოდენობა არცერთ პროდუქტზე არ შეგიტანია."
                  : "პროდუქტი ვერ მოიძებნა"}
              </p>
              {STORE_TRANSFERS_TEST_ONLY && !catalog.length && (
                <p className="text-xs mt-2">
                  ხელმისაწვდომია მხოლოდ მონიშნული TEST-STORE პროდუქტები.
                </p>
              )}
            </div>
          )}
          {matching.length > shown.length && (
            <p className="text-sm text-gray-500 px-6 py-3">
              ნაჩვენებია პირველი {shown.length} პროდუქტი. გამოიყენე ძებნა.
            </p>
          )}
        </div>
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200">
          <label className="text-xs font-medium text-gray-500">
            კომენტარი · სურვილისამებრ
            <textarea
              rows={1}
              maxLength={2000}
              value={note}
              disabled={saving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="მაგალითად: კვირის განმავლობაში გატანილი საქონელი"
              className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 min-h-10 max-h-24 text-sm"
            />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="border-t border-gray-200 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {items.length} პროდუქტი · {quantity} ცალი
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {transfer
                ? "შეინახება რაოდენობების სხვაობა, როგორც სიაშია ნაჩვენები."
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
              className="min-h-11 px-4 border border-gray-300 rounded-lg bg-white"
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
                    ? "გატანის შენახვა"
                    : "დაბრუნების შენახვა"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default StoreTransferModal;
