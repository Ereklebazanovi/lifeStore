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
  /** სულ ახალი პროდუქტი — სახელი/კოდი/კატეგორია პირდაპირ ხაზში ივსება */
  newProduct?: NewReceiptProduct;
}
interface CatalogItem {
  productId: string;
  name: string;
  code: string;
  stock: number;
  hidden: boolean;
}
type Option = { kind: "product"; product: CatalogItem } | { kind: "new"; text: string };

const CODE_PATTERN = /^[A-Z0-9-]+$/;
const focusRing = "focus:ring-emerald-500";
const sameText = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
const looksLikeCode = (text: string) => CODE_PATTERN.test(text.toUpperCase()) && /\d/.test(text);

// დანომრილი ნაბიჯი: ფორმა ზემოდან ქვემოთ იკითხება — 1 ტვირთი, 2 პროდუქტები
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  // ველები ხაზებში: `${productId}:qty` / `:name` / `:code` — დამატებისას კურსორი პირდაპირ საჭირო ველზე გადადის
  const fields = useRef(new Map<string, HTMLInputElement>());
  const optionButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const [requestId] = useState(() => StockReceiptService.newId());
  const fieldRef = (key: string) => (node: HTMLInputElement | null) => {
    if (node) fields.current.set(key, node);
    else fields.current.delete(key);
  };

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

  /** ახალი პროდუქტის სახელი/კოდი — იგივე წესები, რაც სერვისში + ერთნაირი სახელის აკრძალვა */
  const newProductProblem = (line: Line, index: number): string => {
    const draft = line.newProduct!;
    const name = draft.name.trim();
    const code = draft.productCode.trim().toUpperCase();
    if (!name) return "ჩაწერე ახალი პროდუქტის სახელი.";
    const sameName = products.find((product) => sameText(product.name || "", name));
    if (sameName)
      return `„${sameName.name}“ საწყობში უკვე არის (კოდი ${sameName.productCode || "—"}). თუ იგივე პროდუქტია — ამოშალე ეს ხაზი და მოძებნე; თუ სხვაა — სახელში გაარჩიე (ფერი, ზომა…).`;
    if (lines.some((other, position) => position !== index && other.newProduct && sameText(other.newProduct.name, name)))
      return `„${name}“ ამ მიღებაში ორჯერაა.`;
    if (!code) return "ჩაწერე ახალი პროდუქტის კოდი (არტიკული).";
    if (!CODE_PATTERN.test(code)) return "კოდი: მხოლოდ ლათინური დიდი ასოები, ციფრები და „-“ (მაგ: LBS-0010).";
    const taken = products.find((product) => (product.productCode || "").toUpperCase() === code);
    if (taken) return `კოდი ${code} უკვე აქვს „${taken.name}“-ს — ამოშალე ეს ხაზი და მოძებნე ის.`;
    if (lines.some((other, position) => position !== index && other.newProduct?.productCode.trim().toUpperCase() === code))
      return `კოდი ${code} ამ მიღებაში ორჯერაა.`;
    return "";
  };
  const lineProblem = (line: Line, index: number): string => {
    if (line.newProduct) {
      const problem = newProductProblem(line, index);
      if (problem) return problem;
    } else if (!findProduct(line.productId)) return "პროდუქტი კატალოგიდან წაშლილია — ამოშალე ეს ხაზი.";
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
    lines.some((line, index) => !!lineProblem(line, index)) ||
    removed.some((item) => !!findProduct(item.productId) && removedAfter(item) < 0);
  const totalQuantity = lines.reduce((sum, line) => sum + (Number.isSafeInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0), 0);
  const totalToStore = lines.reduce((sum, line) => sum + (Number.isSafeInteger(line.toStore) && line.toStore > 0 ? line.toStore : 0), 0);
  const hasNew = lines.some((line) => line.newProduct);

  // ძებნის სია: არსებული პროდუქტები + ბოლოს „ახალი პროდუქტი: <ტექსტი>“ (თუ ზუსტად ასეთი არ არსებობს)
  const searchText = search.trim();
  const matching = catalog.filter((product) => `${product.name} ${product.code}`.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()));
  const exactExists = !!searchText && catalog.some((product) => sameText(product.name, searchText) || sameText(product.code, searchText));
  const options: Option[] = [
    ...matching.filter((product) => !lines.some((line) => line.productId === product.productId)).map((product) => ({ kind: "product" as const, product })),
    ...(!receipt && searchText && !exactExists ? [{ kind: "new" as const, text: searchText }] : []),
  ];
  const optionKey = (option: Option) => (option.kind === "product" ? option.product.productId : "__new");
  const highlighted = options[Math.min(highlightIndex, options.length - 1)];
  const supplierOptions = useMemo(() => [...new Set(suppliers.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ka")), [suppliers]);

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    const input = fields.current.get(key);
    if (input) {
      input.focus();
      input.select();
      pendingFocus.current = null;
    }
  }, [lines]);
  useEffect(() => {
    if (pickerOpen && highlighted) optionButtons.current.get(optionKey(highlighted))?.scrollIntoView({ block: "nearest" });
  }, [pickerOpen, highlighted]);

  const closeSearch = () => {
    setSearch("");
    setPickerOpen(false);
    setHighlightIndex(0);
    setError("");
  };
  const add = (product: CatalogItem) => {
    if (lines.some((line) => line.productId === product.productId)) return;
    pendingFocus.current = `${product.productId}:qty`;
    setLines((previous) => [...previous, { productId: product.productId, quantity: 1, toStore: 0 }]);
    closeSearch();
  };
  /** ახალი პროდუქტის ხაზი — ძებნაში ჩაწერილი ტექსტი სახელად (ან კოდად, თუ კოდს ჰგავს) გადადის */
  const addNew = (text = "") => {
    const isCode = !!text && looksLikeCode(text);
    const productId = StockReceiptService.newProductId();
    const newProduct: NewReceiptProduct = { name: isCode ? "" : text, productCode: isCode ? text.toUpperCase() : "" };
    pendingFocus.current = `${productId}:${newProduct.name ? "code" : "name"}`;
    setLines((previous) => [...previous, { productId, quantity: 1, toStore: 0, newProduct }]);
    closeSearch();
  };
  const choose = (option: Option) => (option.kind === "product" ? add(option.product) : addNew(option.text));
  const update = (index: number, patch: Partial<Line>) =>
    setLines((previous) => previous.map((line, position) => (position === index ? { ...line, ...patch } : line)));
  const updateNew = (index: number, patch: Partial<NewReceiptProduct>) =>
    setLines((previous) =>
      previous.map((line, position) => (position === index && line.newProduct ? { ...line, newProduct: { ...line.newProduct, ...patch } } : line)),
    );

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
        ...(line.newProduct
          ? {
              newProduct: {
                name: line.newProduct.name.trim(),
                productCode: line.newProduct.productCode.trim().toUpperCase(),
                ...(line.newProduct.category ? { category: line.newProduct.category } : {}),
              },
            }
          : {}),
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
  const cellInput = `w-full min-w-0 min-h-10 border rounded-lg px-2 text-sm bg-white outline-none focus:ring-2 ${focusRing}`;
  const grid = "md:grid-cols-[minmax(0,1fr)_5rem_6.5rem_7rem_6rem_2.75rem]";

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
        <header className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-start gap-3">
          <div>
            <h2 className="font-bold text-xl text-emerald-800">{receipt ? "მიღების რედაქტირება" : "ახალი მიღება"}</h2>
            <p className="hidden sm:block text-xs text-gray-500 mt-1 leading-relaxed max-w-xl">
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

          <section aria-label="მიღების პროდუქტები" className="space-y-3">
            <Step
              n={2}
              title="პროდუქტები"
              hint={
                receipt
                  ? "შეცვალე რაოდენობები ან მოძებნე და დაამატე საწყობში არსებული პროდუქტი."
                  : "მოძებნე სახელით ან კოდით. თუ საწყობში ჯერ არ არის — ჩაწერე სახელი და აირჩიე „ახალი პროდუქტი“."
              }
            />

            <div className="rounded-xl border border-gray-200">
              {/* ძებნა — ცხრილის თავში; სია ზემოდან ეფარება და ფორმას არ წევს */}
              <div className="relative p-2 sm:p-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                <label className="block">
                  <span className="sr-only">პროდუქტის ძებნა ან ახალი პროდუქტის სახელი</span>
                  <Search size={18} className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchInput}
                    value={search}
                    disabled={saving}
                    role="combobox"
                    aria-expanded={pickerOpen}
                    aria-controls="receipt-search-options"
                    onClick={() => setPickerOpen(true)}
                    onBlur={() => setPickerOpen(false)}
                    onChange={(event) => { setSearch(event.target.value); setPickerOpen(true); setHighlightIndex(0); }}
                    onKeyDown={(event) => {
                      if (event.nativeEvent.isComposing) return;
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (pickerOpen && highlighted) choose(highlighted);
                      }
                      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        setPickerOpen(true);
                        if (options.length) {
                          const step = event.key === "ArrowDown" ? 1 : -1;
                          setHighlightIndex((index) => (pickerOpen ? (index + step + options.length) % options.length : 0));
                        }
                      }
                      if (event.key === "Escape") setPickerOpen(false);
                    }}
                    placeholder={receipt ? "მოძებნე სახელით ან კოდით…" : "მოძებნე სახელით ან კოდით, ან ჩაწერე ახლის სახელი…"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 text-sm placeholder:text-gray-500 ${focusRing}`}
                  />
                </label>
                {pickerOpen && (matching.length > 0 || options.length > 0 || !!searchText) && (
                  <div
                    id="receipt-search-options"
                    role="listbox"
                    aria-label="ძებნის შედეგები"
                    // mousedown-ზე ფოკუსი ძებნაში რჩება, რომ არჩევამდე სია არ დაიხუროს
                    onMouseDown={(event) => event.preventDefault()}
                    className="absolute left-2 right-2 sm:left-3 sm:right-3 top-full -mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto max-h-72 divide-y divide-gray-100"
                  >
                    {matching.map((product) => {
                      const selected = lines.some((line) => line.productId === product.productId);
                      const isHighlighted = highlighted?.kind === "product" && highlighted.product.productId === product.productId;
                      return (
                        <button
                          key={product.productId}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          ref={(node) => { if (node) optionButtons.current.set(product.productId, node); else optionButtons.current.delete(product.productId); }}
                          aria-label={`დამატება: ${product.name}`}
                          disabled={saving || selected}
                          onClick={() => add(product)}
                          className={`w-full min-h-11 text-left px-3 py-2.5 flex items-center gap-3 disabled:opacity-50 hover:bg-emerald-50 ${isHighlighted ? "bg-emerald-50" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium break-words">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              <span className="font-mono">{product.code}</span> · საწყობში: {product.stock} ცალი
                              {product.hidden && <span className="ml-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">საიტზე დამალულია</span>}
                            </p>
                          </div>
                          <span className="text-xs shrink-0 text-emerald-800">{selected ? "უკვე დამატებულია" : <Plus size={19} />}</span>
                        </button>
                      );
                    })}
                    {!matching.length && <p className="px-3 py-3 text-sm text-gray-600">საწყობში „{searchText}“ ვერ მოიძებნა.</p>}
                    {options.some((option) => option.kind === "new") && (
                      <button
                        type="button"
                        role="option"
                        aria-selected={highlighted?.kind === "new"}
                        ref={(node) => { if (node) optionButtons.current.set("__new", node); else optionButtons.current.delete("__new"); }}
                        aria-label={`ახალი პროდუქტი: ${searchText}`}
                        onClick={() => addNew(searchText)}
                        className={`w-full min-h-12 text-left px-3 py-2.5 flex items-center gap-3 text-emerald-900 hover:bg-emerald-50 ${highlighted?.kind === "new" ? "bg-emerald-50" : ""}`}
                      >
                        <PackagePlus size={18} className="shrink-0" aria-hidden="true" />
                        <span className="text-sm">
                          <span className="font-semibold">ახალი პროდუქტი:</span> „{searchText}“
                          <span className="block text-xs text-emerald-800/80">საწყობში ჯერ არ არის — შეიქმნება ამ მიღებით</span>
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!lines.length ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm text-gray-600">ჯერ ცარიელია — ზემოთ მოძებნე პროდუქტი.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div aria-hidden="true" className={`hidden md:grid ${grid} gap-x-2 px-3 py-2 text-xs text-gray-600`}>
                    <span>პროდუქტი</span>
                    <span className="text-center">საწყობში ახლა</span>
                    <span className="text-center">{receipt ? "სრული რაოდენობა" : "ჩამოვიდა"}</span>
                    <span className="text-center">აქედან მაღაზიაში</span>
                    <span className="text-center">საწყობში დარჩება</span>
                    <span className="sr-only">ამოშლა</span>
                  </div>
                  {lines.map((line, index) => {
                    const product = findProduct(line.productId);
                    const draft = line.newProduct;
                    const name = draft ? draft.name.trim() || "ახალი პროდუქტი" : product?.name || old(line.productId)?.name || line.productId;
                    const code = product?.code || old(line.productId)?.productCode || "";
                    const problem = lineProblem(line, index);
                    return (
                      <div key={line.productId} role="group" aria-label={name}
                        className={`relative grid grid-cols-3 ${grid} items-start gap-x-2 gap-y-2 px-3 py-3 border-l-2 ${problem ? "border-l-red-600 bg-red-50/60" : draft ? "border-l-emerald-500 bg-emerald-50/40" : "border-l-transparent"}`}>
                        <div className="col-span-3 md:col-span-1 min-w-0 pr-11 md:pr-0">
                          {draft ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-medium text-white">ახალი</span>
                                <input ref={fieldRef(`${line.productId}:name`)} aria-label="ახალი პროდუქტის სახელი" maxLength={200}
                                  value={draft.name} placeholder="პროდუქტის სახელი" disabled={saving}
                                  onChange={(event) => updateNew(index, { name: event.target.value })}
                                  onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) fields.current.get(`${line.productId}:code`)?.focus(); }}
                                  className={`${cellInput} border-gray-300 font-medium`} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input ref={fieldRef(`${line.productId}:code`)} aria-label="ახალი პროდუქტის კოდი" maxLength={50}
                                  value={draft.productCode} placeholder="კოდი, მაგ: LBS-0010" disabled={saving}
                                  onChange={(event) => updateNew(index, { productCode: event.target.value.toUpperCase() })}
                                  onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) fields.current.get(`${line.productId}:qty`)?.focus(); }}
                                  className={`${cellInput} border-gray-300 font-mono`} />
                                <select aria-label="ახალი პროდუქტის კატეგორია" value={draft.category || ""} disabled={saving}
                                  onChange={(event) => updateNew(index, { category: event.target.value })}
                                  className={`${cellInput} border-gray-300 ${draft.category ? "" : "text-gray-500"}`}>
                                  <option value="">კატეგორია</option>
                                  {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-sm text-gray-900 truncate md:mt-2" title={name}>{name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                <span className="font-mono">{code}</span>
                                {receipt && old(line.productId) ? ` · იყო: ${old(line.productId)!.quantity}${old(line.productId)!.toStore ? ` (მაღაზიაში ${old(line.productId)!.toStore})` : ""}` : ""}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="min-w-0 text-center md:pt-2.5">
                          <p className="md:hidden text-xs text-gray-500">ახლა</p>
                          <p className="text-sm text-gray-700 tabular-nums">{draft ? "—" : product?.stock ?? 0}</p>
                        </div>
                        <label className="min-w-0 text-center text-xs text-gray-600">
                          <span className="md:sr-only">ჩამოვიდა</span>
                          <input
                            ref={fieldRef(`${line.productId}:qty`)}
                            aria-label={`რაოდენობა: ${name}`}
                            type="number" min="1" step="1" required
                            value={line.quantity || ""}
                            disabled={saving}
                            aria-invalid={!!problem}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); searchInput.current?.focus(); }
                            }}
                            onChange={(event) => update(index, { quantity: Number(event.target.value) })}
                            className={`${cellInput} min-h-11 text-center text-base ${problem ? "border-red-400" : "border-gray-300"}`}
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
                            className="w-full min-w-0 min-h-11 border border-amber-300 rounded-lg px-2 text-center text-base bg-amber-50/40 outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </label>
                        <div className="min-w-0 text-center md:pt-2.5" aria-label={`საწყობში დარჩება: ${name}`}>
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
            </div>
            {hasNew && (
              <p className="text-xs text-emerald-900 bg-emerald-50 rounded-lg px-3 py-2">
                „ახალი“ პროდუქტები შეიქმნება საიტზე დამალული, ფასისა და ფოტოს გარეშე. მერე საწყობში ✏️-ით შეავსებ და ჩართავ.
              </p>
            )}
            {receipt && <p className="text-xs text-gray-500">სულ ახალი პროდუქტი რედაქტირებისას ვერ დაემატება — მისთვის ახალი მიღება შექმენი.</p>}
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
              {!supplier.trim() && lines.length
                ? "შესანახად მიუთითე მომწოდებელი (ნაბიჯი 1)."
                : receipt
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
