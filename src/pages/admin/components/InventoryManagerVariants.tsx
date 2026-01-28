import React, { useState, useEffect } from "react";
import { useProductStore } from "../../../store/productStore";
import { showToast } from "../../../components/ui/Toast";
import type { Product, ProductVariant } from "../../../types";
import { exportInventoryToExcel, exportTurnoverToExcel } from "../../../utils/excelExporter";

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
  Download,
  Calendar,
  CheckSquare,
  Square,
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

    if (adjustmentType === "remove" && quantity > (variant.stock || 0)) {
      showToast("არ შეიძლება მეტის წაშლა ვიდრე არსებობს", "error");
      return;
    }

    try {
      setIsLoading(true);

      const currentStock = variant.stock || 0;
      const newStock =
        adjustmentType === "add" ? currentStock + quantity : currentStock - quantity;

      await updateVariantStock(productId, variant.id, newStock, reason);

      showToast(
        `${variant.name} - მარაგი განახლდა: ${newStock} ცალი`,
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
  const currentStock = variant.stock || 0;
  const newStock = isAdd ? currentStock + quantity : currentStock - quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isAdd ? "მარაგის დამატება" : "მარაგის შემცირება"}
          </h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{productName}</p>
            <p className="text-sm text-gray-600">ვარიანტი: {variant.name}</p>
            <p className="text-sm text-gray-600">
              მიმდინარე მარაგი: <span className="font-bold">{currentStock} ცალი</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                რაოდენობა
              </label>
              <input
                type="number"
                min="1"
                max={adjustmentType === "remove" ? currentStock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                მიზეზი
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="მიზეზის აღწერა..."
                required
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                ახალი მარაგი: <span className="font-bold text-blue-600">{newStock} ცალი</span>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  isAdd
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {isLoading ? "მუშავდება..." : isAdd ? "დამატება" : "შემცირება"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isAdd ? "მარაგის დამატება" : "მარაგის შემცირება"}
          </h3>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{productName}</p>
            <p className="text-sm text-gray-600">
              მიმდინარე მარაგი: <span className="font-bold">{currentStock} ცალი</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                რაოდენობა
              </label>
              <input
                type="number"
                min="1"
                max={adjustmentType === "remove" ? currentStock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                მიზეზი
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="მიზეზის აღწერა..."
                required
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                ახალი მარაგი: <span className="font-bold text-blue-600">{newStock} ცალი</span>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  isAdd
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {isLoading ? "მუშავდება..." : isAdd ? "დამატება" : "შემცირება"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ProductRow Component
interface ProductRowProps {
  product: Product;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelectProduct: (productId: string) => void;
  onStockAdjustment: (
    productId: string,
    productName: string,
    currentStock: number,
    adjustmentType: "add" | "remove"
  ) => void;
  onVariantStockAdjustment: (
    productId: string,
    productName: string,
    variant: ProductVariant,
    adjustmentType: "add" | "remove"
  ) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelectProduct,
  onStockAdjustment,
  onVariantStockAdjustment,
}) => {
  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock <= 5) return "bg-yellow-100 text-yellow-800";
    if (stock <= 10) return "bg-blue-100 text-blue-800";
    return "text-emerald-600 bg-emerald-50";
  };

  const getDisplayStock = () => {
    if (product.hasVariants && product.variants) {
      return product.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
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
      <tr className={`border-b border-gray-200 hover:bg-gray-50/30 transition-colors ${!product.isActive ? 'opacity-60 bg-gray-50/50' : ''}`}>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => onSelectProduct(product.id)}
            className="flex items-center justify-center w-full"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-xs text-gray-500 truncate">ID: {product.id}</p>
              {product.hasVariants && (
                <p className="text-xs text-blue-600 font-medium">
                  {product.variants?.length || 0} ვარიანტი
                </p>
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              product.hasVariants ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {product.hasVariants ? "ვარიანტებით" : "მარტივი"}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              product.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {product.isActive ? "აქტიური" : "არააქტიური"}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center space-y-0.5">
            {!product.hasVariants && product.salePrice && product.salePrice < (product.price || 0) ? (
              <>
                <span className="text-xs text-orange-600 font-semibold line-through decoration-orange-400">
                  ₾{(product.price || 0).toFixed(2)}
                </span>
                <span className="text-sm font-medium text-emerald-600">₾{product.salePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-900">{getDisplayPrice()}</span>
            )}
          </div>
        </td>

        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${getStockStatusColor(
              getDisplayStock()
            )}`}
          >
            {getDisplayStock()} ცალი
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          {product.hasVariants ? (
            <button
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {isExpanded ? "ვარიანტების დამალვა" : "ვარიანტების ნახვა"}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() =>
                  onStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "remove"
                  )
                }
                disabled={!product.stock || product.stock <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                title="მარაგის შემცირება"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="mx-1 text-sm font-medium text-gray-700 min-w-[45px] text-center">
                {product.stock || 0}
              </span>
              <button
                onClick={() =>
                  onStockAdjustment(
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
        </td>
      </tr>

      {/* Mobile-First Responsive Variants Layout */}
      {product.hasVariants && isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="bg-blue-50/20 border-l-4 border-blue-200">
              <div className="p-4">
                {/* Header - Compact on mobile */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-600" />
                    ვარიანტები ({product.variants?.length || 0})
                  </h4>
                  <div className="text-xs text-gray-500">
                    ჯამი: {product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0} ცალი
                  </div>
                </div>

                {/* Responsive Grid - Mobile: 1 col, Tablet: 2 col, Desktop: 3+ col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {product.variants?.map((variant) => (
                    <div
                      key={variant.id}
                      className={`p-3 rounded-lg border ${
                        variant.isActive
                          ? 'bg-white border-blue-200'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}
                    >
                      {/* Variant Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-sm text-gray-900 truncate">
                              {variant.name}
                            </h5>
                            <div className="mt-1 space-y-0.5">
                              {variant.salePrice && variant.salePrice < variant.price ? (
                                <>
                                  <p className="text-xs text-orange-600 font-semibold line-through decoration-orange-400">
                                    ₾{variant.price.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-emerald-600 font-medium">
                                    ₾{variant.salePrice.toFixed(2)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-900 font-medium">
                                  ₾{variant.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              variant.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {variant.isActive ? 'აქტ' : 'არააქტ'}
                          </span>
                        </div>

                        {/* Stock & Controls */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStockStatusColor(
                              variant.stock || 0
                            )}`}
                          >
                            {variant.stock || 0} ცალი
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                onVariantStockAdjustment(product.id, product.name, variant, "remove")
                              }
                              disabled={!variant.stock || variant.stock <= 0}
                              className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="მარაგის შემცირება"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                onVariantStockAdjustment(product.id, product.name, variant, "add")
                              }
                              className="w-7 h-7 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                              title="მარაგის დამატება"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ProductCard Component (Mobile-friendly)
interface ProductCardProps {
  product: Product;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelectProduct: (productId: string) => void;
  onStockAdjustment: (
    productId: string,
    productName: string,
    currentStock: number,
    adjustmentType: "add" | "remove"
  ) => void;
  onVariantStockAdjustment: (
    productId: string,
    productName: string,
    variant: ProductVariant,
    adjustmentType: "add" | "remove"
  ) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelectProduct,
  onStockAdjustment,
  onVariantStockAdjustment,
}) => {
  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock <= 5) return "bg-yellow-100 text-yellow-800";
    if (stock <= 10) return "bg-blue-100 text-blue-800";
    return "text-emerald-600 bg-emerald-50";
  };

  const getDisplayStock = () => {
    if (product.hasVariants && product.variants) {
      return product.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
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
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${!product.isActive ? 'opacity-60 bg-gray-50/50' : ''}`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Selection Checkbox */}
          <button
            onClick={() => onSelectProduct(product.id)}
            className="flex items-center justify-center mt-1"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {/* Product Image */}
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mb-2">ID: {product.id}</p>

            {/* Type & Category */}
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.hasVariants ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {product.hasVariants ? "ვარიანტებით" : "მარტივი"}
              </span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  product.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {product.isActive ? "აქტიური" : "არააქტიური"}
              </span>
              {product.hasVariants && (
                <span className="text-xs text-blue-600 font-medium">
                  {product.variants?.length || 0} ვარიანტი
                </span>
              )}
            </div>

            {/* Price & Stock Row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                {!product.hasVariants && product.salePrice && product.salePrice < (product.price || 0) ? (
                  <>
                    <p className="text-xs text-orange-600 font-semibold line-through decoration-orange-400">
                      ₾{(product.price || 0).toFixed(2)}
                    </p>
                    <p className="text-sm font-semibold text-emerald-600">₾{product.salePrice.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{getDisplayPrice()}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStockStatusColor(
                    getDisplayStock()
                  )}`}
                >
                  {getDisplayStock()} ცალი
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {product.hasVariants ? (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 justify-center"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  ვარიანტების დამალვა
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  ვარიანტების ნახვა
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={() =>
                  onStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "remove"
                  )
                }
                disabled={!product.stock || product.stock <= 0}
                className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
                შემცირება
              </button>

              <div className="px-3 py-2 bg-gray-50 rounded-lg border">
                <span className="text-sm font-bold text-gray-900">
                  {product.stock || 0}
                </span>
              </div>

              <button
                onClick={() =>
                  onStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "add"
                  )
                }
                className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                დამატება
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Variants Section */}
      {product.hasVariants && isExpanded && (
        <div className="border-t border-gray-100 bg-blue-50/20">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                ვარიანტები
              </h4>
              <div className="text-xs text-gray-500">
                ჯამი: {product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0} ცალი
              </div>
            </div>

            {/* Single Column Variant List for Mobile */}
            <div className="space-y-3">
              {product.variants?.map((variant) => (
                <div
                  key={variant.id}
                  className={`p-3 rounded-lg border ${
                    variant.isActive
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  {/* Variant Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm text-gray-900 mb-1">
                        {variant.name}
                      </h5>
                      <div className="space-y-0.5">
                        {variant.salePrice && variant.salePrice < variant.price ? (
                          <>
                            <p className="text-xs text-orange-600 font-semibold line-through decoration-orange-400">
                              ₾{variant.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-emerald-600 font-medium">
                              ₾{variant.salePrice.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-900 font-medium">
                            ₾{variant.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          variant.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {variant.isActive ? 'აქტ' : 'არააქტ'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStockStatusColor(
                          variant.stock || 0
                        )}`}
                      >
                        {variant.stock || 0} ცალი
                      </span>
                    </div>
                  </div>

                  {/* Variant Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onVariantStockAdjustment(product.id, product.name, variant, "remove")
                      }
                      disabled={!variant.stock || variant.stock <= 0}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                      <Minus className="w-3 h-3" />
                      შემცირება
                    </button>

                    <button
                      onClick={() =>
                        onVariantStockAdjustment(product.id, product.name, variant, "add")
                      }
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100 text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      დამატება
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const InventoryManagerVariants: React.FC = () => {
  const { products, isLoading, fetchProducts } = useProductStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    currentStock: number;
    adjustmentType: "add" | "remove";
  } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{
    productId: string;
    productName: string;
    variant: ProductVariant;
    adjustmentType: "add" | "remove";
  } | null>(null);

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

  const toggleProductExpand = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleStockAdjustment = (
    productId: string,
    productName: string,
    currentStock: number,
    adjustmentType: "add" | "remove"
  ) => {
    setSelectedProduct({ id: productId, name: productName, currentStock, adjustmentType });
  };

  const handleVariantStockAdjustment = (
    productId: string,
    productName: string,
    variant: ProductVariant,
    adjustmentType: "add" | "remove"
  ) => {
    setSelectedVariant({ productId, productName, variant, adjustmentType });
  };

  const closeModals = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
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
        showToast("საწყისი თარიღი უნდა იყოს უფრო ადრინდელი საბოლოოზე", "error");
        return;
      }

      const result = exportTurnoverToExcel(products, selectedProducts, startDate, endDate);

      if (result.success) {
        showToast(
          `ბრუნვითი ანგარიში წარმატებით გენერირდა!\n${result.exportedProducts} პროდუქტი\nსაწყისი: ${result.totalInitialStock} ცალი (₾${result.totalInitialValue?.toFixed(2)})\nშემოსული: +${result.totalIncoming} ცალი\nგასული: -${result.totalOutgoing} ცალი\nსაბოლოო: ${result.totalFinalStock} ცალი (₾${result.totalFinalValue?.toFixed(2)})`,
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
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            საწყობი (მარაგის მართვა)
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStockSnapshotModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              მარაგის ნაშთი
            </button>
            <button
              onClick={() => setIsTurnoverModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              <Calendar className="w-4 h-4" />
              ბრუნვითი ანგარიში
            </button>
          </div>
        </div>

        {/* Summary Cards - Mobile: 2x3, Desktop: 1x5 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
            <p className="text-xs text-blue-700">პროდუქტი</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <p className="text-2xl font-bold text-emerald-600">{totalStock}</p>
            <p className="text-xs text-emerald-700">ჯამური მარაგი</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xl font-bold text-purple-600">₾{totalInventoryValue.toFixed(2)}</p>
            <p className="text-xs text-purple-700">ღირებულება</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
            <p className="text-xs text-yellow-700">დაბალი მარაგი</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
            <p className="text-xs text-red-700">ამოიწურა</p>
          </div>
        </div>

        {/* Search & Filters - Stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="პროდუქტის ძებნა..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
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
                      სტატუსი
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      ფასი
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      მარაგი
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
                      product={product}
                      isExpanded={expandedProducts.has(product.id)}
                      isSelected={selectedProducts.has(product.id)}
                      onToggleExpand={() => toggleProductExpand(product.id)}
                      onSelectProduct={handleSelectProduct}
                      onStockAdjustment={handleStockAdjustment}
                      onVariantStockAdjustment={handleVariantStockAdjustment}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="md:hidden space-y-3 p-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isExpanded={expandedProducts.has(product.id)}
                  isSelected={selectedProducts.has(product.id)}
                  onToggleExpand={() => toggleProductExpand(product.id)}
                  onSelectProduct={handleSelectProduct}
                  onStockAdjustment={handleStockAdjustment}
                  onVariantStockAdjustment={handleVariantStockAdjustment}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedProduct && (
        <SimpleStockModal
          isOpen={true}
          onClose={closeModals}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          currentStock={selectedProduct.currentStock}
          adjustmentType={selectedProduct.adjustmentType}
          onStockUpdated={() => {
            fetchProducts();
            closeModals();
          }}
        />
      )}

      {selectedVariant && (
        <VariantStockModal
          isOpen={true}
          onClose={closeModals}
          productId={selectedVariant.productId}
          productName={selectedVariant.productName}
          variant={selectedVariant.variant}
          adjustmentType={selectedVariant.adjustmentType}
          onStockUpdated={() => {
            fetchProducts();
            closeModals();
          }}
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
                ბრუნვითი ანგარიში
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
                    მიუთითეთ პერიოდი, რომლის ბრუნვის ანალიზიც გნებავთ
                  </p>
                </div>

                {/* Report Summary */}
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-2">ანგარიში შეიცავს:</h4>
                  <ul className="text-xs text-emerald-700 space-y-1">
                    <li>• საწყისი ნაშთი (პერიოდის დაწყებამდე)</li>
                    <li>• შემოსული პროდუქციის რაოდენობა</li>
                    <li>• გასული პროდუქციის რაოდენობა</li>
                    <li>• საბოლოო ნაშთი (გათვლილი)</li>
                    <li>• ბრუნვის ანალიზი ღირებულებებით</li>
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
                  ანგარიშის გენერირება
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