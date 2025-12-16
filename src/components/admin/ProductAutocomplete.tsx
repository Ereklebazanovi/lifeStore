// src/components/admin/ProductAutocomplete.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Package,
  Plus,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useProductStore } from "../../store/productStore";
import type { Product } from "../../types";

export interface ProductSelection {
  type: "existing" | "manual";
  product?: Product;
  name: string;
  price: number;
  stock?: number;
  stockStatus?: "available" | "low" | "out_of_stock";
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (selection: ProductSelection) => void;
  placeholder?: string;
  className?: string;
  requestedQuantity?: number; // ✅ ახალი პარამეტრი stock validation-ისთვის
}

const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  value,
  onChange,
  onProductSelect,
  placeholder = "მაგ: წითელი ჩანთა",
  className = "",
  requestedQuantity = 1,
}) => {
  const { products } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search term
  useEffect(() => {
    if (!value.trim()) {
      setFilteredProducts([]);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const filtered = products
      .filter(
        (product) =>
          product.isActive && product.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5); // Limit to 5 results

    setFilteredProducts(filtered);
  }, [value, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
  };

  const handleProductSelect = (product: Product) => {
    onChange(product.name);
    setIsOpen(false);

    // ✅ გამოვთვალოთ stock status requested quantity-ს მიხედვით
    const stockStatus =
      product.stock <= 0
        ? "out_of_stock"
        : product.stock < requestedQuantity
        ? "low"
        : product.stock <= 10
        ? "low"
        : "available";

    onProductSelect({
      type: "existing",
      product,
      name: product.name,
      price: product.price,
      stock: product.stock,
      stockStatus,
    });
  };

  const handleManualSelect = () => {
    setIsOpen(false);

    onProductSelect({
      type: "manual",
      name: value,
      price: 0,
    });
  };

  const handleInputFocus = () => {
    if (value.length > 0) {
      setIsOpen(true);
    }
  };

  const showDropdown =
    isOpen && (filteredProducts.length > 0 || value.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full pl-8 pr-3 py-1 text-sm border border-stone-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none ${className}`}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Existing Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-bold text-stone-500 uppercase border-b border-stone-100">
                არსებული პროდუქტები
              </div>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  disabled={product.stock <= 0}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between group transition-colors ${
                    product.stock <= 0
                      ? "bg-red-50 cursor-not-allowed opacity-75"
                      : product.stock < requestedQuantity
                      ? "hover:bg-orange-50 border-l-2 border-orange-200"
                      : "hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-stone-900 truncate">
                          {product.name}
                        </div>
                        {/* ✅ Stock Warning Icons */}
                        {product.stock <= 0 && (
                          <div title="მარაგი არ არის">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          </div>
                        )}
                        {product.stock > 0 &&
                          product.stock < requestedQuantity && (
                            <div
                              title={`არასაკმარისი რაოდენობა მოთხოვნილი რაოდენობისთვის`}
                            >
                              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            </div>
                          )}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-2">
                        <span>₾{product.price.toFixed(2)}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            product.stock <= 0
                              ? "bg-red-100 text-red-700"
                              : product.stock < requestedQuantity
                              ? "bg-orange-100 text-orange-700"
                              : product.stock <= 10
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.stock <= 0
                            ? "არ არის"
                            : product.stock < requestedQuantity
                            ? `მხოლოდ ${product.stock} ცალი`
                            : `${product.stock} ცალი`}
                        </span>
                        {/* ✅ დამატებითი Warning Message */}
                        {product.stock > 0 &&
                          product.stock < requestedQuantity && (
                            <span className="text-[10px] text-orange-600 font-medium">
                              მოთხ.: {requestedQuantity}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Manual Entry Option */}
          {value.length > 0 && (
            <div
              className={`${
                filteredProducts.length > 0 ? "border-t border-stone-100" : ""
              }`}
            >
              <div className="px-3 py-2 text-xs font-bold text-stone-500 uppercase">
                ხელით დამატება
              </div>
              <button
                type="button"
                onClick={handleManualSelect}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    "{value}" - ხელით დამატება
                  </div>
                  <div className="text-xs text-blue-600">
                    ფასი და სტატუსი შემდეგ მიუთითეთ
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* No Results */}
          {filteredProducts.length === 0 && value.length > 0 && (
            <div className="px-3 py-4 text-center text-stone-500">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-stone-400" />
              <div className="text-sm">პროდუქტი ვერ მოიძებნა</div>
              <div className="text-xs text-stone-400 mt-1">
                გამოიყენეთ "ხელით დამატება" ღილაკი
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
