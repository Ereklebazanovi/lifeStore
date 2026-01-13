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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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
      product.variants?.some(v =>
        v.color?.toLowerCase().includes(searchLower) ||
        v.size?.toLowerCase().includes(searchLower)
      )
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
    } else {
      // Simple product, can select immediately
      setSelectedVariant(null);
    }
  };

  const handleVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleConfirm = () => {
    if (!selectedProduct) return;

    let selection: ProductSelection;
    let actualPrice: number;
    let stock: number;

    if (selectedVariant) {
      // Variant product
      actualPrice = selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.price
        ? selectedVariant.salePrice
        : selectedVariant.price;

      stock = selectedVariant.stock || 0;

      selection = {
        type: "existing",
        product: selectedProduct,
        variantId: selectedVariant.id,
        name: `${selectedProduct.name} (${selectedVariant.color || selectedVariant.size || 'ვარიანტი'})`,
        price: actualPrice,
        stock,
        stockStatus: getStockStatus(stock, quantity) as any,
      };
    } else {
      // Simple product
      actualPrice = selectedProduct.salePrice && selectedProduct.salePrice < selectedProduct.price
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

  const canConfirm = selectedProduct && (!selectedProduct.variants?.length || selectedVariant);
  const currentStock = selectedVariant?.stock || getTotalStock(selectedProduct || {} as Product);
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">პროდუქტის არჩევა</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ძებნა პროდუქტის სახელით, ფერით, ზომით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Products List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">პროდუქტები ({filteredProducts.length})</h3>
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product);
                  const isSelected = selectedProduct?.id === product.id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <div className="text-sm text-gray-600">
                            ₾{product.salePrice && product.salePrice < product.price
                              ? (
                                <>
                                  <span className="line-through text-gray-400">
                                    {product.price.toFixed(2)}
                                  </span>
                                  <span className="ml-1 text-red-600 font-medium">
                                    {product.salePrice.toFixed(2)}
                                  </span>
                                </>
                              )
                              : product.price.toFixed(2)
                            }
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStockIcon(getStockStatus(totalStock, quantity))}
                          <span className="text-sm text-gray-500">[მარაგი: {totalStock}]</span>
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
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedProduct.name}
                </h3>

                {/* Variants */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    <h4 className="text-xs font-medium text-gray-600 uppercase">ვარიანტები</h4>
                    {selectedProduct.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantStock = variant.stock || 0;
                      const actualPrice = variant.salePrice && variant.salePrice < variant.price
                        ? variant.salePrice
                        : variant.price;

                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantClick(variant)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {variant.color && variant.size
                                  ? `${variant.color} - ${variant.size}`
                                  : variant.color || variant.size || 'ვარიანტი'
                                }
                              </div>
                              <div className="text-sm text-gray-600">
                                ₾{variant.salePrice && variant.salePrice < variant.price
                                  ? (
                                    <>
                                      <span className="line-through text-gray-400">
                                        {variant.price.toFixed(2)}
                                      </span>
                                      <span className="ml-1 text-red-600 font-medium">
                                        {variant.salePrice.toFixed(2)}
                                      </span>
                                    </>
                                  )
                                  : variant.price.toFixed(2)
                                }
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStockIcon(getStockStatus(variantStock, quantity))}
                              <span className="text-sm text-gray-500">[მარაგი: {variantStock}]</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">მარტივი პროდუქტი</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-900">მარაგი: {getTotalStock(selectedProduct)}</span>
                        {getStockIcon(getStockStatus(getTotalStock(selectedProduct), quantity))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-600 uppercase mb-2">რაოდენობა</h4>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {stockStatus === "insufficient" && (
                    <p className="text-sm text-red-600 mt-1">
                      არასაკმარისი მარაგი! ხელმისაწვდომია: {currentStock}
                    </p>
                  )}
                </div>

                {/* Selection Summary */}
                {canConfirm && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-2">არჩეული პროდუქტი:</h4>
                    <div className="text-sm text-emerald-800">
                      <div>{selectedProduct.name}
                        {selectedVariant && ` (${selectedVariant.color || selectedVariant.size || 'ვარიანტი'})`}
                      </div>
                      <div>რაოდენობა: {quantity}</div>
                      <div className="font-medium mt-1">
                        ღირებულება: ₾{(
                          (selectedVariant?.salePrice && selectedVariant.salePrice < selectedVariant.price
                            ? selectedVariant.salePrice
                            : selectedVariant?.price || selectedProduct.salePrice && selectedProduct.salePrice < selectedProduct.price
                            ? selectedProduct.salePrice
                            : selectedProduct.price) * quantity
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
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || stockStatus === "insufficient" || stockStatus === "out_of_stock"}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
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