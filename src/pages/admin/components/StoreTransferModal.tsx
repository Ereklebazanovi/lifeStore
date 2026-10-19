import React, { useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const [requestId] = useState(() => StoreTransferService.newId());
  const catalog = useMemo(
    () =>
      products.flatMap<CatalogItem>((product) =>
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
  const available = (item: StoreTransferInputItem) => {
    const current = catalog.find(
      (product) => transferItemKey(product) === transferItemKey(item),
    );
    const reserved =
      type === "out"
        ? transfer?.items
            .filter((old) => transferItemKey(old) === transferItemKey(item))
            .reduce((sum, old) => sum + old.quantity, 0) || 0
        : 0;
    return (current?.stock || 0) + reserved;
  };
  const filtered = catalog
    .filter((item) =>
      `${item.name} ${item.code}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .slice(0, 100);
  const add = (item: (typeof catalog)[number]) => {
    const key = transferItemKey(item);
    setItems((previous) =>
      previous.some((value) => transferItemKey(value) === key)
        ? previous.map((value) =>
            transferItemKey(value) === key
              ? { ...value, quantity: value.quantity + 1 }
              : value,
          )
        : [
            ...previous,
            {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
              quantity: 1,
            },
          ],
    );
  };
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    if (!items.length) {
      setError("აირჩიე მინიმუმ ერთი პროდუქტი");
      return;
    }
    if (
      type === "out" &&
      items.some((item) => item.quantity > available(item))
    ) {
      setError("არასაკმარისი მარაგი — გადაამოწმე მითითებული რაოდენობები");
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
    <div className="fixed inset-0 z-[9999] bg-black/50 p-2 sm:p-5 flex items-center justify-center">
      <form
        onSubmit={submit}
        aria-label="მაღაზიის მოძრაობა"
        className="bg-white rounded-xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-xl"
      >
        <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg">
              {transfer
                ? "ჩანაწერის რედაქტირება"
                : type === "out"
                  ? "გატანა მაღაზიაში"
                  : "დაბრუნება საწყობში"}
            </h2>
            <p className="text-sm text-gray-500">
              ცინცაძის 2 ·{" "}
              {transfer?.transferNumber || "რამდენიმე პროდუქტი ერთ ჩანაწერში"}
            </p>
          </div>
          <button
            type="button"
            aria-label="დახურვა"
            disabled={saving}
            onClick={onClose}
            className="p-3 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5 space-y-5">
          <p className="text-sm rounded-lg p-3 bg-blue-50 text-blue-800">
            {type === "out"
              ? "შენახვისას მითითებული რაოდენობები საწყობს გამოაკლდება."
              : "შენახვისას მითითებული რაოდენობები საწყობს დაემატება."}{" "}
            ერთ ჩანაწერში შეგიძლია რამდენიმე პროდუქტი შეიტანო.
          </p>
          <section aria-label="არჩეული პროდუქტები" className="space-y-2">
            <h3 className="font-semibold">
              არჩეული პროდუქტები ({items.length})
            </h3>
            {!items.length && (
              <p className="text-sm text-gray-500 py-3">
                ქვემოთ მოძებნე პროდუქტი და დაამატე სიაში.
              </p>
            )}
            {items.map((item, index) => {
              const key = transferItemKey(item),
                product = catalog.find(
                  (value) => transferItemKey(value) === key,
                ),
                original = transfer?.items.find(
                  (value) => transferItemKey(value) === key,
                );
              const name = product?.name || original?.name || item.productId;
              return (
                <div
                  key={key}
                  className="border rounded-lg p-3 flex flex-wrap sm:flex-nowrap items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium break-words">{name}</p>
                    <p className="text-xs text-gray-500">
                      {product?.code} · საწყობში: {product?.stock || 0}
                      {transfer && type === "out"
                        ? ` · ხელმისაწვდომია ამ ჩანაწერის ჩათვლით: ${available(item)}`
                        : ""}
                    </p>
                  </div>
                  <label className="text-xs text-gray-600">
                    რაოდენობა
                    <input
                      aria-label={`რაოდენობა: ${name}`}
                      type="number"
                      min="1"
                      step="1"
                      required
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
                      className="block w-24 min-h-11 border rounded-md px-3 text-base"
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`ამოშლა: ${name}`}
                    disabled={saving}
                    onClick={() =>
                      setItems((previous) =>
                        previous.filter((_, position) => position !== index),
                      )
                    }
                    className="p-3 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </section>
          <section aria-label="პროდუქტის არჩევა" className="space-y-3">
            <label className="block text-sm font-medium">
              პროდუქტის ძებნა
              <div className="relative mt-1">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="სახელი ან პროდუქტის კოდი"
                  className="border rounded-lg pl-10 pr-3 py-3 w-full"
                />
              </div>
            </label>
            <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
              {filtered.map((item) => {
                const selected = items.find(
                  (value) => transferItemKey(value) === transferItemKey(item),
                );
                const limit = available({ ...item, quantity: 1 });
                return (
                  <div
                    key={transferItemKey(item)}
                    className="p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.code} · საწყობში: {item.stock}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`დამატება: ${item.name}`}
                      disabled={
                        saving ||
                        (type === "out" && (selected?.quantity || 0) >= limit)
                      }
                      onClick={() => add(item)}
                      className="flex items-center gap-1 min-h-11 px-3 border rounded-lg text-emerald-700 disabled:opacity-40"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">დამატება</span>
                    </button>
                  </div>
                );
              })}
              {!filtered.length && (
                <p className="p-4 text-sm text-gray-500">
                  პროდუქტი ვერ მოიძებნა
                </p>
              )}
            </div>
          </section>
          <label className="block text-sm font-medium">
            კომენტარი
            <textarea
              maxLength={2000}
              value={note}
              disabled={saving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="მაგალითად: კვირის განმავლობაში გატანილი საქონელი"
              className="mt-1 block w-full border rounded-lg p-3 min-h-20"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="bg-red-50 text-red-700 rounded-lg p-3 text-sm"
            >
              {error}
            </p>
          )}
        </div>
        <div className="border-t p-4 flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-b-xl">
          <p className="text-sm">
            {items.length} პროდუქტი · <strong>{quantity} ცალი</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-11 px-4 border rounded-lg"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 px-5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
            >
              {saving ? "ინახება…" : "შენახვა"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default StoreTransferModal;
