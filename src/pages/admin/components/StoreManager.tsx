import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CornerDownLeft,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  DEFAULT_STORE,
  StoreTransferService,
} from "../../../services/storeTransferService";
import type {
  StoreTransfer,
  StoreTransferType,
} from "../../../types/storeTransfer";
import StoreTransferModal from "./StoreTransferModal";
import { STORE_TRANSFERS_TEST_ONLY } from "../../../utils/storeCatalog";
import { formatStoreTransferDate, STORE_TRANSFER_UI } from "./storeTransferUi";

const StoreManager: React.FC = () => {
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [form, setForm] = useState<{
    type: StoreTransferType;
    transfer?: StoreTransfer;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StoreTransfer | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    return StoreTransferService.subscribe(
      (items) => {
        setTransfers(items);
        setLoading(false);
        setError("");
      },
      (failure) => {
        setError(failure.message);
        setLoading(false);
      },
    );
  }, [retry]);
  const selected = transfers.find((item) => item.id === selectedId);
  const activeFilters = [kind !== "all", !!from, !!to].filter(Boolean).length;
  const matchingTransfers = transfers.filter(
    (item) =>
      (!from || item.date >= new Date(`${from}T00:00:00`)) &&
      (!to || item.date <= new Date(`${to}T23:59:59.999`)) &&
      `${item.transferNumber} ${item.items.map((product) => product.name).join(" ")}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const filtered = matchingTransfers.filter((item) => kind === "all" || item.type === kind);
  const hasFilters = !!search.trim() || kind !== "all" || !!from || !!to;
  const typeFilters = [
    { value: "all", label: "ყველა", count: matchingTransfers.length },
    { value: "out", label: "გადატანები", count: matchingTransfers.filter((item) => item.type === "out").length },
    { value: "return", label: "დაბრუნებები", count: matchingTransfers.filter((item) => item.type === "return").length },
  ];
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setError("");
    try {
      await StoreTransferService.remove(deleting.id);
      setDeleting(null);
      setSelectedId(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "წაშლა ვერ მოხერხდა",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">მაღაზია - {DEFAULT_STORE.name}</h1>
          <p className="text-sm text-gray-500 mt-1">ჩანაწერების ჟურნალი</p>
        </div>
        <Link
          to="/admin"
          state={{ adminSection: "analytics", analyticsReport: "store" }}
          className="min-h-11 flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 shrink-0"
        >
          <BarChart3 size={17} aria-hidden="true" />
          ანგარიში
        </Link>
      </header>
      <div className="space-y-3">
        {STORE_TRANSFERS_TEST_ONLY && (
          <p className="inline-flex rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            სატესტო რეჟიმი · მხოლოდ TEST-STORE პროდუქტები
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            aria-label="გადატანის ჩაწერა"
            onClick={() => setForm({ type: "out" })}
            className={`min-h-11 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${STORE_TRANSFER_UI.out.button}`}
          >
            <Plus size={18} aria-hidden="true" />
            გადატანის ჩაწერა
          </button>
          <button
            aria-label="დაბრუნების ჩაწერა"
            onClick={() => setForm({ type: "return" })}
            className={`min-h-11 px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${STORE_TRANSFER_UI.return.secondary}`}
          >
            <Undo2 size={17} aria-hidden="true" />
            დაბრუნების ჩაწერა
          </button>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700"
        >
          {error}
          <button
            onClick={() => setRetry((value) => value + 1)}
            className="ml-3 min-h-11 inline-flex items-center underline"
          >
            ხელახლა ცდა
          </button>
        </div>
      )}
      <section
        aria-label="მაღაზიის ისტორია"
        className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">ჩანაწერები</h2>
            <span className="text-xs text-gray-500">{filtered.length} ჩანაწერი</span>
          </div>
          <div role="group" aria-label="ჩანაწერის ტიპი" className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 sm:flex sm:w-fit">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={kind === filter.value}
                aria-label={`${filter.label} · ${filter.count}`}
                onClick={() => setKind(filter.value)}
                className={`min-h-11 min-w-0 rounded-lg px-1.5 sm:px-3 py-1.5 text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${kind === filter.value ? filter.value === "all" ? "bg-white text-gray-900 shadow-sm" : STORE_TRANSFER_UI[filter.value as StoreTransferType].selectedType : "text-gray-600 hover:bg-white/60"}`}
              >
                <span>{filter.label}</span>
                <span className="tabular-nums">{filter.count}</span>
              </button>
            ))}
          </div>
          {(transfers.length > 0 || hasFilters) && (
            <>
              <div className="flex items-end gap-3">
                <label className="relative flex-1 min-w-0">
                  <span className="sr-only">ძებნა</span>
                  <Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="პროდუქტი ან ჩანაწერის ნომერი"
                    className="block w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 min-h-11 text-sm"
                  />
                </label>
                <button
                  aria-expanded={filtersOpen}
                  aria-controls="store-history-filters"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={`min-h-11 px-3 rounded-lg border flex items-center gap-2 text-sm shrink-0 ${activeFilters ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <Filter size={16} />
                  ფილტრები{activeFilters > 0 ? ` (${activeFilters})` : ""}
                </button>
              </div>
              {filtersOpen && (
                <div
                  id="store-history-filters"
                  className="border-t border-gray-100 pt-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-sm">
                      თარიღიდან
                      <input
                        type="date"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                        className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11"
                      />
                    </label>
                    <label className="text-sm">
                      თარიღამდე
                      <input
                        type="date"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                        className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11"
                      />
                    </label>
                  </div>
                  {activeFilters > 0 && (
                    <button
                      onClick={() => {
                        setKind("all");
                        setFrom("");
                        setTo("");
                      }}
                      className="min-h-11 text-sm text-gray-600 underline underline-offset-4"
                    >
                      ფილტრების გასუფთავება
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {loading ? (
          <p className="p-5 text-gray-500">იტვირთება…</p>
        ) : !filtered.length ? (
          <div className="p-6 sm:p-10 text-center space-y-2">
            <p className="font-medium text-gray-800">{transfers.length === 0 && !hasFilters ? "პირველი ჩანაწერი" : "ჩანაწერი ვერ მოიძებნა"}</p>
            <p className="text-sm text-gray-500">
              {transfers.length === 0 && !hasFilters
                ? "მაღაზიაში უკვე არსებული საქონელი ერთ გადატანად შეიყვანე — ერთ ჩანაწერში შეიძლება ბევრი პროდუქტი."
                : "შეცვალე ძებნა ან ფილტრები."}
            </p>
            {transfers.length === 0 && !hasFilters && (
              <button
                type="button"
                aria-label="პირველი გადატანის ჩაწერა"
                onClick={() => setForm({ type: "out" })}
                className={`min-h-11 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mt-2 ${STORE_TRANSFER_UI.out.button}`}
              >
                <Plus size={18} aria-hidden="true" />
                გადატანის ჩაწერა
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <article
                key={item.id}
                data-direction={item.type}
                className="p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4"
              >
                <div className={`w-9 h-10 rounded-xl shrink-0 flex items-center justify-center ${STORE_TRANSFER_UI[item.type].surface}`}>
                  {item.type === "out" ? <ArrowUpRight size={19} aria-hidden="true" /> : <CornerDownLeft size={19} aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {item.items
                      .slice(0, 2)
                      .map((product) => `${product.name} × ${product.quantity}`)
                      .join(" · ")}
                    {item.items.length > 2
                      ? ` · +${item.items.length - 2} პროდუქტი`
                      : ""}
                  </p>
                  <p className={`text-xs ${STORE_TRANSFER_UI[item.type].text}`}>
                    {STORE_TRANSFER_UI[item.type].direction}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatStoreTransferDate(item.date)} · {item.items.length} პროდუქტი
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xl font-semibold tabular-nums ${STORE_TRANSFER_UI[item.type].text}`}>
                    {STORE_TRANSFER_UI[item.type].sign}{item.totalQuantity} <span className="text-xs font-normal">ცალი</span>
                  </p>
                  <button
                    aria-label={`გახსნა: ${item.transferNumber}`}
                    onClick={() => setSelectedId(item.id)}
                    className="min-h-11 flex items-center justify-end gap-1 ml-auto text-xs text-gray-500 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    გახსნა
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {form && (
        <StoreTransferModal
          type={form.type}
          transfer={form.transfer}
          onClose={() => setForm(null)}
        />
      )}
      {selected && !form && (
        <div className="fixed inset-0 z-[9998] bg-black/50 p-3 sm:p-5 flex items-center justify-center">
          <div
            role="dialog"
            aria-label="მოძრაობის დეტალები"
            className="bg-white rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <h2 className={`font-bold text-lg ${STORE_TRANSFER_UI[selected.type].text}`}>
                  {selected.type === "out" ? "მაღაზიაში გადატანა" : "საწყობში დაბრუნება"}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatStoreTransferDate(selected.date)}
                </p>
                <p className="text-xs text-gray-500 mt-1 break-all">{selected.transferNumber}</p>
              </div>
              <button
                aria-label="დეტალების დახურვა"
                onClick={() => setSelectedId(null)}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X />
              </button>
            </div>
            <div className={`rounded-xl p-3 text-sm space-y-1 ${STORE_TRANSFER_UI[selected.type].surface}`}>
              <p className="font-medium">
                {selected.type === "out" ? "საწყობი → მაღაზია · ცინცაძის 2" : "მაღაზია · ცინცაძის 2 → საწყობი"}
              </p>
              <p className="text-xs leading-relaxed">
                {selected.type === "out"
                  ? "ჩანაწერი შენახულია. ეს რაოდენობები საწყობს უკვე გამოაკლდა."
                  : "ჩანაწერი შენახულია. ეს რაოდენობები საწყობს უკვე დაემატა."}
              </p>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {selected.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between gap-3 p-3 text-sm"
                >
                  <span className="break-words">{item.name}</span>
                  <strong className="shrink-0">{item.quantity} ცალი</strong>
                </div>
              ))}
            </div>
            <p className="font-semibold">სულ: {selected.totalQuantity} ცალი</p>
            {selected.note && (
              <p className="text-sm whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
                {selected.note}
              </p>
            )}
            <p className="text-xs text-gray-500 break-all">
              დაამატა: {selected.createdBy.email} · {formatStoreTransferDate(selected.createdAt)}
            </p>
            {selected.updatedBy && (
              <p className="text-xs text-gray-500 break-all">
                შეცვალა: {selected.updatedBy.email} · {selected.updatedAt ? formatStoreTransferDate(selected.updatedAt) : "დრო უცნობია"}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setForm({ type: selected.type, transfer: selected })
                }
                className="min-h-11 px-4 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Pencil size={16} />
                რედაქტირება
              </button>
              <button
                onClick={() => setDeleting(selected)}
                className="min-h-11 px-4 border border-red-200 text-red-700 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={16} />
                წაშლა
              </button>
            </div>
          </div>
        </div>
      )}
      {deleting && (
        <div className="fixed inset-0 z-[10000] bg-black/60 p-4 flex items-center justify-center">
          <div
            role="dialog"
            aria-label="მოძრაობის წაშლა"
            className="bg-white rounded-xl p-5 max-w-md w-full space-y-4"
          >
            <div className={`rounded-xl p-3 space-y-1 ${STORE_TRANSFER_UI[deleting.type].surface}`}>
              <p className="text-xs">{STORE_TRANSFER_UI[deleting.type].direction}</p>
              <h2 className="font-bold">ჩანაწერის წაშლა და ნაშთის გასწორება</h2>
            </div>
            <p className="text-sm break-all">{deleting.transferNumber}</p>
            <p className="text-sm">
              {deleting.type === "out"
                ? `ამ გადატანის წაშლისას საწყობს დაემატება ${deleting.totalQuantity} ცალი.`
                : `ამ დაბრუნების წაშლისას საწყობს გამოაკლდება ${deleting.totalQuantity} ცალი. არასაკმარისი მარაგისას ჩანაწერი არ წაიშლება.`}
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => setDeleting(null)}
                className="min-h-11 px-4 border border-gray-200 rounded-lg"
              >
                გაუქმება
              </button>
              <button
                disabled={busy}
                onClick={remove}
                className="min-h-11 px-4 bg-red-600 text-white rounded-lg"
              >
                {busy ? "იშლება…" : "წაშლის დადასტურება"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StoreManager;
