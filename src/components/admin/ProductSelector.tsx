// src/components/admin/ProductSelector.tsx
import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import ProductSelectModal, { ProductSelection } from "./ProductSelectModal";
import type { ManualOrderItem } from "../../types";

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (selection: ProductSelection, quantity: number) => void;
  placeholder?: string;
  className?: string;
  requestedQuantity?: number;
  selectedItems?: ManualOrderItem[];
  currentItemIndex?: number;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  onProductSelect,
  placeholder = "პროდუქტის არჩევა...",
  className = "",
  requestedQuantity = 1,
  selectedItems = [],
  currentItemIndex = -1,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductSelect = (selection: ProductSelection, quantity: number) => {
    // Update the input value with selected product name
    onChange(selection.name);
    // Call the original callback
    onProductSelect(selection, quantity);
    // Close modal
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Input that triggers modal */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => setIsModalOpen(true)}
          placeholder={placeholder}
          className={`w-full pr-10 cursor-pointer ${className}`}
          readOnly
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Product Selection Modal */}
      <ProductSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductSelect={handleProductSelect}
        requestedQuantity={requestedQuantity}
        selectedItems={selectedItems}
        currentItemIndex={currentItemIndex}
      />
    </>
  );
};

export default ProductSelector;