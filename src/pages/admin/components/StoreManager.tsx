import React, { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
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

const StoreManager: React.FC = () => {
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState("all");
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
  const filtered = transfers.filter(
    (item) =>
      (kind === "all" || item.type === kind) &&
      (!from || item.date >= new Date(`${from}T00:00:00`)) &&
      (!to || item.date <= new Date(`${to}T23:59:59.999`)) &&
      `${item.transferNumber} ${item.items.map((product) => product.name).join(" ")}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
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
  const formatDate = (value: Date) =>
    value.toLocaleString("ka-GE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="space-y-5">
      <header className="bg-white border rounded-xl p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">მაღაზია — {DEFAULT_STORE.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            საწყობიდან გატანა და საწყობში დაბრუნება
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setForm({ type: "out" })}
            className="min-h-11 px-4 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-2"
          >
            <Plus size={18} />
            გატანა მაღაზიაში
          </button>
          <button
            onClick={() => setForm({ type: "return" })}
            className="min-h-11 px-4 py-2 rounded-lg border text-blue-700 flex items-center gap-2"
          >
            <ArrowDownLeft size={18} />
            დაბრუნება საწყობში
          </button>
        </div>
      </header>
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <label className="text-sm">
          ძებნა
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="პროდუქტი ან ჩანაწერის ნომერი"
            className="block w-full border rounded-lg px-3 py-2 mt-1 min-h-11"
          />
        </label>
        <label className="text-sm">
          ტიპი
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="block w-full border rounded-lg px-3 py-2 mt-1 min-h-11"
          >
            <option value="all">ყველა მოძრაობა</option>
            <option value="out">გატანა</option>
            <option value="return">დაბრუნება</option>
          </select>
        </label>
        <label className="text-sm">
          თარიღიდან
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="block w-full min-w-0 border rounded-lg px-3 py-2 mt-1 min-h-11"
          />
        </label>
        <label className="text-sm">
          თარიღამდე
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="block w-full min-w-0 border rounded-lg px-3 py-2 mt-1 min-h-11"
          />
        </label>
      </div>
      {error && (
        <div
          role="alert"
          className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700"
        >
          {error}
          <button
            onClick={() => setRetry((value) => value + 1)}
            className="ml-3 underline"
          >
            ხელახლა ცდა
          </button>
        </div>
      )}
      <section
        aria-label="მაღაზიის ისტორია"
        className="bg-white border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b font-semibold">
          ისტორია · {filtered.length} ჩანაწერი
        </div>
        {loading ? (
          <p className="p-5 text-gray-500">იტვირთება…</p>
        ) : !filtered.length ? (
          <p className="p-5 text-gray-500">ჩანაწერები არ არის</p>
        ) : (
          <div className="divide-y">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="w-full text-left p-4 grid grid-cols-1 md:grid-cols-4 gap-2 hover:bg-gray-50"
              >
                <span className="font-semibold text-blue-700 break-all">
                  {item.transferNumber}
                  <span className="block text-xs text-gray-500 font-normal mt-1">
                    {formatDate(item.date)}
                  </span>
                </span>
                <span
                  className={`flex items-center gap-2 text-sm ${item.type === "out" ? "text-orange-700" : "text-blue-700"}`}
                >
                  {item.type === "out" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownLeft size={18} />
                  )}
                  {item.type === "out" ? "გატანა" : "დაბრუნება"}
                </span>
                <span className="text-sm">
                  {item.items.length} პროდუქტი · {item.totalQuantity} ცალი
                </span>
                <span className="text-xs text-gray-500 break-all">
                  {item.createdBy.email}
                </span>
              </button>
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
                <h2 className="font-bold break-all">
                  {selected.transferNumber}
                </h2>
                <p className="text-sm text-gray-500">
                  {selected.type === "out"
                    ? "გატანა მაღაზიაში"
                    : "დაბრუნება საწყობში"}{" "}
                  · {formatDate(selected.date)}
                </p>
              </div>
              <button
                aria-label="დეტალების დახურვა"
                onClick={() => setSelectedId(null)}
                className="p-2"
              >
                <X />
              </button>
            </div>
            <div className="divide-y border rounded-lg">
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
              გაატარა: {selected.createdBy.email}
            </p>
            {selected.updatedBy && (
              <p className="text-xs text-gray-500 break-all">
                შეცვალა: {selected.updatedBy.email}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setForm({ type: selected.type, transfer: selected })
                }
                className="min-h-11 px-4 border rounded-lg flex items-center gap-2"
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
            <h2 className="font-bold">ჩანაწერის წაშლა</h2>
            <p className="text-sm break-all">{deleting.transferNumber}</p>
            <p className="text-sm">
              {deleting.type === "out"
                ? `საწყობში დაბრუნდება ${deleting.totalQuantity} ცალი.`
                : `საწყობს გამოაკლდება ${deleting.totalQuantity} ცალი. არასაკმარისი მარაგისას წაშლა ვერ შესრულდება.`}
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
                className="min-h-11 px-4 border rounded-lg"
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
