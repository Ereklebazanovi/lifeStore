// src/components/admin/ProductAutocomplete.tsx
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Search,
  Package,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2
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
  requestedQuantity?: number;
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
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFilteredProducts([]);
      return;
    }
    const searchTerm = value.toLowerCase().trim();
    const filtered = products
      .filter(p => p.isActive && p.name.toLowerCase().includes(searchTerm))
      .slice(0, 5);
    setFilteredProducts(filtered);
  }, [value, products]);

  // ✅ განახლებული პოზიციონირების ლოგიკა
  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      const updatePosition = () => {
        const rect = inputRef.current!.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 5, // ინპუტის ქვემოთ
          left: rect.left,
          width: 400, // ფიქსირებული სიგანე
        });
      };
      
      updatePosition();
      // სქროლზე და რისაიზზე განახლება
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(e.target.value.length > 0);
  };

  const handleProductSelect = (product: Product) => {
    onChange(product.name);
    setIsOpen(false);
    const stockStatus =
      product.stock <= 0 ? "out_of_stock" :
      product.stock < requestedQuantity ? "low" :
      product.stock <= 10 ? "low" : "available";

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
    onProductSelect({ type: "manual", name: value, price: 0 });
  };

  const showDropdown = isOpen && (filteredProducts.length > 0 || value.length > 0);

  return (
    <div className="relative group">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none ${className}`}
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed', // ✅ FIXED პოზიცია
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 99999, // ✅ ძალიან მაღალი z-index
          }}
          className="bg-white border border-stone-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-75"
        >
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-stone-50 text-xs font-bold text-stone-500 uppercase border-b border-stone-100">
                ნაპოვნია {filteredProducts.length} პროდუქტი
              </div>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  disabled={product.stock <= 0}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-stone-50 last:border-0 transition-colors ${
                     product.stock <= 0 ? 'bg-red-50/50 opacity-60' : 'hover:bg-emerald-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                    product.stock <= 0 ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-900 truncate">{product.name}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ₾{product.price}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                       {product.stock <= 0 ? (
                         <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> ამოიწურა</span>
                       ) : (
                         <span className="text-stone-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {product.stock} მარაგში</span>
                       )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {value.length > 0 && (
            <button
              type="button"
              onClick={handleManualSelect}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 text-blue-700 font-medium border-t border-stone-100"
            >
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              "{value}" - ის დამატება ხელით
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;