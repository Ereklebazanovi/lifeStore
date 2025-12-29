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

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>მიმდინარე მარაგი:</span>
              <span className="font-medium">{variant.stock} ცალი</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>ახალი მარაგი:</span>
              <span
                className={`font-bold ${
                  newStock >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {newStock} ცალი
              </span>
            </div>
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
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
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
            <div className="flex items-center justify-center gap-2">
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
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="წაშლა"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onSimpleStockAdjustment(
                    product.id,
                    product.name,
                    product.stock || 0,
                    "add"
                  )
                }
                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="დამატება"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          {product.hasVariants && (
            <span className="text-xs text-gray-500">
              სულ {product.variants?.length || 0} ვარიანტი
            </span>
          )}
        </td>
      </tr>

      {/* Expanded Variant Rows */}
      {product.hasVariants &&
        isExpanded &&
        product.variants?.map((variant) => (
          <tr
            key={variant.id}
            className="bg-blue-50/30 hover:bg-blue-50/50 border-b border-blue-100"
          >
            <td className="px-4 py-2 pl-12">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {variant.name}
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
              <div className="flex items-center justify-center gap-2">
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
                  className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="წაშლა"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    onVariantStockAdjustment(
                      product.id,
                      product.name,
                      variant,
                      "add"
                    )
                  }
                  className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="დამატება"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
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

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>მიმდინარე მარაგი:</span>
              <span className="font-medium">{currentStock} ცალი</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>ახალი მარაგი:</span>
              <span
                className={`font-bold ${
                  newStock >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {newStock} ცალი
              </span>
            </div>
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
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full h-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
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
