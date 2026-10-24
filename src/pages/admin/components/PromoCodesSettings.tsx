// src/pages/admin/components/PromoCodesSettings.tsx
// პრომო კოდები (მხოლოდ ადმინი): შექმნა, ჩართვა/გამორთვა, რედაქტირება, წაშლა და გამოყენების რაოდენობა.
import React, { useEffect, useMemo, useState } from "react";
import { Tag, Trash2, Pencil } from "lucide-react";
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

const emptyForm = { code: "", percent: "", expires: "" };

const PromoCodesSettings: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null); // რედაქტირებადი კოდი
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

  // გამოყენება = ამ კოდით შექმნილი შეკვეთები (გაუქმებულის გარეშე)
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

  const reset = () => { setForm(emptyForm); setEditing(null); setError(""); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const percent = Number(form.percent);
    const expiresAt = promoExpiryFromInput(form.expires);
    if (form.expires && !expiresAt) return setError("ვადის თარიღი არასწორია");
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await updatePromoCode(editing, { percent, expiresAt }, actor());
        showToast(`კოდი ${editing} განახლდა`, "success");
      } else {
        const code = await createPromoCode({ code: form.code, percent, expiresAt }, actor());
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
    setEditing(promo.code);
    setForm({ code: promo.code, percent: String(promo.percent), expires: toInputDate(promo.expiresAt) });
    setError("");
  };

  const inputClass = "w-full min-h-11 border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none";

  return (
    <section aria-label="პრომო კოდები" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-600" /> პრომო კოდები
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          მყიდველი კოდს საიტზე, შეკვეთის გაფორმებისას წერს. ფასდაკლება მოქმედებს მხოლოდ სრულფასიან
          პროდუქტებზე (უკვე ფასდაკლებულზე არა) და მიტანის თანხაზე არ ვრცელდება.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_11rem_auto] gap-3 items-end">
        <label className="text-sm text-gray-700">
          კოდი
          <input
            value={form.code}
            disabled={!!editing || busy}
            onChange={(event) => setForm({ ...form, code: normalizePromoCode(event.target.value) })}
            placeholder="მაგ. WEB10"
            autoComplete="off"
            className={`${inputClass} mt-1 uppercase disabled:bg-gray-50`}
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || !form.code || !form.percent}
            className="min-h-11 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {editing ? "შენახვა" : "დამატება"}
          </button>
          {editing && (
            <button type="button" onClick={reset} disabled={busy} className="min-h-11 px-3 rounded-lg bg-gray-100 text-sm text-gray-700">
              გაუქმება
            </button>
          )}
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {loadError ? (
        <p role="alert" className="text-sm text-red-600">{loadError}</p>
      ) : loading ? (
        <p className="text-sm text-gray-500">იტვირთება…</p>
      ) : !codes.length ? (
        <p className="text-sm text-gray-500">ჯერ კოდი არ არის დამატებული.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {codes.map((promo) => {
            const state = STATE_LABEL[getPromoState(promo)];
            return (
              <li key={promo.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {promo.code} <span className="font-normal text-emerald-700">-{promo.percent}%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
  );
};

export default PromoCodesSettings;
