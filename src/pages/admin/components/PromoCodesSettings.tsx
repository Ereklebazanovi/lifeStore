// src/pages/admin/components/PromoCodesSettings.tsx
// პრომო კოდები (მხოლოდ ადმინი): შექმნა, რომელ პროდუქტებზე მოქმედებს, ჩართვა/გამორთვა, რედაქტირება, წაშლა.
import React, { useEffect, useMemo, useState } from "react";
import { Tag, Trash2, Pencil, Search, Package } from "lucide-react";
import { auth } from "../../../services/firebase";
import {
  createPromoCode,
  deletePromoCode,
  subscribePromoCodes,
  updatePromoCode,
} from "../../../services/promoService";
import type { PromoCodeRecord } from "../../../services/promoService";
import {
  getPromoState,
  isPromoExcluded,
  normalizePromoCode,
  PROMO_MAX_PERCENT,
  promoExpiryFromInput,
} from "../../../utils/promo";
import { useProductStore } from "../../../store/productStore";
import { showToast } from "../../../components/ui/Toast";
import type { Order, Product } from "../../../types";

const MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const formatDay = (date: Date) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
const toInputDate = (date?: Date | null) => {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const STATE_LABEL = {
  active: { text: "აქტიური", className: "bg-emerald-50 text-emerald-700" },
  inactive: { text: "გამორთული", className: "bg-gray-100 text-gray-600" },
  expired: { text: "ვადაგასული", className: "bg-amber-50 text-amber-800" },
} as const;

type Scope = "all" | "products";
const emptyForm = { code: "", percent: "", expires: "", scope: "all" as Scope, productIds: [] as string[] };

// Cloudinary-ის ფოტოს პატარა ვერსია: სიაში 800px-იანი ფოტოს ნაცვლად რამდენიმე KB-იანი ესკიზი იტვირთება
const thumbUrl = (url?: string) =>
  url?.includes("res.cloudinary.com")
    ? url.replace(/\/upload\/(?:[^/]+\/)?(v\d+\/)/, "/upload/f_auto,q_auto,w_96,h_96,c_fill/$1")
    : url;

const Thumb: React.FC<{ product?: Product; className: string }> = ({ product, className }) =>
  product?.images?.[0] ? (
    <img
      src={thumbUrl(product.images[0])}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} object-cover bg-gray-100 shrink-0`}
    />
  ) : (
    <span className={`${className} bg-gray-100 shrink-0 flex items-center justify-center`}>
      <Package className="w-4 h-4 text-gray-400" />
    </span>
  );

const formatPrice = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(2)}₾`;

// მიმდინარე ფასი და (თუ ფასდაკლებულია) ძველი ფასი, ისე, როგორც საიტზე ჩანს
const priceOf = (product: Product) => {
  if (product.hasVariants && product.variants?.length) {
    const min = Math.min(...product.variants.map((v) => (v.salePrice && v.salePrice < v.price ? v.salePrice : v.price)));
    return { current: min, old: undefined, fromLabel: true };
  }
  if (product.salePrice && product.salePrice < product.price)
    return { current: product.salePrice, old: product.price, fromLabel: false };
  if (product.originalPrice && product.originalPrice > product.price)
    return { current: product.price, old: product.originalPrice, fromLabel: false };
  return { current: product.price, old: undefined, fromLabel: false };
};

const ALL = "__all";
const SELECTED = "__selected";

// პროდუქტების არჩევა: ყველა პროდუქტი ფოტოთი ერთ სიაშია, ძებნა და კატეგორია მხოლოდ ფილტრავს
const ProductPicker: React.FC<{
  products: Product[];
  selected: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}> = ({ products, selected, disabled, onChange }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(ALL);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // ჯერ საიტზე ხილული, მერე დამალული; თითოეულში ანბანით
  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          Number(a.isActive === false) - Number(b.isActive === false) || a.name.localeCompare(b.name, "ka"),
      ),
    [products],
  );

  const selectedCount = useMemo(() => products.filter((p) => selectedSet.has(p.id)).length, [products, selectedSet]);

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [
      { key: ALL, label: "ყველა", count: products.length },
      { key: SELECTED, label: "მონიშნული", count: selectedCount },
      ...[...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "ka"))
        .map(([category, count]) => ({ key: category, label: category, count })),
    ];
  }, [products, selectedCount]);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sorted.filter(
      (p) =>
        (filter === ALL || (filter === SELECTED ? selectedSet.has(p.id) : p.category === filter)) &&
        (!query || `${p.name} ${p.productCode ?? ""}`.toLocaleLowerCase().includes(query)),
    );
  }, [sorted, search, filter, selectedSet]);

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedSet.has(p.id));

  const toggle = (id: string) =>
    onChange(selectedSet.has(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  const toggleVisible = () => {
    const ids = new Set(visible.map((p) => p.id));
    onChange(
      allVisibleSelected
        ? selected.filter((id) => !ids.has(id))
        : [...selected, ...visible.map((p) => p.id).filter((id) => !selectedSet.has(id))],
    );
  };

  if (!products.length) return <p className="text-sm text-gray-500">პროდუქტები იტვირთება…</p>;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          disabled={disabled}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ძებნა სახელით ან კოდით"
          aria-label="პროდუქტის ძებნა"
          autoComplete="off"
          className="w-full min-h-11 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-base focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
        />
      </div>

      <div role="group" aria-label="ფილტრი" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={filter === chip.key}
            onClick={() => setFilter(chip.key)}
            className={`min-h-10 px-3 rounded-full border text-sm ${filter === chip.key ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {chip.label} <span className={filter === chip.key ? "text-emerald-100" : "text-gray-400"}>{chip.count}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-700" aria-live="polite">
            მონიშნულია: <span className="font-semibold text-gray-900">{selectedCount}</span>
          </p>
          {!!visible.length && (
            <button
              type="button"
              disabled={disabled}
              onClick={toggleVisible}
              className="min-h-9 px-3 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              {allVisibleSelected ? "ყველას მოხსნა" : "ყველას მონიშვნა"} ({visible.length})
            </button>
          )}
        </div>

        {!visible.length ? (
          <p className="px-3 py-6 text-center text-sm text-gray-500">
            {filter === SELECTED && !search.trim() ? "ჯერ პროდუქტი არ არის მონიშნული." : "პროდუქტი ვერ მოიძებნა"}
          </p>
        ) : (
          <div role="group" aria-label="პროდუქტები" className="max-h-[28rem] overflow-y-auto divide-y divide-gray-100">
            {visible.map((product) => {
              const checked = selectedSet.has(product.id);
              const price = priceOf(product);
              const onSale = isPromoExcluded(product);
              const hidden = product.isActive === false;
              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-3 px-3 py-2 min-h-14 cursor-pointer ${checked ? "bg-emerald-50/70" : "hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(product.id)}
                    className="w-5 h-5 shrink-0 accent-emerald-600"
                  />
                  <Thumb product={product} className="w-11 h-11 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-900 line-clamp-2">{product.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-gray-500">
                      {product.productCode}
                      {onSale && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">ფასდაკლების დროს კოდი არ მოქმედებს</span>
                      )}
                      {hidden && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">საიტზე დამალულია</span>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm tabular-nums">
                    {price.old !== undefined && (
                      <span className="block text-xs text-gray-400 line-through">{formatPrice(price.old)}</span>
                    )}
                    <span className="text-gray-900">
                      {formatPrice(price.current)}
                      {price.fromLabel ? "-დან" : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const PromoCodesSettings: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const { products } = useProductStore();
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null); // რედაქტირებადი კოდი
  const [pickerKey, setPickerKey] = useState(0); // ახალი ფორმისას ძებნა/ფილტრი თავიდან
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      subscribePromoCodes(
        (items) => { setCodes(items); setLoading(false); setLoadError(""); },
        () => { setLoadError("პრომო კოდები ვერ ჩაიტვირთა"); setLoading(false); },
      ),
    [],
  );

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const productName = (id: string) => productById.get(id)?.name ?? "წაშლილი პროდუქტი";

  // გამოყენება = ამ კოდით გაფორმებული შეკვეთები (გაუქმებულის გარეშე)
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      if (!order.promoCode || order.orderStatus === "cancelled") continue;
      map.set(order.promoCode, (map.get(order.promoCode) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const actor = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("საჭიროა ანგარიშით შესვლა");
    return { uid: user.uid, email: user.email || "" };
  };

  const reset = () => { setForm(emptyForm); setEditing(null); setError(""); setPickerKey((key) => key + 1); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const percent = Number(form.percent);
    const expiresAt = promoExpiryFromInput(form.expires);
    if (form.expires && !expiresAt) return setError("ვადის თარიღი არასწორია");
    // წაშლილი პროდუქტები კოდში აღარ ინახება
    const productIds =
      form.scope !== "products" ? [] : products.length ? form.productIds.filter((id) => productById.has(id)) : form.productIds;
    if (form.scope === "products" && !productIds.length)
      return setError("მონიშნე მინიმუმ ერთი პროდუქტი, ან აირჩიე „ყველა პროდუქტზე“");
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await updatePromoCode(editing, { percent, expiresAt, productIds }, actor());
        showToast(`კოდი ${editing} განახლდა`, "success");
      } else {
        const code = await createPromoCode({ code: form.code, percent, expiresAt, productIds }, actor());
        showToast(`კოდი ${code} დაემატა`, "success");
      }
      reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (promo: PromoCodeRecord) => {
    try {
      await updatePromoCode(promo.code, { active: !promo.active }, actor());
    } catch (failure) {
      showToast(failure instanceof Error ? failure.message : "ვერ შეიცვალა", "error");
    }
  };

  const remove = async (promo: PromoCodeRecord) => {
    if (!window.confirm(`წაიშალოს კოდი ${promo.code}? უკვე გაფორმებულ შეკვეთებზე კოდი და ფასდაკლება დარჩება.`)) return;
    try {
      await deletePromoCode(promo.code);
      if (editing === promo.code) reset();
      showToast(`კოდი ${promo.code} წაიშალა`, "success");
    } catch (failure) {
      showToast(failure instanceof Error ? failure.message : "წაშლა ვერ მოხერხდა", "error");
    }
  };

  const startEdit = (promo: PromoCodeRecord) => {
    const ids = promo.productIds ?? [];
    setEditing(promo.code);
    setForm({
      code: promo.code,
      percent: String(promo.percent),
      expires: toInputDate(promo.expiresAt),
      scope: ids.length ? "products" : "all",
      productIds: ids,
    });
    setPickerKey((key) => key + 1);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scopeText = (promo: PromoCodeRecord) => {
    const ids = promo.productIds ?? [];
    if (!ids.length) return "ყველა პროდუქტზე";
    const names = ids.slice(0, 2).map(productName).join(", ");
    return `${ids.length} პროდუქტზე: ${names}${ids.length > 2 ? ` +${ids.length - 2}` : ""}`;
  };

  const inputClass = "w-full min-h-11 border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none";

  return (
    <div className="space-y-4">
      <section aria-label="პრომო კოდები" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" /> პრომო კოდები
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            მყიდველი კოდს საიტზე, შეკვეთის გაფორმებისას წერს. ფასდაკლება მოქმედებს მხოლოდ არჩეულ
            პროდუქტებზე (ან ყველაზე), უკვე ფასდაკლებულ პროდუქტზე არა. მიტანაზე არ ვრცელდება.
          </p>
        </div>

        <form onSubmit={submit} noValidate aria-label="პრომო კოდის ფორმა" className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/60 p-3 sm:p-4">
          <p className="text-sm font-semibold text-gray-800">{editing ? `რედაქტირება: ${editing}` : "ახალი კოდი"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_11rem] gap-3">
            <label className="text-sm text-gray-700">
              კოდი
              <input
                value={form.code}
                disabled={!!editing || busy}
                onChange={(event) => setForm({ ...form, code: normalizePromoCode(event.target.value) })}
                placeholder="მაგ. WEB10"
                autoComplete="off"
                className={`${inputClass} mt-1 uppercase disabled:bg-gray-100`}
              />
            </label>
            <label className="text-sm text-gray-700">
              ფასდაკლება %
              <input
                type="number"
                min={1}
                max={PROMO_MAX_PERCENT}
                step={1}
                inputMode="numeric"
                value={form.percent}
                disabled={busy}
                onChange={(event) => setForm({ ...form, percent: event.target.value })}
                placeholder="10"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-sm text-gray-700">
              ვადა (არასავალდებულო)
              <input
                type="date"
                value={form.expires}
                disabled={busy}
                onChange={(event) => setForm({ ...form, expires: event.target.value })}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm text-gray-700 mb-1">მოქმედებს</legend>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "all", label: "ყველა პროდუქტზე" },
                { value: "products", label: "არჩეულ პროდუქტებზე" },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className={`min-h-11 flex items-center gap-2 rounded-lg border px-3 text-sm cursor-pointer ${form.scope === option.value ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-gray-700"}`}
                >
                  <input
                    type="radio"
                    name="promo-scope"
                    value={option.value}
                    checked={form.scope === option.value}
                    disabled={busy}
                    onChange={() => setForm({ ...form, scope: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {form.scope === "products" && (
              <ProductPicker
                key={pickerKey}
                products={products}
                selected={form.productIds}
                disabled={busy}
                onChange={(productIds) => setForm((current) => ({ ...current, productIds }))}
              />
            )}
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !form.code || !form.percent}
              className="min-h-11 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {editing ? "შენახვა" : "კოდის დამატება"}
            </button>
            {editing && (
              <button type="button" onClick={reset} disabled={busy} className="min-h-11 px-3 rounded-lg bg-gray-100 text-sm text-gray-700">
                გაუქმება
              </button>
            )}
          </div>
        </form>

        {loadError ? (
          <p role="alert" className="text-sm text-red-600">{loadError}</p>
        ) : loading ? (
          <p className="text-sm text-gray-500">იტვირთება…</p>
        ) : !codes.length ? (
          <p className="text-sm text-gray-500">ჯერ კოდი არ არის დამატებული.</p>
        ) : (
          <ul aria-label="კოდების სია" className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {codes.map((promo) => {
              const state = STATE_LABEL[getPromoState(promo)];
              return (
                <li key={promo.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {promo.code} <span className="font-normal text-emerald-700">-{promo.percent}%</span>
                    </p>
                    {!!promo.productIds?.length && (
                      <div className="flex -space-x-2 mt-2" aria-hidden="true">
                        {promo.productIds.slice(0, 6).map((id) => (
                          <Thumb key={id} product={productById.get(id)} className="w-8 h-8 rounded-full ring-2 ring-white" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1">{scopeText(promo)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {promo.expiresAt ? `${formatDay(promo.expiresAt)}-მდე` : "უვადო"} · გამოყენებულია{" "}
                      {usage.get(promo.code) ?? 0}-ჯერ
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${state.className}`}>{state.text}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggle(promo)}
                      className="min-h-11 px-3 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      {promo.active ? "გამორთვა" : "ჩართვა"}
                    </button>
                    <button
                      type="button"
                      aria-label={`რედაქტირება: ${promo.code}`}
                      onClick={() => startEdit(promo)}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`წაშლა: ${promo.code}`}
                      onClick={() => remove(promo)}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PromoCodesSettings;
