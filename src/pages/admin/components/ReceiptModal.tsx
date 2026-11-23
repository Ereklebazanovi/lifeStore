import React, { useEffect, useMemo, useRef, useState } from "react";
import { PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import { useCategoryStore } from "../../../store/categoryStore";
import { StockReceiptService } from "../../../services/stockReceiptService";
import type { NewReceiptProduct, StockReceipt } from "../../../types/stockReceipt";
import { storeTransferDateInput } from "../../../utils/storeTransferDate";

interface Props {
  receipt?: StockReceipt;
  suppliers: string[];
  onClose: () => void;
}
interface Line {
  productId: string;
  quantity: number;
  toStore: number;
  newProduct?: NewReceiptProduct;
}
interface CatalogItem {
  productId: string;
  name: string;
  code: string;
  stock: number;
  hidden: boolean;
}

const CODE_PATTERN = /^[A-Z0-9-]+$/;
const focusRing = "focus:ring-emerald-500";

// დანომრილი ნაბიჯი: ფორმა ზემოდან ქვემოთ იკითხება — 1 ტვირთი, 2 რა ჩამოვიდა, 3 რამდენი
const Step: React.FC<{ n: number; title: string; hint?: string; right?: React.ReactNode }> = ({ n, title, hint, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
    <div className="flex items-start gap-2.5 min-w-0">
      <span aria-hidden="true" className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </div>
    {right}
  </div>
);

const ReceiptModal: React.FC<Props> = ({ receipt, suppliers, onClose }) => {
  const { products } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [lines, setLines] = useState<Line[]>(
    () => receipt?.items.map(({ productId, quantity, toStore }) => ({ productId, quantity, toStore })) || [],
  );
  const [movementDate, setMovementDate] = useState(() => storeTransferDateInput(receipt?.date));
  const [supplier, setSupplier] = useState(receipt?.supplier || "");
  const [documentNumber, setDocumentNumber] = useState(receipt?.documentNumber || "");
  const [note, setNote] = useState(receipt?.note || "");
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [newForm, setNewForm] = useState<{ name: string; code: string; category: string } | null>(null);
  const [newError, setNewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const quantityInputs = useRef(new Map<string, HTMLInputElement>());
  const resultButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingQuantityFocus = useRef<string | null>(null);
  const [requestId] = useState(() => StockReceiptService.newId());

  useEffect(() => {
    if (categories.length === 0) void fetchCategories();
  }, [categories.length, fetchCategories]);

  // მთელი კატალოგი real-time-ში, დამალულიც (მაგ. მხოლოდ მაღაზიისთვის ნაყიდი)
  const catalog = useMemo<CatalogItem[]>(
    () =>
      products
        .filter((product) => !product.hasVariants)
        .map((product) => ({
          productId: product.id,
          name: product.name,
          code: product.productCode || "",
          stock: product.stock || 0,
          hidden: product.isActive === false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "ka")),
    [products],
  );
  const findProduct = (productId: string) => catalog.find((product) => product.productId === productId);
  const old = (productId: string) => receipt?.items.find((item) => item.productId === productId);
  const afterSave = (line: Line) =>
    line.newProduct
      ? line.quantity - line.toStore
      : (findProduct(line.productId)?.stock || 0) +
        (line.quantity - (old(line.productId)?.quantity || 0)) -
        (line.toStore - (old(line.productId)?.toStore || 0));
  const lineProblem = (line: Line): string => {
    if (!line.newProduct && !findProduct(line.productId)) return "პროდუქტი კატალოგიდან წაშლილია — ამოშალე ეს ხაზი.";
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) return "ჩაწერე დადებითი მთელი რაოდენობა.";
    if (!Number.isSafeInteger(line.toStore) || line.toStore < 0 || line.toStore > line.quantity)
      return "„აქედან მაღაზიაში“ მიღებულ რაოდენობაზე მეტი ვერ იქნება.";
    if (afterSave(line) < 0) return "ეს საქონელი უკვე გაიყიდა — საწყობში ამდენი აღარ არის.";
    return "";
  };
  const removed = receipt?.items.filter((item) => !lines.some((line) => line.productId === item.productId)) || [];
  const removedAfter = (item: { productId: string; quantity: number; toStore: number }) =>
    (findProduct(item.productId)?.stock || 0) - item.quantity + item.toStore;
  const invalid =
    lines.some((line) => !!lineProblem(line)) ||
    removed.some((item) => !!findProduct(item.productId) && removedAfter(item) < 0);
  const totalQuantity = lines.reduce((sum, line) => sum + (Number.isSafeInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0), 0);
  const totalToStore = lines.reduce((sum, line) => sum + (Number.isSafeInteger(line.toStore) && line.toStore > 0 ? line.toStore : 0), 0);

  const matching = catalog.filter((product) =>
    `${product.name} ${product.code}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const availableMatches = matching.filter((product) => !lines.some((line) => line.productId === product.productId));
  const highlighted = availableMatches[Math.min(highlightIndex, availableMatches.length - 1)];
  const supplierOptions = useMemo(() => [...new Set(suppliers.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ka")), [suppliers]);

  useEffect(() => {
    const key = pendingQuantityFocus.current;
    if (!key) return;
    const input = quantityInputs.current.get(key);
    if (input) {
      input.focus();
      input.select();
      pendingQuantityFocus.current = null;
    }
  }, [lines]);
  useEffect(() => {
    if (pickerOpen && highlighted) resultButtons.current.get(highlighted.productId)?.scrollIntoView({ block: "nearest" });
  }, [pickerOpen, highlighted]);

  const add = (product: CatalogItem) => {
    if (lines.some((line) => line.productId === product.productId)) return;
    pendingQuantityFocus.current = product.productId;
    setLines((previous) => [...previous, { productId: product.productId, quantity: 1, toStore: 0 }]);
    setSearch("");
    setPickerOpen(false);
    setHighlightIndex(0);
    setError("");
  };
  const openNewProduct = () => {
    const text = search.trim();
    const looksLikeCode = CODE_PATTERN.test(text.toUpperCase()) && /\d/.test(text);
    setNewForm({ name: looksLikeCode ? "" : text, code: looksLikeCode ? text.toUpperCase() : "", category: "" });
    setNewError("");
    setPickerOpen(false);
  };
  const addNewProduct = () => {
    if (!newForm) return;
    const name = newForm.name.trim();
    const code = newForm.code.trim().toUpperCase();
    if (!name) return setNewError("ჩაწერე პროდუქტის სახელი");
    if (!code || !CODE_PATTERN.test(code)) return setNewError("კოდი: მხოლოდ დიდი ასოები, ციფრები და „-“");
    const taken = products.find((product) => (product.productCode || "").toUpperCase() === code);
    if (taken) return setNewError(`კოდი ${code} უკვე აქვს „${taken.name}“-ს — აირჩიე ის ძებნით`);
    // ერთნაირი სახელები საიტზე ერთმანეთში ირევა (მაგ. სამი „ფაიფურის ნაკრები“)
    const sameName = products.find((product) => (product.name || "").trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (sameName)
      return setNewError(`„${sameName.name}“ საწყობში უკვე არის (კოდი ${sameName.productCode || "—"}). თუ იგივე პროდუქტია — აირჩიე ძებნით; თუ სხვაა — სახელში გაარჩიე (ფერი, ზომა…)`);
    if (lines.some((line) => line.newProduct?.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
      return setNewError(`„${name}“ ამ მიღებაში უკვე დაემატა`);
    if (lines.some((line) => line.newProduct?.productCode === code)) return setNewError(`კოდი ${code} ამ მიღებაში უკვე დაემატა`);
    const productId = StockReceiptService.newProductId();
    pendingQuantityFocus.current = productId;
    setLines((previous) => [
      ...previous,
      { productId, quantity: 1, toStore: 0, newProduct: { name, productCode: code, ...(newForm.category ? { category: newForm.category } : {}) } },
    ]);
    setNewForm(null);
    setSearch("");
    setError("");
  };
  const update = (index: number, patch: Partial<Line>) =>
    setLines((previous) => previous.map((line, position) => (position === index ? { ...line, ...patch } : line)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    if (!supplier.trim()) return setError("მიუთითე მომწოდებელი");
    if (!lines.length || invalid) return setError("გადაამოწმე პროდუქტები და რაოდენობები");
    busy.current = true;
    setSaving(true);
    setError("");
    const request = {
      date: movementDate,
      supplier,
      documentNumber,
      note,
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        toStore: line.toStore || 0,
        ...(line.newProduct ? { newProduct: line.newProduct } : {}),
      })),
    };
    try {
      if (receipt) await StockReceiptService.update(receipt.id, request);
      else await StockReceiptService.create(request, requestId);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "შენახვა ვერ მოხერხდა");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const inputClass = `w-full min-h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:ring-2 ${focusRing}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 p-2 sm:p-5 flex items-center justify-center">
      <form
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing) event.preventDefault();
        }}
        aria-label="მიღების ფორმა"
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <header className="px-4 sm:px-6 py-5 border-b border-gray-200 flex justify-between items-start gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">საწყობი · ტვირთის მიღება</p>
            <h2 className="font-bold text-xl text-emerald-800">{receipt ? "მიღების რედაქტირება" : "ახალი მიღება"}</h2>
            <p className="hidden sm:block text-xs text-gray-500 mt-2 leading-relaxed max-w-xl">
              {receipt
                ? "მიუთითე სრული რაოდენობები. ნაშთი მხოლოდ ძველ და ახალ რაოდენობებს შორის სხვაობით გასწორდება."
                : "ერთი ტვირთი — ერთი ჩანაწერი. ყველაფერი საწყობს ემატება; „აქედან მაღაზიაში“ ნაწილი იქვე გადავა მაღაზიაში."}
            </p>
          </div>
          <button type="button" aria-label="დახურვა" disabled={saving} onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          <section aria-label="ტვირთის მონაცემები" className="space-y-3">
          <Step n={1} title="ტვირთი" hint="როდის და ვისგან ჩამოვიდა" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-sm font-semibold text-gray-800">
              მიღების თარიღი
              <input type="date" required min="1000-01-01" max={storeTransferDateInput()} value={movementDate} disabled={saving}
                onChange={(event) => setMovementDate(event.target.value)} className={`block mt-2 font-normal ${inputClass}`} />
            </label>
            <label className="block text-sm font-semibold text-gray-800">
              მომწოდებელი
              <input list="receipt-suppliers" required maxLength={200} value={supplier} disabled={saving} autoFocus={!receipt}
                onChange={(event) => setSupplier(event.target.value)} placeholder="ვისგან მიიღე" className={`block mt-2 font-normal ${inputClass}`} />
              <datalist id="receipt-suppliers">
                {supplierOptions.map((value) => <option key={value} value={value} />)}
              </datalist>
            </label>
            <label className="block text-sm font-semibold text-gray-800">
              ზედნადების № <span className="font-normal text-xs text-gray-500">· სურვილისამებრ</span>
              <input maxLength={100} value={documentNumber} disabled={saving} onChange={(event) => setDocumentNumber(event.target.value)}
                placeholder="მომწოდებლის ზედნადები / ინვოისი" className={`block mt-2 font-normal ${inputClass}`} />
            </label>
          </div>
          </section>

          <section aria-label="პროდუქტის დამატება" className="space-y-2">
            <Step
              n={2}
              title="რა ჩამოვიდა"
              hint={receipt ? "მოძებნე საწყობში არსებული პროდუქტი." : "საწყობში არსებული — მოძებნე. სულ ახალი, რაც საწყობში ჯერ არ არის — „+ ახალი პროდუქტი“."}
              right={!receipt && !newForm ? (
                <button type="button" onClick={openNewProduct} disabled={saving}
                  className="min-h-11 shrink-0 px-3 justify-center rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 text-sm font-medium flex items-center gap-2 hover:bg-emerald-100">
                  <PackagePlus size={16} aria-hidden="true" />
                  + ახალი პროდუქტი
                </button>
              ) : undefined}
            />
            <label className="block">
              <span className="sr-only">მოძებნე საწყობში არსებული პროდუქტი</span>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  ref={searchInput}
                  value={search}
                  disabled={saving}
                  // ცარიელ ველზე მთელი კატალოგი თავისით არ იშლება — მხოლოდ დაწკაპებით ან აკრეფით
                  onClick={() => setPickerOpen(true)}
                  onFocus={() => { if (search.trim()) setPickerOpen(true); setHighlightIndex(0); }}
                  onChange={(event) => { setSearch(event.target.value); setPickerOpen(true); setHighlightIndex(0); }}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (pickerOpen && highlighted) add(highlighted);
                    }
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setPickerOpen(true);
                      if (availableMatches.length) {
                        const step = event.key === "ArrowDown" ? 1 : -1;
                        setHighlightIndex((index) => (pickerOpen ? (index + step + availableMatches.length) % availableMatches.length : 0));
                      }
                    }
                    if (event.key === "Escape") setPickerOpen(false);
                  }}
                  placeholder="სახელი ან პროდუქტის კოდი"
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 font-normal placeholder:text-gray-500 ${focusRing}`}
                />
              </div>
            </label>
            {pickerOpen && (
              <div role="region" aria-label="ძებნის შედეგები" className="border border-gray-200 rounded-xl overflow-y-auto max-h-72 divide-y divide-gray-100">
                {matching.map((product) => {
                  const selected = lines.some((line) => line.productId === product.productId);
                  const isHighlighted = highlighted?.productId === product.productId;
                  return (
                    <button
                      key={product.productId}
                      type="button"
                      ref={(node) => { if (node) resultButtons.current.set(product.productId, node); else resultButtons.current.delete(product.productId); }}
                      aria-label={`დამატება: ${product.name}`}
                      aria-current={isHighlighted ? "true" : undefined}
                      disabled={saving || selected}
                      onClick={() => add(product)}
                      className={`w-full min-h-11 text-left px-3 py-3 flex items-center gap-3 disabled:opacity-50 hover:bg-emerald-50 ${isHighlighted ? "bg-emerald-50" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.code} · საწყობში: {product.stock} ცალი
                          {product.hidden && <span className="ml-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">საიტზე დამალულია</span>}
                        </p>
                      </div>
                      <span className="text-xs shrink-0 text-emerald-800">{selected ? "დამატებულია" : <Plus size={19} />}</span>
                    </button>
                  );
                })}
                {!matching.length && (
                  <div className="p-4 text-sm text-gray-600 space-y-2">
                    <p>პროდუქტი ვერ მოიძებნა.</p>
                    {!receipt && (
                      <button type="button" onClick={openNewProduct} className="min-h-11 px-3 rounded-lg bg-emerald-700 text-white text-sm">
                        შექმენი ახალი პროდუქტი
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {receipt && <p className="text-xs text-gray-500">სულ ახალი პროდუქტი რედაქტირებისას ვერ დაემატება — მისთვის ახალი მიღება შექმენი.</p>}
          </section>

          {newForm && (
            <section aria-label="ახალი პროდუქტი" className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-emerald-900">ახალი პროდუქტი</h3>
                  <p className="text-xs text-emerald-900/80 mt-1">შეიქმნება საიტზე დამალული, ფასის და ფოტოს გარეშე. მერე საწყობში ✏️-ით შეავსებ და ჩართავ.</p>
                </div>
                <button type="button" aria-label="ახალი პროდუქტის გაუქმება" onClick={() => setNewForm(null)} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-medium text-gray-700">
                  პროდუქტის სახელი
                  <input aria-label="ახალი პროდუქტის სახელი" autoFocus maxLength={200} value={newForm.name}
                    onChange={(event) => setNewForm({ ...newForm, name: event.target.value })} className={`block mt-1 bg-white ${inputClass}`} />
                </label>
                <label className="text-xs font-medium text-gray-700">
                  პროდუქტის კოდი (არტიკული)
                  <input aria-label="ახალი პროდუქტის კოდი" maxLength={50} value={newForm.code} placeholder="მაგ: LBS-0010"
                    onChange={(event) => setNewForm({ ...newForm, code: event.target.value.toUpperCase() })} className={`block mt-1 bg-white font-mono ${inputClass}`} />
                </label>
                <label className="text-xs font-medium text-gray-700">
                  კატეგორია <span className="text-gray-500">· შეიძლება მერეც</span>
                  <select aria-label="ახალი პროდუქტის კატეგორია" value={newForm.category}
                    onChange={(event) => setNewForm({ ...newForm, category: event.target.value })} className={`block mt-1 bg-white ${inputClass}`}>
                    <option value="">—</option>
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                </label>
              </div>
              {newError && <p role="alert" className="text-xs text-red-700">{newError}</p>}
              <button type="button" onClick={addNewProduct} className="min-h-11 px-4 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800">
                ახალი პროდუქტის დამატება
              </button>
            </section>
          )}

          <section aria-label="მიღების პროდუქტები" className="space-y-3">
            <Step
              n={3}
              title="რამდენი ჩამოვიდა"
              hint="თითო პროდუქტზე ჩაწერე ჩამოსული რაოდენობა. თუ ნაწილი პირდაპირ მაღაზიაში მიდის — „აქედან მაღაზიაში“."
              right={<span className="text-xs text-gray-500 shrink-0 mt-1">{lines.length} პროდუქტი</span>}
            />
            {!lines.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-6 px-4 text-center">
                <p className="text-sm text-gray-600">აქ გამოჩნდება მე-2 ნაბიჯში დამატებული პროდუქტები.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                <div aria-hidden="true" className="hidden md:grid grid-cols-[minmax(0,1fr)_5rem_6.5rem_7rem_6rem_2.75rem] gap-x-2 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span>პროდუქტი / კოდი</span>
                  <span className="text-center">საწყობში ახლა</span>
                  <span className="text-center">{receipt ? "სრული რაოდენობა" : "მიღებული"}</span>
                  <span className="text-center">აქედან მაღაზიაში</span>
                  <span className="text-center">საწყობში დარჩება</span>
                  <span className="sr-only">ამოშლა</span>
                </div>
                {lines.map((line, index) => {
                  const product = findProduct(line.productId);
                  const name = line.newProduct?.name || product?.name || old(line.productId)?.name || line.productId;
                  const code = line.newProduct?.productCode || product?.code || old(line.productId)?.productCode || "";
                  const problem = lineProblem(line);
                  return (
                    <div key={line.productId} role="group" aria-label={name}
                      className={`relative grid grid-cols-3 md:grid-cols-[minmax(0,1fr)_5rem_6.5rem_7rem_6rem_2.75rem] items-center gap-x-2 gap-y-2 px-3 py-2 border-l-2 ${problem ? "border-l-red-600 bg-red-50" : "border-l-transparent"}`}>
                      <div className="col-span-3 md:col-span-1 min-w-0 pr-11 md:pr-0">
                        <p className="font-medium text-sm text-gray-900 truncate" title={name}>
                          {name}
                          {line.newProduct && <span className="ml-2 align-middle rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-normal text-emerald-800">ახალი</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate font-mono">
                          {code}
                          {receipt && old(line.productId) ? ` · იყო: ${old(line.productId)!.quantity}${old(line.productId)!.toStore ? ` (მაღაზიაში ${old(line.productId)!.toStore})` : ""}` : ""}
                        </p>
                      </div>
                      <div className="min-w-0 text-center">
                        <p className="md:hidden text-xs text-gray-500">ახლა</p>
                        <p className="text-sm text-gray-700 tabular-nums">{line.newProduct ? "—" : product?.stock ?? 0}</p>
                      </div>
                      <label className="min-w-0 text-center text-xs text-gray-600">
                        <span className="md:sr-only">მიღებული</span>
                        <input
                          ref={(node) => { if (node) quantityInputs.current.set(line.productId, node); else quantityInputs.current.delete(line.productId); }}
                          aria-label={`რაოდენობა: ${name}`}
                          type="number" min="1" step="1" required
                          value={line.quantity || ""}
                          disabled={saving}
                          aria-invalid={!!problem}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); searchInput.current?.focus(); }
                          }}
                          onChange={(event) => update(index, { quantity: Number(event.target.value) })}
                          className={`w-full min-w-0 min-h-11 border rounded-lg px-2 text-center text-base bg-white outline-none focus:ring-2 ${focusRing} ${problem ? "border-red-400" : "border-gray-300"}`}
                        />
                      </label>
                      <label className="min-w-0 text-center text-xs text-gray-600">
                        <span className="md:sr-only">მაღაზიაში</span>
                        <input
                          aria-label={`აქედან მაღაზიაში: ${name}`}
                          type="number" min="0" step="1"
                          max={line.quantity || undefined}
                          value={line.toStore || ""}
                          placeholder="0"
                          disabled={saving}
                          onChange={(event) => update(index, { toStore: event.target.value === "" ? 0 : Number(event.target.value) })}
                          className={`w-full min-w-0 min-h-11 border border-amber-300 rounded-lg px-2 text-center text-base bg-amber-50/40 outline-none focus:ring-2 focus:ring-amber-400`}
                        />
                      </label>
                      <div className="min-w-0 text-center" aria-label={`საწყობში დარჩება: ${name}`}>
                        <p className="md:hidden text-xs text-gray-500">დარჩება</p>
                        <p className={`text-sm font-semibold tabular-nums ${problem ? "text-red-700" : "text-emerald-800"}`}>{problem ? "—" : afterSave(line)}</p>
                      </div>
                      <button type="button" aria-label={`ამოშლა: ${name}`} disabled={saving}
                        onClick={() => setLines((previous) => previous.filter((_, position) => position !== index))}
                        className="absolute right-3 top-2 md:static min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                      {problem && <p role="alert" className="col-span-3 md:col-span-6 text-xs text-red-700">{problem}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {!!removed.length && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p className="font-medium">მიღებიდან ამოღებული პროდუქტები</p>
              {removed.map((item) => (
                <p key={item.productId} className={findProduct(item.productId) && removedAfter(item) < 0 ? "text-red-700" : ""}>
                  {findProduct(item.productId)?.name || item.name} ·{" "}
                  {!findProduct(item.productId)
                    ? "პროდუქტი კატალოგიდან წაშლილია — ნაშთი არ შეიცვლება"
                    : removedAfter(item) < 0
                      ? "ვერ ამოიშლება — ეს საქონელი უკვე გაიყიდა"
                      : `შენახვის შემდეგ საწყობში: ${removedAfter(item)} ცალი`}
                </p>
              ))}
            </div>
          )}

          <label className="block text-sm font-semibold text-gray-800">
            კომენტარი <span className="font-normal text-xs text-gray-500">· სურვილისამებრ</span>
            <textarea rows={2} maxLength={2000} value={note} disabled={saving} onChange={(event) => setNote(event.target.value)}
              placeholder="მაგალითად: ნოემბრის იმპორტი" className={`block mt-2 w-full border border-gray-300 rounded-xl p-3 text-sm font-normal outline-none focus:ring-2 placeholder:text-gray-500 ${focusRing}`} />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>

        <footer className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <div>
            <p className="font-semibold text-sm">
              {lines.length} პროდუქტი · {totalQuantity} ცალი{totalToStore ? ` · აქედან მაღაზიაში ${totalToStore}` : ""}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {receipt
                ? "შენახვისას განახლდება ეს მიღება, მისი მაღაზიის გადატანა და ნაშთები."
                : totalToStore
                  ? `საწყობს დაემატება ${totalQuantity} ცალი, მაღაზიაში გადავა ${totalToStore} — საწყობში დარჩება ${totalQuantity - totalToStore}.`
                  : `შენახვისას საწყობს დაემატება ${totalQuantity} ცალი.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={onClose} className="min-h-11 px-4 rounded-lg border border-gray-300 bg-white">
              გაუქმება
            </button>
            <button type="submit" disabled={saving || !lines.length || invalid || !supplier.trim()}
              className="min-h-11 px-5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40">
              {saving ? "ინახება…" : receipt ? "ცვლილებების შენახვა" : "მიღების შენახვა"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export default ReceiptModal;
