import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Filter, PackagePlus, Pencil, Plus, Search, Store, Trash2, X } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import { StockReceiptService } from "../../../services/stockReceiptService";
import type { StockReceipt, StockReceiptItem } from "../../../types/stockReceipt";
import { formatStoreTransferDate } from "./storeTransferUi";
import ReceiptModal from "./ReceiptModal";

interface Props {
  /** საწყობიდან „მიღებები“ — ჟურნალი ამ პროდუქტის ფილტრით იხსნება */
  initialProductId?: string | null;
}

const ReceiptsManager: React.FC<Props> = ({ initialProductId }) => {
  const { products } = useProductStore();
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [productFilter, setProductFilter] = useState(initialProductId || "");
  const [filtersOpen, setFiltersOpen] = useState(!!initialProductId);
  const [form, setForm] = useState<{ receipt?: StockReceipt } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StockReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (initialProductId) {
      setProductFilter(initialProductId);
      setFiltersOpen(true);
    }
  }, [initialProductId]);

  useEffect(
    () =>
      StockReceiptService.subscribe(
        (items) => {
          setReceipts(items);
          setLoading(false);
          setError("");
        },
        (failure) => {
          setError(failure.message);
          setLoading(false);
        },
      ),
    [retry],
  );

  // ჟურნალი პროდუქტის მიმდინარე სახელს/კოდს აჩვენებს; წაშლილისთვის — შენახულს
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const display = (item: StockReceiptItem) => {
    const product = productById.get(item.productId);
    return { name: product?.name || item.name, code: product?.productCode || item.productCode, deleted: !product };
  };
  const suppliers = useMemo(() => [...new Set(receipts.map((receipt) => receipt.supplier))].sort((a, b) => a.localeCompare(b, "ka")), [receipts]);
  const sorted = useMemo(
    () => [...receipts].sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime()),
    [receipts],
  );
  const needle = search.trim().toLocaleLowerCase();
  const filtered = sorted.filter((receipt) => {
    if (from && receipt.date < new Date(`${from}T00:00:00`)) return false;
    if (to && receipt.date > new Date(`${to}T23:59:59.999`)) return false;
    if (supplierFilter && receipt.supplier !== supplierFilter) return false;
    if (productFilter && !receipt.items.some((item) => item.productId === productFilter)) return false;
    if (!needle) return true;
    const text = [
      receipt.receiptNumber,
      receipt.supplier,
      receipt.documentNumber,
      ...receipt.items.flatMap((item) => [display(item).name, display(item).code]),
    ].join(" ");
    return text.toLocaleLowerCase().includes(needle);
  });
  const activeFilters = [!!from, !!to, !!supplierFilter, !!productFilter].filter(Boolean).length;
  const hasFilters = !!needle || activeFilters > 0;
  const selected = receipts.find((receipt) => receipt.id === selectedId);
  const productSummary = productFilter
    ? (() => {
        const lines = filtered.flatMap((receipt) =>
          receipt.items.filter((item) => item.productId === productFilter).map((item) => ({ ...item, date: receipt.date })),
        );
        return {
          name: productById.get(productFilter)?.name || lines[0]?.name || "პროდუქტი",
          count: lines.length,
          quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
          toStore: lines.reduce((sum, line) => sum + line.toStore, 0),
          last: lines.reduce<Date | null>((latest, line) => (!latest || line.date > latest ? line.date : latest), null),
        };
      })()
    : null;
  const productOptions = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, "ka")),
    [products],
  );

  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setError("");
    try {
      await StockReceiptService.remove(deleting.id);
      setDeleting(null);
      setSelectedId(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "წაშლა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  };
  const download = async () => {
    setExportError("");
    try {
      const { exportReceiptsToExcel } = await import("../../../utils/receiptExporter");
      exportReceiptsToExcel(filtered, (item) => display(item));
    } catch (failure) {
      setExportError(failure instanceof Error ? failure.message : "Excel-ის ჩამოტვირთვა ვერ მოხერხდა");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">მიღება</h1>
        <p className="text-sm text-gray-500 mt-1">ტვირთების ჟურნალი — რა, როდის და ვისგან მივიღეთ</p>
      </header>

      <div className="flex flex-wrap items-start gap-3">
        <button aria-label="ახალი მიღება" onClick={() => setForm({})}
          className="min-h-11 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800">
          <Plus size={18} aria-hidden="true" />
          ახალი მიღება
        </button>
        <div className="space-y-2">
          <button type="button" onClick={download} disabled={loading || !!error || !filtered.length}
            className="min-h-11 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={16} aria-hidden="true" />
            Excel-ში ჩამოტვირთვა
          </button>
          {exportError && <p role="alert" className="text-xs text-red-700">{exportError}</p>}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
          {error}
          <button onClick={() => setRetry((value) => value + 1)} className="ml-3 min-h-11 inline-flex items-center underline">ხელახლა ცდა</button>
        </div>
      )}

      <section aria-label="მიღების ჟურნალი" className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">მიღებები</h2>
            <span className="text-xs text-gray-500">{filtered.length} მიღება</span>
          </div>
          {(receipts.length > 0 || hasFilters) && (
            <>
              <div className="flex items-end gap-3">
                <label className="relative flex-1 min-w-0">
                  <span className="sr-only">მიღების ძებნა</span>
                  <Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-gray-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)}
                    placeholder="პროდუქტი, კოდი, მომწოდებელი ან ნომერი"
                    className="block w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 min-h-11 text-sm" />
                </label>
                <button aria-expanded={filtersOpen} aria-controls="receipt-filters" onClick={() => setFiltersOpen((open) => !open)}
                  className={`min-h-11 px-3 rounded-lg border flex items-center gap-2 text-sm shrink-0 ${activeFilters ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Filter size={16} />
                  ფილტრები{activeFilters > 0 ? ` (${activeFilters})` : ""}
                </button>
              </div>
              {filtersOpen && (
                <div id="receipt-filters" className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="text-sm">
                      თარიღიდან
                      <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11" />
                    </label>
                    <label className="text-sm">
                      თარიღამდე
                      <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11" />
                    </label>
                    <label className="text-sm">
                      მომწოდებელი
                      <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11 bg-white">
                        <option value="">ყველა</option>
                        {suppliers.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">
                      პროდუქტი
                      <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="block w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 mt-1 min-h-11 bg-white">
                        <option value="">ყველა</option>
                        {productOptions.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.productCode}</option>)}
                      </select>
                    </label>
                  </div>
                  {activeFilters > 0 && (
                    <button onClick={() => { setFrom(""); setTo(""); setSupplierFilter(""); setProductFilter(""); }}
                      className="min-h-11 text-sm text-gray-600 underline underline-offset-4">
                      ფილტრების გასუფთავება
                    </button>
                  )}
                </div>
              )}
              {productSummary && (
                <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                  <strong>{productSummary.name}</strong>: სულ მიღებულია <strong>{productSummary.quantity} ცალი</strong>, {productSummary.count} მიღებით
                  {productSummary.toStore ? ` (აქედან მაღაზიაში ${productSummary.toStore})` : ""}
                  {productSummary.last ? ` · ბოლო: ${formatStoreTransferDate(productSummary.last, false)}` : ""}
                </p>
              )}
            </>
          )}
        </div>

        {loading ? (
          <p className="p-5 text-gray-500">იტვირთება…</p>
        ) : !filtered.length ? (
          <div className="p-6 sm:p-10 text-center space-y-2">
            <p className="font-medium text-gray-800">{receipts.length === 0 && !hasFilters ? "მიღებები ჯერ არ არის" : "მიღება ვერ მოიძებნა"}</p>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              {receipts.length === 0 && !hasFilters
                ? "აქ შეიყვანე დღეიდან ჩამოსული ყოველი ტვირთი — საწყობში უკვე არსებული პროდუქტიც (სიიდან აირჩიე და ახალი რაოდენობა ჩაწერე) და ახალიც. ის, რაც ადრე ჩამოვიდა და საწყობის მარაგში უკვე წერია, აქ ხელახლა არ შეიყვანო — ორჯერ დაემატება."
                : "შეცვალე ძებნა ან ფილტრები."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((receipt) => (
              <article key={receipt.id} className="p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-9 h-10 rounded-xl shrink-0 flex items-center justify-center bg-emerald-50 text-emerald-800">
                  <PackagePlus size={19} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {receipt.items.slice(0, 2).map((item) => `${display(item).name} × ${item.quantity}`).join(" · ")}
                    {receipt.items.length > 2 ? ` · +${receipt.items.length - 2} პროდუქტი` : ""}
                  </p>
                  <p className="text-xs text-emerald-800">{receipt.supplier}{receipt.documentNumber ? ` · ${receipt.documentNumber}` : ""}</p>
                  <p className="text-xs text-gray-500">{formatStoreTransferDate(receipt.date, false)} · {receipt.items.length} პროდუქტი</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-semibold tabular-nums text-emerald-800">+{receipt.totalQuantity} <span className="text-xs font-normal">ცალი</span></p>
                  {receipt.totalToStore > 0 && <p className="text-xs text-amber-700 tabular-nums mt-1">აქედან მაღაზიაში {receipt.totalToStore}</p>}
                  <button aria-label={`გახსნა: ${receipt.receiptNumber}`} onClick={() => setSelectedId(receipt.id)}
                    className="min-h-11 flex items-center justify-end gap-1 ml-auto text-xs text-gray-500 hover:text-emerald-700">
                    გახსნა
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {form && <ReceiptModal receipt={form.receipt} suppliers={suppliers} onClose={() => setForm(null)} />}

      {selected && !form && (
        <div className="fixed inset-0 z-[9998] bg-black/50 p-3 sm:p-5 flex items-center justify-center">
          <div role="dialog" aria-label="მიღების დეტალები" className="bg-white rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg text-emerald-800">მიღება · {selected.supplier}</h2>
                <p className="text-sm text-gray-500">{formatStoreTransferDate(selected.date, false)}{selected.documentNumber ? ` · დოკუმენტი: ${selected.documentNumber}` : ""}</p>
                <p className="text-xs text-gray-500 mt-1 break-all">{selected.receiptNumber}</p>
              </div>
              <button aria-label="დეტალების დახურვა" onClick={() => setSelectedId(null)} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X />
              </button>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {selected.items.map((item) => {
                const shown = display(item);
                return (
                  <div key={item.productId} className="flex justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="break-words">
                        {shown.name}
                        {item.createdProduct && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800">ამ მიღებით შეიქმნა</span>}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{shown.code}{shown.deleted ? " · კატალოგიდან წაშლილია" : ""}</p>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <strong>+{item.quantity} ცალი</strong>
                      {item.toStore > 0 && <p className="text-xs text-amber-700 mt-1">აქედან მაღაზიაში {item.toStore}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="font-semibold">
              სულ: {selected.totalQuantity} ცალი{selected.totalToStore ? ` · მაღაზიაში ${selected.totalToStore} · საწყობში ${selected.totalQuantity - selected.totalToStore}` : ""}
            </p>
            {selected.storeTransferNumber && (
              <p className="flex items-center gap-2 text-sm rounded-lg bg-amber-50 text-amber-900 p-3">
                <Store size={16} aria-hidden="true" />
                მაღაზიის გადატანა: <span className="break-all">{selected.storeTransferNumber}</span> — იცვლება მხოლოდ ამ მიღებიდან
              </p>
            )}
            {selected.note && <p className="text-sm whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">{selected.note}</p>}
            <p className="text-xs text-gray-500 break-all">დაამატა: {selected.createdBy.email} · {formatStoreTransferDate(selected.createdAt)}</p>
            {selected.updatedBy && (
              <p className="text-xs text-gray-500 break-all">შეცვალა: {selected.updatedBy.email} · {selected.updatedAt ? formatStoreTransferDate(selected.updatedAt) : "დრო უცნობია"}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setForm({ receipt: selected })} className="min-h-11 px-4 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                <Pencil size={16} />
                რედაქტირება
              </button>
              <button onClick={() => setDeleting(selected)} className="min-h-11 px-4 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <Trash2 size={16} />
                წაშლა
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[10000] bg-black/60 p-4 flex items-center justify-center">
          <div role="dialog" aria-label="მიღების წაშლა" className="bg-white rounded-xl p-5 max-w-md w-full space-y-4">
            <h2 className="font-bold">მიღების წაშლა და ნაშთის გასწორება</h2>
            <p className="text-sm break-all">{deleting.receiptNumber} · {deleting.supplier}</p>
            <p className="text-sm">
              საწყობს გამოაკლდება {deleting.totalQuantity - deleting.totalToStore} ცალი.
              {deleting.storeTransferNumber ? ` ასევე წაიშლება მაღაზიის გადატანა ${deleting.storeTransferNumber} (${deleting.totalToStore} ცალი).` : ""}
              {" "}თუ ეს საქონელი უკვე გაიყიდა, მიღება არ წაიშლება.
            </p>
            {deleting.items.some((item) => item.createdProduct) && (
              <p className="text-xs text-gray-600">ამ მიღებით შექმნილი პროდუქტი საწყობში დარჩება 0 ნაშთით; საჭიროების შემთხვევაში წაშალე საწყობიდან.</p>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-3">
              <button disabled={busy} onClick={() => { setDeleting(null); setError(""); }} className="min-h-11 px-4 border border-gray-200 rounded-lg">გაუქმება</button>
              <button disabled={busy} onClick={remove} className="min-h-11 px-4 bg-red-600 text-white rounded-lg">{busy ? "იშლება…" : "წაშლის დადასტურება"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsManager;
