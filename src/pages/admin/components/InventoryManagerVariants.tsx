import React, { useState, useEffect } from "react";
import { useProductStore } from "../../../store/productStore";
import { showToast } from "../../../components/ui/Toast";
import type { Product, ProductVariant } from "../../../types";
import {
  Plus,
  Minus,
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Box,
} from "lucide-react";

interface VariantStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variant: ProductVariant;
  adjustmentType: "add" | "remove";
  onStockUpdated: () => void;
}

const VariantStockModal: React.FC<VariantStockModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  variant,
  adjustmentType,
  onStockUpdated,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updateVariantStock } = useProductStore();

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason(adjustmentType === "add" ? "შევსება" : "დაზიანება/დანაკარგი");
    }
  }, [isOpen, adjustmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      showToast("რაოდენობა უნდა იყოს დადებითი რიცხვი", "error");
      return;
    }

    if (adjustmentType === "remove" && quantity > variant.stock) {
      showToast("არ შეიძლება მეტის წაშლა ვიდრე არსებობს", "error");
      return;
    }

    try {
      setIsLoading(true);

      const newStock =
        adjustmentType === "add"
          ? variant.stock + quantity
          : variant.stock - quantity;

      await updateVariantStock(productId, variant.id, newStock, reason);

      showToast(
        `${productName} (${variant.name}) - მარაგი განახლდა: ${newStock} ცალი`,
        "success"
      );

      onStockUpdated();
      onClose();
    } catch (error) {
      console.error("Variant stock update error:", error);
      showToast("მარაგის განახლება ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAdd = adjustmentType === "add";
  const newStock = isAdd ? variant.stock + quantity : variant.stock - quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {isAdd ? (
              <Plus className="w-5 h-5 text-emerald-600" />
            ) : (
              <Minus className="w-5 h-5 text-red-600" />
            )}
            {isAdd ? "მარაგის დამატება" : "მარაგის წაშლა"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{productName}</p>
          <p className="text-xs text-blue-600 font-medium">{variant.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              რაოდენობა
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              მიზეზი
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={isAdd ? "მაგ: ახალი მოწოდება" : "მაგ: დაზიანებული"}
              required
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">მიმდინარე მარაგი</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{variant.stock}</div>
                <div className="text-xs text-gray-500">ცალი</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">ახალი მარაგი</div>
                <div className={`text-2xl font-bold mt-1 ${
                  newStock >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {newStock}
                </div>
                <div className="text-xs text-gray-500">ცალი</div>
              </div>
            </div>
            {isAdd && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-700">
                <Plus className="w-4 h-4" />
                <span>+{quantity} ცალი ემატება</span>
              </div>
            )}
            {!isAdd && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-700">
                <Minus className="w-4 h-4" />
                <span>-{quantity} ცალი აკლდება</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                isAdd
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "შენახვა..." : "შენახვა"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ExpandableProductRowProps {
  product: Product;
  onVariantStockAdjustment: (
    productId: string,
    productName: string,
    variant: ProductVariant,
    adjustmentType: "add" | "remove"
  ) => void;
  onSimpleStockAdjustment: (
    productId: string,
    productName: string,
    currentStock: number,
    adjustmentType: "add" | "remove"
  ) => void;
}

const ExpandableProductRow: React.FC<ExpandableProductRowProps> = ({
  product,
  onVariantStockAdjustment,
  onSimpleStockAdjustment,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return "text-red-600 bg-red-50";
    if (stock <= 3) return "text-orange-600 bg-orange-50";
    if (stock <= 10) return "text-yellow-600 bg-yellow-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const getDisplayStock = () => {
    if (product.hasVariants && product.variants) {
      // Calculate real-time total stock from all active variants
      return product.variants
        .filter((variant) => variant.isActive)
        .reduce((total, variant) => total + (variant.stock || 0), 0);
    }
    return product.stock || 0;
  };

  const getDisplayPrice = () => {
    if (product.hasVariants) {
      if (product.minPrice === product.maxPrice) {
        return `₾${product.minPrice?.toFixed(2) || "0.00"}`;
      }
      return `₾${product.minPrice?.toFixed(2) || "0.00"} - ₾${
        product.maxPrice?.toFixed(2) || "0.00"
      }`;
    }
    return `₾${product.price?.toFixed(2) || "0.00"}`;
  };

  return (
    <>
      {/* Main Product Row */}
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Button */}
            {product.hasVariants && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 hover:scale-105"
                title={isExpanded ? "ვარიანტების დამალვა" : "ვარიანტების ნახვა"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-blue-700" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-700" />
                )}
              </button>
            )}
            {!product.hasVariants && (
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-50 border border-gray-200">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
            )}

            {/* Product Image */}
            <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-full h-full p-1.5 text-gray-400" />
              )}
            </div>

            {/* Product Name */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500 truncate">
                  ID: {product.id.slice(-6)}
                </p>
                {product.hasVariants && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.variants?.length || 0} ვარიანტი
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {product.category}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${getStockStatusColor(
                getDisplayStock()
              )}`}
            >
              {getDisplayStock()} ცალი
            </span>
            <span className="text-xs text-gray-500">{getDisplayPrice()}</span>
          </div>
        </td>

        <td className="px-4 py-3 text-center">
          {!product.hasVariants && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() =>
                  onSimpleStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "remove"
                  )
                }
                disabled={(product.stock || 0) <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                title="მარაგის წაშლა"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="mx-2 text-sm font-medium text-gray-600 min-w-[50px]">
                {product.stock || 0} ცალი
              </span>
              <button
                onClick={() =>
                  onSimpleStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "add"
                  )
                }
                className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:scale-105"
                title="მარაგის დამატება"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          {product.hasVariants && (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.variants?.length || 0} ვარიანტი
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                {isExpanded ? "ვარიანტების დამალვა" : "ვარიანტების ნახვა"}
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded Variant Rows */}
      {product.hasVariants &&
        isExpanded &&
        (() => {
          console.log(`[DEBUG] პროდუქტი: ${product.name}, ვარიანტების რაოდენობა: ${product.variants?.length || 0}`, product.variants?.map(v => ({ name: v.name, isActive: v.isActive, stock: v.stock })));
          return product.variants?.map((variant) => (
          <tr
            key={variant.id}
            className={`border-b border-blue-100 ${
              variant.isActive
                ? 'bg-blue-50/30 hover:bg-blue-50/50'
                : 'bg-gray-100/50 hover:bg-gray-100/70 opacity-70'
            }`}
          >
            <td className="px-4 py-2 pl-12">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {variant.name}
                    {!variant.isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        არააქტიური
                      </span>
                    )}
                    {variant.isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        აქტიური
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₾{variant.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </td>

            <td className="px-4 py-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ვარიანტი
              </span>
            </td>

            <td className="px-4 py-2 text-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-bold ${getStockStatusColor(
                  variant.stock
                )}`}
              >
                {variant.stock} ცალი
              </span>
            </td>

            <td className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() =>
                    onVariantStockAdjustment(
                      product.id,
                      product.name,
                      variant,
                      "remove"
                    )
                  }
                  disabled={variant.stock <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                  title="ვარიანტის მარაგის წაშლა"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="mx-1 text-sm font-medium text-gray-700 min-w-[45px] text-center">
                  {variant.stock}
                </span>
                <button
                  onClick={() =>
                    onVariantStockAdjustment(
                      product.id,
                      product.name,
                      variant,
                      "add"
                    )
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:scale-105"
                  title="ვარიანტის მარაგის დამატება"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </td>
          </tr>
        ));
        })()}
    </>
  );
};

// Simple Stock Modal (for non-variant products)
interface SimpleStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  adjustmentType: "add" | "remove";
  onStockUpdated: () => void;
}

const SimpleStockModal: React.FC<SimpleStockModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentStock,
  adjustmentType,
  onStockUpdated,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updateStock } = useProductStore();

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason(adjustmentType === "add" ? "შევსება" : "დაზიანება/დანაკარგი");
    }
  }, [isOpen, adjustmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      showToast("რაოდენობა უნდა იყოს დადებითი რიცხვი", "error");
      return;
    }

    if (adjustmentType === "remove" && quantity > currentStock) {
      showToast("არ შეიძლება მეტის წაშლა ვიდრე არსებობს", "error");
      return;
    }

    try {
      setIsLoading(true);

      const newStock =
        adjustmentType === "add"
          ? currentStock + quantity
          : currentStock - quantity;

      await updateStock(productId, newStock, reason);

      showToast(
        `${productName} - მარაგი განახლდა: ${newStock} ცალი`,
        "success"
      );

      onStockUpdated();
      onClose();
    } catch (error) {
      console.error("Stock update error:", error);
      showToast("მარაგის განახლება ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAdd = adjustmentType === "add";
  const newStock = isAdd ? currentStock + quantity : currentStock - quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {isAdd ? (
              <Plus className="w-5 h-5 text-emerald-600" />
            ) : (
              <Minus className="w-5 h-5 text-red-600" />
            )}
            {isAdd ? "მარაგის დამატება" : "მარაგის წაშლა"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{productName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              რაოდენობა
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              მიზეზი
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={isAdd ? "მაგ: ახალი მოწოდება" : "მაგ: დაზიანებული"}
              required
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">მიმდინარე მარაგი</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{currentStock}</div>
                <div className="text-xs text-gray-500">ცალი</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">ახალი მარაგი</div>
                <div className={`text-2xl font-bold mt-1 ${
                  newStock >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {newStock}
                </div>
                <div className="text-xs text-gray-500">ცალი</div>
              </div>
            </div>
            {isAdd && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-700">
                <Plus className="w-4 h-4" />
                <span>+{quantity} ცალი ემატება</span>
              </div>
            )}
            {!isAdd && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-700">
                <Minus className="w-4 h-4" />
                <span>-{quantity} ცალი იხსნება</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                isAdd
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "შენახვა..." : "შენახვა"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryManagerVariants: React.FC = () => {
  const { products, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modal states
  const [variantModalState, setVariantModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    variant: ProductVariant | null;
    adjustmentType: "add" | "remove";
  }>({
    isOpen: false,
    productId: "",
    productName: "",
    variant: null,
    adjustmentType: "add",
  });

  const [simpleModalState, setSimpleModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    currentStock: number;
    adjustmentType: "add" | "remove";
  }>({
    isOpen: false,
    productId: "",
    productName: "",
    currentStock: 0,
    adjustmentType: "add",
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category))];

  // Professional warehouse statistics
  const warehouseStats = {
    totalProducts: filteredProducts.length,
    lowStockCount: filteredProducts.filter(p => {
      const stock = p.hasVariants && p.variants
        ? p.variants.filter(v => v.isActive).reduce((sum, v) => sum + (v.stock || 0), 0)
        : p.stock || 0;
      return stock <= 3 && stock > 0;
    }).length,
    outOfStockCount: filteredProducts.filter(p => {
      const stock = p.hasVariants && p.variants
        ? p.variants.filter(v => v.isActive).reduce((sum, v) => sum + (v.stock || 0), 0)
        : p.stock || 0;
      return stock <= 0;
    }).length,
    totalUnits: filteredProducts.reduce((sum, p) => {
      const stock = p.hasVariants && p.variants
        ? p.variants.filter(v => v.isActive).reduce((sum, v) => sum + (v.stock || 0), 0)
        : p.stock || 0;
      return sum + stock;
    }, 0),
    variantProductsCount: filteredProducts.filter(p => p.hasVariants).length,
  };

  const handleVariantStockAdjustment = (
    productId: string,
    productName: string,
    variant: ProductVariant,
    adjustmentType: "add" | "remove"
  ) => {
    setVariantModalState({
      isOpen: true,
      productId,
      productName,
      variant,
      adjustmentType,
    });
  };

  const handleSimpleStockAdjustment = (
    productId: string,
    productName: string,
    currentStock: number,
    adjustmentType: "add" | "remove"
  ) => {
    setSimpleModalState({
      isOpen: true,
      productId,
      productName,
      currentStock,
      adjustmentType,
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchProducts();
      showToast("მარაგი განახლდა", "success");
    } catch (error) {
      showToast("განახლება ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              საწყობი (მარაგის მართვა)
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              პროდუქტების და ვარიანტების მარაგის ოპერატიული მართვა
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            განახლება
          </button>
        </div>

        {/* Professional Warehouse Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{warehouseStats.totalProducts}</div>
            <div className="text-xs text-blue-600 font-medium">პროდუქტი</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700">{warehouseStats.totalUnits}</div>
            <div className="text-xs text-emerald-600 font-medium">ერთეული</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{warehouseStats.lowStockCount}</div>
            <div className="text-xs text-orange-600 font-medium">დაბალი მარაგი</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{warehouseStats.outOfStockCount}</div>
            <div className="text-xs text-red-600 font-medium">ამოწურული</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{warehouseStats.variantProductsCount}</div>
            <div className="text-xs text-purple-600 font-medium">ვარიანტებიანი</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="პროდუქტის ძიება..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ყველა კატეგორია</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  პროდუქტი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  კატეგორია
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  მარაგი
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  მოქმედება
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <ExpandableProductRow
                  key={product.id}
                  product={product}
                  onVariantStockAdjustment={handleVariantStockAdjustment}
                  onSimpleStockAdjustment={handleSimpleStockAdjustment}
                />
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>პროდუქტები ვერ მოიძებნა</p>
            </div>
          )}
        </div>
      </div>

      {/* Variant Stock Adjustment Modal */}
      {variantModalState.variant && (
        <VariantStockModal
          isOpen={variantModalState.isOpen}
          onClose={() =>
            setVariantModalState((prev) => ({ ...prev, isOpen: false }))
          }
          productId={variantModalState.productId}
          productName={variantModalState.productName}
          variant={variantModalState.variant}
          adjustmentType={variantModalState.adjustmentType}
          onStockUpdated={fetchProducts}
        />
      )}

      {/* Simple Stock Adjustment Modal */}
      <SimpleStockModal
        isOpen={simpleModalState.isOpen}
        onClose={() =>
          setSimpleModalState((prev) => ({ ...prev, isOpen: false }))
        }
        productId={simpleModalState.productId}
        productName={simpleModalState.productName}
        currentStock={simpleModalState.currentStock}
        adjustmentType={simpleModalState.adjustmentType}
        onStockUpdated={fetchProducts}
      />
    </div>
  );
};

export default InventoryManagerVariants;
