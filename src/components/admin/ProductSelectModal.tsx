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
import type { Product, ProductVariant } from "../../types";
import { getTotalStock } from "../../utils/stock";

export interface ProductSelection {
  type: "existing" | "manual";
  product?: Product;
  variantId?: string;
  name: string;
  price: number;
  stock?: number;
  stockStatus?: "available" | "low" | "out_of_stock";
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (selection: ProductSelection, quantity: number) => void;
  requestedQuantity?: number;
}

const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  requestedQuantity = 1,
}) => {
  const { products } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(requestedQuantity);

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
      // Simple product - reset quantity based on stock
      const productStock = getTotalStock(product);
      setQuantity(productStock > 0 ? 1 : 0);
      setSelectedVariant(null);
    }
  };

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Smart quantity adjustment when switching variants
    const variantStock = variant.stock || 0;
    if (variantStock === 0) {
      // If variant is out of stock, set quantity to 0 and disable controls
      setQuantity(0);
    } else {
      // If variant has stock, always reset to 1 for fresh start
      setQuantity(1);
    }
    // If variant has enough stock, keep current quantity
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

      stock = selectedVariant.stock || 0;

      selection = {
        type: "existing",
        product: selectedProduct,
        variantId: selectedVariant.id,
        name: `${selectedProduct.name} (${selectedVariant.name})`,
        price: actualPrice,
        stock,
        stockStatus: getStockStatus(stock, quantity) as any,
      };
    } else {
      // Simple product
      actualPrice =
        selectedProduct.salePrice &&
        selectedProduct.salePrice < selectedProduct.price
          ? selectedProduct.salePrice
          : selectedProduct.price;

      stock = getTotalStock(selectedProduct);

      selection = {
        type: "existing",
        product: selectedProduct,
        name: selectedProduct.name,
        price: actualPrice,
        stock,
        stockStatus: getStockStatus(stock, quantity) as any,
      };
    }

    onProductSelect(selection, quantity);
    onClose();
  };

  const canConfirm =
    selectedProduct && (!selectedProduct.variants?.length || selectedVariant);
  const currentStock = selectedVariant
    ? selectedVariant.stock
    : getTotalStock(selectedProduct || ({} as Product));
  const stockStatus = getStockStatus(currentStock, quantity);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">პროდუქტის არჩევა</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ძებნა პროდუქტის სახელით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Products List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                პროდუქტები ({filteredProducts.length})
              </h3>
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product);
                  const isSelected = selectedProduct?.id === product.id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full text-left p-2 rounded-md border transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {product.name}
                          </h4>
                          <div className="text-xs text-gray-600">
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
                          {getStockIcon(getStockStatus(totalStock, quantity))}
                          <span className="text-xs text-gray-500">
                            [{totalStock}]
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
          <div className="w-1/2 flex flex-col">
            {selectedProduct ? (
              <div className="flex-1 overflow-y-auto p-3">
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
                      const variantStock = variant.stock || 0;
                      const actualPrice =
                        variant.salePrice && variant.salePrice < variant.price
                          ? variant.salePrice
                          : variant.price;

                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantClick(variant)}
                          className={`w-full text-left p-2 rounded-md border transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {variant.name}
                              </div>
                              <div className="text-xs text-gray-600">
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
                          მარაგი: {getTotalStock(selectedProduct)}
                        </span>
                        {getStockIcon(
                          getStockStatus(
                            getTotalStock(selectedProduct),
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
                      onClick={() => setQuantity(Math.max(currentStock === 0 ? 0 : 1, quantity - 1))}
                      disabled={quantity <= (currentStock === 0 ? 0 : 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`w-16 text-center py-1 text-sm border rounded-md focus:ring-2 focus:border-transparent ${
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
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              !canConfirm ||
              quantity === 0 ||
              stockStatus === "insufficient" ||
              stockStatus === "out_of_stock"
            }
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors"
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
