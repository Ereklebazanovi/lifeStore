import React, { useState, useEffect } from "react";
import { useProductStore } from "../../../store/productStore";
import { useCategoryStore } from "../../../store/categoryStore";
import { showToast } from "../../../components/ui/Toast";
import { stockNotificationService } from "../../../services/stockNotificationService";
import type { Product } from "../../../types";
import { exportInventoryToExcel, exportTurnoverToExcel } from "../../../utils/excelExporter";
import EditProductModalVariants from "./EditProductModalVariants";

import {
  Package,
  Search,
  RefreshCw,
  Download,
  Calendar,
  CheckSquare,
  Square,
  Pencil,
  ArrowUpDown,
  PackagePlus,
} from "lucide-react";

// კორექცია: დათვლის სხვაობა, დაზიანება და სხვა შესწორება. ახალი ტვირთი — „მიღებით“.
const CORRECTION_REASONS = ["დათვლის სხვაობა", "დაზიანება/დანაკარგი", "სხვა"] as const;

interface CorrectionModalProps {
  product: Product;
  onClose: () => void;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({ product, onClose }) => {
  const { adjustStock } = useProductStore();
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<(typeof CORRECTION_REASONS)[number]>("დათვლის სხვაობა");
  const [otherReason, setOtherReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const currentStock = product.stock || 0;
  const delta = direction === "add" ? quantity : -quantity;
  const nextStock = currentStock + delta;
  const reasonText = reason === "სხვა" ? otherReason.trim() : reason;
  const invalid =
    !Number.isSafeInteger(quantity) || quantity < 1 || nextStock < 0 || !reasonText || reasonText.length > 200;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || isSaving) return;
    try {
      setIsSaving(true);
      const saved = await adjustStock(product.id, delta, `Correction: ${reasonText}`);
      if (saved - delta === 0 && saved > 0) {
        stockNotificationService.sendNotifications(product.id, product.name, product.id).catch(console.error);
      }
      showToast(`${product.name}: მარაგი ${saved} ცალი`, "success");
      onClose();
    } catch (error) {
      console.error("Stock correction error:", error);
      showToast(error instanceof Error ? error.message : "კორექცია ვერ შეინახა", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="correction-title"
        className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4" aria-label="მარაგის კორექცია">
          <div>
            <h3 id="correction-title" className="text-base sm:text-lg font-bold text-gray-900">მარაგის კორექცია</h3>
            <p className="text-sm text-gray-600 mt-1">
              {product.name} · <span className="font-mono">{product.productCode || "—"}</span>
            </p>
            <p className="text-sm text-gray-600">
              ახლა: <span className="font-bold">{currentStock} ცალი</span>
            </p>
          </div>

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
            ახალი ტვირთი შეიყვანეთ „მიღებით“. კორექცია მხოლოდ დათვლის სხვაობისა და დაზიანებისთვისაა.
          </p>

          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="მიმართულება">
            {(["remove", "add"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={direction === value}
                onClick={() => setDirection(value)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                  direction === value
                    ? value === "add"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-red-600 border-red-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {value === "add" ? "+ მატება" : "− კლება"}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">რაოდენობა</span>
            <input
              type="number"
              min={1}
              step={1}
              max={direction === "remove" ? currentStock : undefined}
              value={Number.isFinite(quantity) ? quantity : ""}
              onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">მიზეზი</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as (typeof CORRECTION_REASONS)[number])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              {CORRECTION_REASONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          {reason === "სხვა" && (
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">მიზეზის აღწერა</span>
              <input
                type="text"
                value={otherReason}
                maxLength={200}
                onChange={(event) => setOtherReason(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </label>
          )}

          <p className={`text-sm p-3 rounded-lg ${nextStock < 0 ? "bg-red-50 text-red-700" : "bg-blue-50 text-gray-700"}`}>
            {nextStock < 0 ? `მარაგში მხოლოდ ${currentStock} ცალია` : <>შენახვის შემდეგ: <span className="font-bold">{nextStock} ცალი</span></>}
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={invalid || isSaving}
              className="flex-1 px-4 py-2 text-white rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "ინახება..." : "კორექციის შენახვა"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const getStockStatusColor = (stock: number) => {
  if (stock === 0) return "bg-red-100 text-red-800";
  if (stock <= 5) return "bg-yellow-100 text-yellow-800";
  if (stock <= 10) return "bg-blue-100 text-blue-800";
  return "text-emerald-600 bg-emerald-50";
};

const PriceCell: React.FC<{ product: Product }> = ({ product }) => {
  const price = product.price || 0;
  if (product.salePrice && product.salePrice < price) {
    return (
      <>
        <span className="block text-xs text-orange-600 font-semibold line-through decoration-orange-400">₾{price.toFixed(2)}</span>
        <span className="block text-sm font-medium text-emerald-600">₾{product.salePrice.toFixed(2)}</span>
      </>
    );
  }
  return price > 0 ? (
    <span className="text-sm font-medium text-gray-900">₾{price.toFixed(2)}</span>
  ) : (
    <span className="text-xs font-medium text-amber-700">ფასი არ აქვს</span>
  );
};

interface SiteToggleProps {
  product: Product;
  canEdit: boolean;
  busy: boolean;
  onToggle: (product: Product) => void;
}

// „საიტზე“ — ადმინს ჩამრთველი, მენეჯერს მხოლოდ სტატუსი
const SiteToggle: React.FC<SiteToggleProps> = ({ product, canEdit, busy, onToggle }) => {
  const active = product.isActive !== false;
  if (!canEdit) {
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {active ? "საიტზე ჩანს" : "დამალულია"}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`საიტზე: ${product.name}`}
      disabled={busy}
      onClick={() => onToggle(product)}
      className="inline-flex items-center gap-2 disabled:opacity-50"
      title={active ? "საიტზე ჩანს — დააჭირე დასამალად" : "დამალულია — დააჭირე საიტზე გამოსაჩენად"}
    >
      <span className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      <span className={`text-xs font-medium ${active ? "text-emerald-700" : "text-gray-500"}`}>{active ? "ჩანს" : "დამალულია"}</span>
    </button>
  );
};

interface ProductRowProps {
  product: Product;
  canEdit: boolean;
  isSelected: boolean;
  isToggling: boolean;
  onSelectProduct: (productId: string) => void;
  onToggleActive: (product: Product) => void;
  onEdit: (product: Product) => void;
  onCorrect: (product: Product) => void;
  onShowReceipts?: (product: Product) => void;
}

const ProductThumb: React.FC<{ product: Product; size: string }> = ({ product, size }) =>
  product.images && product.images.length > 0 ? (
    <img src={product.images[0]} alt={product.name} className={`${size} object-cover rounded-lg border border-gray-200 flex-shrink-0`} />
  ) : (
    <div className={`${size} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0`}>
      <Package className="w-6 h-6 text-gray-400" />
    </div>
  );

const ActionButtons: React.FC<{
  product: Product;
  onEdit: (p: Product) => void;
  onCorrect: (p: Product) => void;
  onShowReceipts?: (p: Product) => void;
}> = ({ product, onEdit, onCorrect, onShowReceipts }) => (
  <div className="flex items-center justify-center gap-1">
    <button
      type="button"
      onClick={() => onEdit(product)}
      className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
      title="რედაქტირება"
      aria-label={`რედაქტირება: ${product.name}`}
    >
      <Pencil className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onCorrect(product)}
      className="h-8 px-2 flex items-center justify-center gap-1 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 text-xs font-medium"
      title="მარაგის კორექცია"
      aria-label={`კორექცია: ${product.name}`}
    >
      <ArrowUpDown className="w-3.5 h-3.5" />
      კორექცია
    </button>
    {onShowReceipts && (
      <button
        type="button"
        onClick={() => onShowReceipts(product)}
        className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        title="მიღებები — რამდენჯერ, როდის და ვისგან"
        aria-label={`მიღებები: ${product.name}`}
      >
        <PackagePlus className="w-4 h-4" />
      </button>
    )}
  </div>
);

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  canEdit,
  isSelected,
  isToggling,
  onSelectProduct,
  onToggleActive,
  onEdit,
  onCorrect,
  onShowReceipts,
}) => {
  const stock = product.stock || 0;
  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50/30 transition-colors ${product.isActive === false ? "bg-gray-50/60" : ""}`}>
      <td className="px-4 py-3 text-center">
        <button onClick={() => onSelectProduct(product.id)} className="flex items-center justify-center w-full" aria-label={`მონიშვნა: ${product.name}`}>
          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ProductThumb product={product} size="w-12 h-12" />
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium truncate ${product.isActive === false ? "text-gray-600" : "text-gray-900"}`}>{product.name}</h3>
            <p className="text-xs text-gray-500 truncate font-mono">{product.productCode || "კოდი არ აქვს"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-xs text-gray-700">{product.category || <span className="text-amber-700">—</span>}</td>
      <td className="px-4 py-3 text-center"><PriceCell product={product} /></td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${getStockStatusColor(stock)}`}>{stock} ცალი</span>
      </td>
      <td className="px-4 py-3 text-center">
        <SiteToggle product={product} canEdit={canEdit} busy={isToggling} onToggle={onToggleActive} />
      </td>
      <td className="px-4 py-3 text-center">
        {canEdit ? <ActionButtons product={product} onEdit={onEdit} onCorrect={onCorrect} onShowReceipts={onShowReceipts} /> : <span className="text-gray-300 text-sm">—</span>}
      </td>
    </tr>
  );
};

// Mobile card
const ProductCard: React.FC<ProductRowProps> = ({
  product,
  canEdit,
  isSelected,
  isToggling,
  onSelectProduct,
  onToggleActive,
  onEdit,
  onCorrect,
  onShowReceipts,
}) => {
  const stock = product.stock || 0;
  return (
    <div className={`bg-white border border-gray-200 rounded-md sm:rounded-lg overflow-hidden ${product.isActive === false ? "bg-gray-50/60" : ""}`}>
      <div className="p-2 sm:p-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <button onClick={() => onSelectProduct(product.id)} className="flex items-center justify-center mt-1" aria-label={`მონიშვნა: ${product.name}`}>
            {isSelected ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
          </button>
          <ProductThumb product={product} size="w-12 h-12 sm:w-14 sm:h-14" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">{product.name}</h3>
            <p className="text-xs text-gray-500 truncate font-mono">{product.productCode || "კოდი არ აქვს"}</p>
            <p className="text-xs text-gray-500 truncate">{product.category || "კატეგორია არ აქვს"}</p>
            <div className="flex items-center justify-between mt-1">
              <div><PriceCell product={product} /></div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStockStatusColor(stock)}`}>{stock} ცალი</span>
            </div>
          </div>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <SiteToggle product={product} canEdit={canEdit} busy={isToggling} onToggle={onToggleActive} />
          {canEdit && <ActionButtons product={product} onEdit={onEdit} onCorrect={onCorrect} onShowReceipts={onShowReceipts} />}
        </div>
      </div>
    </div>
  );
};

// Main Component
const InventoryManagerVariants: React.FC<{ canEdit?: boolean; onShowReceipts?: (productId: string) => void }> = ({ canEdit = true, onShowReceipts }) => {
  const { products, isLoading, fetchProducts, toggleProductStatus } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "active" | "hidden">("all");
  const [sortBy, setSortBy] = useState("name");
  // ✏️ და კორექცია — id-ით, რომ ფანჯარამ ყოველთვის ბოლო (real-time) მონაცემი აჩვენოს
  const [editingId, setEditingId] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const editingProduct = editingId ? products.find((product) => product.id === editingId) : undefined;
  const correctingProduct = correctingId ? products.find((product) => product.id === correctingId) : undefined;

  // Export functionality states
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isStockSnapshotModalOpen, setIsStockSnapshotModalOpen] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState("");
  const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);
  const [turnoverDateRange, setTurnoverDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (categories.length === 0) void fetchCategories();
  }, [categories.length, fetchCategories]);

  const handleToggleActive = async (product: Product) => {
    const activating = product.isActive === false;
    try {
      setTogglingId(product.id);
      await toggleProductStatus(product.id);
      showToast(activating ? `${product.name} — საიტზე გამოჩნდა` : `${product.name} — საიტზე დაიმალა`, "success");
    } catch (error) {
      console.error("Toggle product error:", error);
      showToast(error instanceof Error ? error.message : "სტატუსი ვერ შეიცვალა", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Export functionality
  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleStockSnapshot = () => {
    try {
      let targetDate: Date | undefined;

      if (snapshotDate) {
        targetDate = new Date(snapshotDate);
        // Set time to end of day (23:59:59.999)
        targetDate.setHours(23, 59, 59, 999);
      }

      const result = exportInventoryToExcel(products, selectedProducts, targetDate ? { startDate: targetDate, endDate: targetDate } : undefined);

      if (result.success) {
        showToast(
          `მარაგის ნაშთი წარმატებით ექსპორტირდა!\n${result.exportedProducts} პროდუქტი, ${result.totalStock} ცალი, ₾${(result.totalValue || 0).toFixed(2)} ღირებულება`,
          "success"
        );

        setIsStockSnapshotModalOpen(false);
        setSelectedProducts(new Set());
        setSnapshotDate("");
      } else {
        showToast("ექსპორტის შეცდომა", "error");
      }
    } catch (error) {
      console.error("Stock snapshot export error:", error);
      showToast("ექსპორტის შეცდომა", "error");
    }
  };

  const handleTurnoverReport = () => {
    try {
      if (!turnoverDateRange.startDate || !turnoverDateRange.endDate) {
        showToast("გთხოვთ მიუთითოთ პერიოდი", "error");
        return;
      }

      const startDate = new Date(turnoverDateRange.startDate);
      const endDate = new Date(turnoverDateRange.endDate);

      if (startDate > endDate) {
        showToast("საწყისი თარიღი უნდა იყოს ვიდრე საბოლოო თარიღი", "error");
        return;
      }

      const result = exportTurnoverToExcel(products, selectedProducts, startDate, endDate);

      if (result.success) {
        showToast(
          `ბრუნვითი უწყისი წარმატებით გენერირდა!\n${result.exportedProducts} პროდუქტი\nსაწყისი ნაშთი: ${result.totalOpeningQuantity} ცალი\nმიღება: ${result.totalQuantityIn} ცალი\nგაყიდვა: -${result.totalQuantityOut} ცალი\nშეკვეთებიდან დაბრუნება: +${result.totalQuantityOrderReturn} ცალი\nგადატანა მაღაზიაში: ${result.totalQuantityStoreTransfer} ცალი\nკორექცია: ${result.totalQuantityCorrection} ცალი\nსხვაობა: ${result.totalDifference} ცალი\nმარაგის ნაშთი: ${result.totalClosingQuantity} ცალი`,
          "success"
        );

        setIsTurnoverModalOpen(false);
        setSelectedProducts(new Set());
        setTurnoverDateRange({ startDate: "", endDate: "" });
      } else {
        showToast(typeof result.error === 'string' ? result.error : "ბრუნვითი ანგარიშის შეცდომა", "error");
      }
    } catch (error) {
      console.error("Turnover report error:", error);
      showToast("ბრუნვითი ანგარიშის შეცდომა", "error");
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const needle = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        (product.productCode || "").toLowerCase().includes(needle) ||
        product.id.toLowerCase().includes(needle);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesVisibility =
        visibilityFilter === "all" || (visibilityFilter === "hidden" ? product.isActive === false : product.isActive !== false);
      return matchesSearch && matchesCategory && matchesVisibility;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock":
          { const aStock = a.hasVariants
            ? a.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
            : a.stock || 0;
          const bStock = b.hasVariants
            ? b.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
            : b.stock || 0;
          return bStock - aStock; }
        case "price":
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });

  // Summary calculations
  const totalProducts = filteredProducts.length;
  const totalStock = filteredProducts.reduce((sum, product) => {
    if (product.hasVariants) {
      return sum + (product.variants?.reduce((varSum, v) => varSum + (v.stock || 0), 0) || 0);
    }
    return sum + (product.stock || 0);
  }, 0);

  const lowStockProducts = filteredProducts.filter((product) => {
    const stock = product.hasVariants
      ? product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
      : product.stock || 0;
    return stock <= 5 && stock > 0;
  }).length;

  const outOfStockProducts = filteredProducts.filter((product) => {
    const stock = product.hasVariants
      ? product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
      : product.stock || 0;
    return stock === 0;
  }).length;

  const variantProductsCount = filteredProducts.filter(p => p.hasVariants).length;

  // Calculate total inventory value
  const totalInventoryValue = filteredProducts.reduce((sum, product) => {
    if (product.hasVariants && product.variants) {
      return sum + product.variants.reduce((varSum, variant) =>
        varSum + (variant.price * (variant.stock || 0)), 0);
    }
    return sum + ((product.price || 0) * (product.stock || 0));
  }, 0);

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-600 flex-shrink-0" />
            <span className="truncate">საწყობი</span>
          </h1>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <button
              onClick={() => setIsStockSnapshotModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">მარაგის ნაშთი</span>
              <span className="sm:hidden">ნაშთი</span>
            </button>
            <button
              onClick={() => setIsTurnoverModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-md sm:rounded-lg hover:bg-emerald-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ბრუნვითი უწყისი</span>
              <span className="sm:hidden">უწყისი</span>
            </button>
          </div>
        </div>

        {/* Summary Cards - Mobile: 2x3, Desktop: 1x5 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4">
          <div className="bg-blue-50 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border border-blue-200">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-600">{totalProducts}</p>
            <p className="text-xs text-blue-700 leading-tight truncate">პროდუქტი</p>
          </div>
          <div className="bg-emerald-50 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border border-emerald-200">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-emerald-600">{totalStock}</p>
            <p className="text-xs text-emerald-700 leading-tight truncate">ჯამური მარაგი</p>
          </div>
          <div className="bg-purple-50 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border border-purple-200">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-purple-600">₾{totalInventoryValue.toFixed(0)}</p>
            <p className="text-xs text-purple-700 leading-tight truncate">ღირებულება</p>
          </div>
          <div className="bg-yellow-50 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border border-yellow-200">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
            <p className="text-xs text-yellow-700 leading-tight truncate">დაბალი მარაგი</p>
          </div>
          <div className="bg-red-50 p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border border-red-200 lg:col-span-1 col-span-2">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-red-600">{outOfStockProducts}</p>
            <p className="text-xs text-red-700 leading-tight truncate">ამოიწურა</p>
          </div>
        </div>

        {/* Search & Filters - Stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
            <input
              type="search"
              placeholder="სახელი ან კოდი..."
              aria-label="პროდუქტის ძებნა"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 sm:pl-8 md:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="კატეგორია"
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="all">ყველა კატეგორია</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as "all" | "active" | "hidden")}
            aria-label="საიტზე"
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="all">ყველა</option>
            <option value="active">საიტზე ჩანს</option>
            <option value="hidden">დამალული</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-w-[100px] sm:min-w-[120px]"
          >
            <option value="name">სახელით</option>
            <option value="stock">მარაგით</option>
            <option value="price">ფასით</option>
          </select>
        </div>
      </div>

      {/* Products - Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">მონაცემების ჩატვირთვა...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">პროდუქტები არ მოიძებნა</h3>
            <p className="text-gray-600">შეცვალეთ ძიების კრიტერიუმები</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-full"
                      >
                        {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      პროდუქტი
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      კატეგორია
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      ფასი
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      მარაგი
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      საიტზე
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      canEdit={canEdit}
                      product={product}
                      isSelected={selectedProducts.has(product.id)}
                      isToggling={togglingId === product.id}
                      onSelectProduct={handleSelectProduct}
                      onToggleActive={handleToggleActive}
                      onEdit={(item) => setEditingId(item.id)}
                      onCorrect={(item) => setCorrectingId(item.id)}
                      onShowReceipts={onShowReceipts ? (item) => onShowReceipts(item.id) : undefined}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="md:hidden space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  canEdit={canEdit}
                  product={product}
                  isSelected={selectedProducts.has(product.id)}
                  isToggling={togglingId === product.id}
                  onSelectProduct={handleSelectProduct}
                  onToggleActive={handleToggleActive}
                  onEdit={(item) => setEditingId(item.id)}
                  onCorrect={(item) => setCorrectingId(item.id)}
                      onShowReceipts={onShowReceipts ? (item) => onShowReceipts(item.id) : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {canEdit && correctingProduct && (
        <CorrectionModal product={correctingProduct} onClose={() => setCorrectingId(null)} />
      )}

      {canEdit && editingProduct && (
        <EditProductModalVariants
          isOpen={true}
          product={editingProduct}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Stock Snapshot Modal */}
      {isStockSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                მარაგის ნაშთი
              </h3>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">შერჩეული პროდუქტები:</p>
                  <p className="font-medium text-gray-900">
                    {selectedProducts.size === 0
                      ? `ყველა (${filteredProducts.length} პროდუქტი)`
                      : `${selectedProducts.size} პროდუქტი`
                    }
                  </p>
                </div>

                {/* Single Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    თარიღი (არასავალდებულო)
                  </label>
                  <input
                    type="date"
                    value={snapshotDate}
                    onChange={(e) => setSnapshotDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {snapshotDate ? `რა ნაშთი იყო ${new Date(snapshotDate).toLocaleDateString("ka-GE")} დღის ბოლოს (23:59)` : "დატოვეთ ცარიელი მიმდინარე ნაშთისთვის"}
                  </p>
                </div>

                {/* Export Summary */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">შედეგი შეიცავს:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• პროდუქტების ზუსტი ნაშთები კონკრეტულ მომენტში</li>
                    <li>• ვარიანტების ინფორმაცია</li>
                    <li>• ღირებულება ფასების მიხედვით</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockSnapshotModalOpen(false);
                    setSelectedProducts(new Set());
                    setSnapshotDate("");
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  onClick={handleStockSnapshot}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  ნაშთის ექსპორტი
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Turnover Report Modal */}
      {isTurnoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                სასაწყობო ბრუნვითი უწყისი
              </h3>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">შერჩეული პროდუქტები:</p>
                  <p className="font-medium text-gray-900">
                    {selectedProducts.size === 0
                      ? `ყველა (${filteredProducts.length} პროდუქტი)`
                      : `${selectedProducts.size} პროდუქტი`
                    }
                  </p>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    ანგარიშის პერიოდი
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">საწყისი თარიღი</label>
                      <input
                        type="date"
                        value={turnoverDateRange.startDate}
                        onChange={(e) => setTurnoverDateRange(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">საბოლოო თარიღი</label>
                      <input
                        type="date"
                        value={turnoverDateRange.endDate}
                        onChange={(e) => setTurnoverDateRange(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    მიუთითეთ პერიოდი სასაწყობო ბრუნვითი უწყისისთვის
                  </p>
                </div>

                {/* Report Summary */}
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-2">უწყისი შეიცავს:</h4>
                  <ul className="text-xs text-emerald-700 space-y-1">
                    <li>• კოდი და დასახელება</li>
                    <li>• საწყისი რაოდენობრივი ნაშთი</li>
                    <li>• მიღებული რაოდენობა</li>
                    <li>• გაყიდული რაოდენობა</li>
                    <li>• გადატანა მაღაზიაში (გატანა − დაბრუნება)</li>
                    <li>• ბრუნვის სხვაობა</li>
                    <li>• მარაგის ნაშთი</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsTurnoverModalOpen(false);
                    setSelectedProducts(new Set());
                    setTurnoverDateRange({ startDate: "", endDate: "" });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  onClick={handleTurnoverReport}
                  disabled={!turnoverDateRange.startDate || !turnoverDateRange.endDate}
                  className="flex-1 px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  უწყისის გენერირება
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagerVariants;
