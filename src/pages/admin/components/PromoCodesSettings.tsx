// src/pages/admin/components/PromoCodesSettings.tsx
// პრომო კოდები (მხოლოდ ადმინი): შექმნა, რომელ პროდუქტებზე მოქმედებს, ჩართვა/გამორთვა, რედაქტირება, წაშლა.
import React, { useEffect, useMemo, useState } from "react";
import { Tag, Trash2, Pencil, Search, X, Plus } from "lucide-react";
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
  normalizePromoCode,
  PROMO_MAX_PERCENT,
  promoExpiryFromInput,
} from "../../../utils/promo";
import { useProductStore } from "../../../store/productStore";
import { showToast } from "../../../components/ui/Toast";
import type { Order } from "../../../types";

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

const PromoCodesSettings: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const { products } = useProductStore();
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null); // რედაქტირებადი კოდი
  const [search, setSearch] = useState("");
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

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? "წაშლილი პროდუქტი";
  }, [products]);

  // გამოყენება = ამ კოდით გაფორმებული შეკვეთები (გაუქმებულის გარეშე)
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      if (!order.promoCode || order.orderStatus === "cancelled") continue;
      map.set(order.promoCode, (map.get(order.promoCode) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return [];
    return products
      .filter((p) => !form.productIds.includes(p.id))
      .filter((p) => `${p.name} ${p.productCode ?? ""}`.toLocaleLowerCase().includes(query))
      .slice(0, 8);
  }, [products, search, form.productIds]);

  const actor = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("საჭიროა ანგარიშით შესვლა");
    return { uid: user.uid, email: user.email || "" };
  };

  const reset = () => { setForm(emptyForm); setEditing(null); setError(""); setSearch(""); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const percent = Number(form.percent);
    const expiresAt = promoExpiryFromInput(form.expires);
    if (form.expires && !expiresAt) return setError("ვადის თარიღი არასწორია");
    if (form.scope === "products" && !form.productIds.length)
      return setError("აირჩიე მინიმუმ ერთი პროდუქტი, ან მონიშნე „ყველა პროდუქტზე“");
    const productIds = form.scope === "products" ? form.productIds : [];
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
    setSearch("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addProduct = (id: string) => {
    setForm((current) => ({ ...current, productIds: [...current.productIds, id] }));
    setSearch("");
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
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    disabled={busy}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="მოძებნე პროდუქტი სახელით ან კოდით"
                    aria-label="პროდუქტის ძებნა"
                    autoComplete="off"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                {!!matches.length && (
                  <div role="region" aria-label="ძებნის შედეგები" className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {matches.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        aria-label={`დამატება: ${product.name}`}
                        onClick={() => addProduct(product.id)}
                        className="w-full min-h-11 flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                      >
                        <span className="min-w-0 truncate">
                          {product.name}
                          <span className="text-xs text-gray-500"> · {product.productCode}</span>
                        </span>
                        <Plus className="w-4 h-4 shrink-0 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}
                {search.trim() && !matches.length && (
                  <p className="text-xs text-gray-500">პროდუქტი ვერ მოიძებნა</p>
                )}
                <div aria-label="არჩეული პროდუქტები" className="flex flex-wrap gap-2">
                  {form.productIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 pl-3 pr-1 py-1 text-sm text-emerald-800">
                      {productName(id)}
                      <button
                        type="button"
                        aria-label={`ამოშლა: ${productName(id)}`}
                        onClick={() => setForm((current) => ({ ...current, productIds: current.productIds.filter((value) => value !== id) }))}
                        className="min-w-8 min-h-8 flex items-center justify-center rounded-full hover:bg-emerald-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {!form.productIds.length && (
                    <p className="text-xs text-gray-500">ჯერ პროდუქტი არ არის არჩეული.</p>
                  )}
                </div>
              </div>
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
