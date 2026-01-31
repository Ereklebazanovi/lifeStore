// src/components/admin/ProductSelectModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Package,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useProductStore } from "../../store/productStore";
import type { Product, ProductVariant, ManualOrderItem } from "../../types";
import { getTotalStock } from "../../utils/stock";

export interface ProductSelection {
  type: "existing" | "manual";
  product?: Product;
  variantId?: string;
  name: string;
  price: number;
  stock?: number;
  weight?: number;
  stockStatus?: "available" | "low" | "out_of_stock";
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (selection: ProductSelection, quantity: number) => void;
  requestedQuantity?: number;
  selectedItems?: ManualOrderItem[];
  currentItemIndex?: number;
}

const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  requestedQuantity = 1,
  selectedItems = [],
  currentItemIndex = -1,
}) => {
  const { products } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(requestedQuantity);

  // Calculate available stock after considering already selected items
  const getAvailableStock = (productId: string, variantId?: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    // Get base stock
    let baseStock = 0;
    if (variantId && product.hasVariants) {
      const variant = product.variants?.find(v => v.id === variantId);
      baseStock = variant?.stock || 0;
    } else {
      baseStock = getTotalStock(product);
    }

    // Calculate already allocated quantity (excluding current item being edited)
    const allocatedQuantity = selectedItems.reduce((total, item, index) => {
      // Skip the current item we're editing
      if (index === currentItemIndex) return total;

      // Only count items that match this product/variant
      if (item.productId === productId) {
        if (variantId) {
          // For variant products, only count if variant matches
          return item.variantId === variantId ? total + item.quantity : total;
        } else {
          // For simple products, count if no variant specified
          return !item.variantId ? total + item.quantity : total;
        }
      }
      return total;
    }, 0);

    return Math.max(0, baseStock - allocatedQuantity);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedProduct(null);
      setSelectedVariant(null);
      setQuantity(requestedQuantity);
    }
  }, [isOpen, requestedQuantity]);

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.variants?.some((v) => v.name?.toLowerCase().includes(searchLower))
    );
  });

  const getStockStatus = (stock: number, quantity: number) => {
    if (stock === 0) return "out_of_stock";
    if (stock < quantity) return "insufficient";
    if (stock <= 5) return "low";
    return "available";
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "low":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "insufficient":
      case "out_of_stock":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(null); // Reset variant selection
      // Reset quantity to 1 when switching products with variants
      setQuantity(1);
    } else {
      // Simple product - reset quantity based on available stock
      const availableStock = getAvailableStock(product.id);
      setQuantity(availableStock > 0 ? 1 : 0);
      setSelectedVariant(null);
    }
  };

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (!selectedProduct) return;

    // Smart quantity adjustment when switching variants
    const availableStock = getAvailableStock(selectedProduct.id, variant.id);
    if (availableStock === 0) {
      // If variant is out of stock, set quantity to 0 and disable controls
      setQuantity(0);
    } else {
      // If variant has stock, always reset to 1 for fresh start
      setQuantity(1);
    }
  };

  const handleConfirm = () => {
    if (!selectedProduct) return;

    let selection: ProductSelection;
    let actualPrice: number;
    let stock: number;

    if (selectedVariant) {
      // Variant product
      actualPrice =
        selectedVariant.salePrice &&
        selectedVariant.salePrice < selectedVariant.price
          ? selectedVariant.salePrice
          : selectedVariant.price;

      stock = getAvailableStock(selectedProduct.id, selectedVariant.id);

      selection = {
        type: "existing",
        product: selectedProduct,
        variantId: selectedVariant.id,
        name: `${selectedProduct.name} (${selectedVariant.name})`,
        price: actualPrice,
        stock,
        weight: selectedVariant.weight,
        stockStatus: getStockStatus(stock, quantity) as any,
      };
    } else {
      // Simple product
      actualPrice =
        selectedProduct.salePrice &&
        selectedProduct.salePrice < selectedProduct.price
          ? selectedProduct.salePrice
          : selectedProduct.price;

      stock = getAvailableStock(selectedProduct.id);

      selection = {
        type: "existing",
        product: selectedProduct,
        name: selectedProduct.name,
        price: actualPrice,
        stock,
        weight: selectedProduct.weight,
        stockStatus: getStockStatus(stock, quantity) as any,
      };
    }

    console.log("📦 ProductSelectModal.handleConfirm - onProductSelect called", {
      productName: selectedProduct.name,
      quantity,
      stock,
      variantId: selectedVariant?.id
    });

    onProductSelect(selection, quantity);
    onClose();
  };

  const canConfirm =
    selectedProduct && (!selectedProduct.variants?.length || selectedVariant);
  const currentStock = selectedProduct ? (
    selectedVariant
      ? getAvailableStock(selectedProduct.id, selectedVariant.id)
      : getAvailableStock(selectedProduct.id)
  ) : 0;
  const stockStatus = getStockStatus(currentStock, quantity);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-5xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">პროდუქტის არჩევა</h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 sm:p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ძებნა პროდუქტის სახელით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent touch-manipulation"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Products List */}
          <div className="w-full sm:w-1/2 h-64 sm:h-auto sm:border-r border-b sm:border-b-0 overflow-y-auto custom-scrollbar">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                პროდუქტები ({filteredProducts.length})
              </h3>
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const availableStock = getAvailableStock(product.id);
                  const isSelected = selectedProduct?.id === product.id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full text-left p-3 sm:p-2 rounded-md border transition-all min-h-[60px] sm:min-h-[44px] active:scale-[0.98] ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${!product.isActive ? 'opacity-60 bg-gray-50/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm sm:text-sm font-medium ${!product.isActive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {product.name}
                            </h4>
                            {!product.isActive && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                არააქტიური
                              </span>
                            )}
                          </div>
                          <div className={`text-xs sm:text-xs ${!product.isActive ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                            ₾
                            {product.salePrice &&
                            product.salePrice < product.price ? (
                              <>
                                <span className="line-through text-gray-400">
                                  {product.price.toFixed(2)}
                                </span>
                                <span className="ml-1 text-red-600 font-medium">
                                  {product.salePrice.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              product.price.toFixed(2)
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStockIcon(getStockStatus(availableStock, quantity))}
                          <span className="text-xs text-gray-500">
                            [{availableStock}]
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variants & Details */}
          <div className="w-full sm:w-1/2 flex flex-col min-h-0">
            {selectedProduct ? (
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {selectedProduct.name}
                </h3>

                {/* Variants */}
                {selectedProduct.variants &&
                selectedProduct.variants.length > 0 ? (
                  <div className="space-y-1 mb-4">
                    <h4 className="text-xs font-medium text-gray-600 uppercase">
                      ვარიანტები
                    </h4>
                    {selectedProduct.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantStock = getAvailableStock(selectedProduct.id, variant.id);
                      const actualPrice =
                        variant.salePrice && variant.salePrice < variant.price
                          ? variant.salePrice
                          : variant.price;

                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantClick(variant)}
                          className={`w-full text-left p-3 sm:p-2 rounded-md border transition-all min-h-[56px] sm:min-h-[44px] active:scale-[0.98] ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          } ${!variant.isActive ? 'opacity-60 bg-gray-50/50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-medium ${!variant.isActive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {variant.name}
                                </div>
                                {!variant.isActive && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                    არააქტიური
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${!variant.isActive ? 'text-gray-500' : 'text-gray-600'}`}>
                                ₾
                                {variant.salePrice &&
                                variant.salePrice < variant.price ? (
                                  <>
                                    <span className="line-through text-gray-400">
                                      {variant.price.toFixed(2)}
                                    </span>
                                    <span className="ml-1 text-red-600 font-medium">
                                      {variant.salePrice.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  variant.price.toFixed(2)
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStockIcon(
                                getStockStatus(variantStock, quantity)
                              )}
                              <span className="text-xs text-gray-500">
                                [{variantStock}]
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        მარტივი პროდუქტი
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-900">
                          ხელმისაწვდომი: {getAvailableStock(selectedProduct.id)}
                        </span>
                        {getStockIcon(
                          getStockStatus(
                            getAvailableStock(selectedProduct.id),
                            quantity
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 uppercase mb-1">
                    რაოდენობა
                  </h4>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.max(currentStock === 0 ? 0 : 1, quantity - 1)
                        )
                      }
                      disabled={quantity <= (currentStock === 0 ? 0 : 1)}
                      className="p-2.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        if (currentStock === 0) return; // Prevent changes when out of stock
                        const value = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(value, currentStock)));
                      }}
                      className={`w-16 sm:w-16 text-center py-2 sm:py-1 text-sm sm:text-base border rounded-md focus:ring-2 focus:border-transparent touch-manipulation ${
                        currentStock === 0
                          ? "border-red-300 bg-red-50 text-red-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-emerald-500"
                      }`}
                      min={currentStock === 0 ? "0" : "1"}
                      max={currentStock}
                      disabled={currentStock === 0}
                      readOnly={currentStock === 0}
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= currentStock || currentStock === 0}
                      className="p-2.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {stockStatus === "out_of_stock" && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ პროდუქტი მარაგში არ არის!
                    </p>
                  )}
                  {stockStatus === "insufficient" && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ არასაკმარისი მარაგი! ხელმისაწვდომია: {currentStock}
                    </p>
                  )}
                  {stockStatus === "low" && currentStock > 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      ⚠️ დაბალი მარაგი! დარჩენილია: {currentStock}
                    </p>
                  )}
                </div>

                {/* Selection Summary */}
                {canConfirm && (
                  <>
                    {/* Warning for inactive product/variant */}
                    {(!selectedProduct.isActive || (selectedVariant && !selectedVariant.isActive)) && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-3">
                        <h4 className="text-sm font-medium text-red-900 mb-1 flex items-center gap-2">
                          ⚠️ გაფრთხილება
                        </h4>
                        <div className="text-xs text-red-800">
                          {!selectedProduct.isActive && (
                            <div>• პროდუქტი <strong>{selectedProduct.name}</strong> არააქტიურია საიტზე</div>
                          )}
                          {selectedVariant && !selectedVariant.isActive && (
                            <div>• ვარიანტი <strong>{selectedVariant.name}</strong> არააქტიურია საიტზე</div>
                          )}
                          <div className="mt-1 font-medium">
                            ეს პროდუქტი/ვარიანტი დამალულია კლიენტებისთვის, მაგრამ +ხელით შეკვეთისთვის ხელმისაწვდომია.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <h4 className="text-sm font-medium text-emerald-900 mb-1">
                        არჩეული პროდუქტი:
                      </h4>
                      <div className="text-xs text-emerald-800">
                        <div>
                          {selectedProduct.name}
                          {selectedVariant && ` (${selectedVariant.name})`}
                        </div>
                        <div>რაოდენობა: {quantity}</div>
                        <div className="font-medium mt-1">
                          ღირებულება: ₾
                          {(
                            (selectedVariant?.salePrice &&
                            selectedVariant.salePrice < selectedVariant.price
                              ? selectedVariant.salePrice
                              : selectedVariant?.price ||
                                (selectedProduct.salePrice &&
                                selectedProduct.salePrice < selectedProduct.price
                                  ? selectedProduct.salePrice
                                  : selectedProduct.price)) * quantity
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>აირჩიეთ პროდუქტი მარცხენა სიიდან</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-3 sm:px-3 sm:py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-lg border border-gray-300 hover:bg-gray-100 min-h-[44px] flex items-center justify-center sm:w-auto"
          >
            გაუქმება
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={
              !canConfirm ||
              quantity === 0 ||
              stockStatus === "insufficient" ||
              stockStatus === "out_of_stock"
            }
            className="px-4 py-3 sm:px-4 sm:py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transition-colors min-h-[44px] font-medium active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>დამატება</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectModal;
