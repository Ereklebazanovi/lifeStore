// src/pages/admin/components/AddProductModal.tsx
import React, { useState } from "react";
import {
  X,
  Package,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import ImageUpload from "../../../components/ui/ImageUpload";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addProduct, isLoading } = useProductStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    images: [] as string[],
  });

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
  });

  const validateForm = () => {
    const newErrors = {
      name: "",
      price: "",
      category: "",
      stock: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "პროდუქტის სახელი აუცილებელია";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "ფასი უნდა იყოს დადებითი რიცხვი";
    }

    if (!formData.category.trim()) {
      newErrors.category = "კატეგორია აუცილებელია";
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "მარაგი უნდა იყოს 0 ან მეტი";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock),
      images: formData.images.filter((img: string) => img.trim() !== ""),
      isActive: true,
    };

    try {
      await addProduct(productData);
      onClose();

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        images: [] as string[],
      });
      setErrors({
        name: "",
        price: "",
        category: "",
        stock: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("პროდუქტის დამატება ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
    }
  };

  const categories = ["კატეგორია-1", "კატეგორია-2", "კატეგორია-3"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">ახალი პროდუქტის დამატება</h2>
                <p className="text-green-100 text-sm">
                  შეავსეთ ყველა ველი პროდუქტის დასამატებლად
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              ძირითადი ინფორმაცია
            </h3>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                პროდუქტის სახელი *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.name
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-green-500"
                }`}
                placeholder="მაგ. iPhone 15 Pro"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                აღწერა
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors resize-none"
                placeholder="პროდუქტის დეტალური აღწერა..."
                disabled={isLoading}
              />
            </div>

            {/* Price and Stock Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ფასი (₾) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.price
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-green-500"
                  }`}
                  placeholder="0.00"
                  disabled={isLoading}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  მარაგი *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.stock
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-green-500"
                  }`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                კატეგორია *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.category
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-green-500"
                }`}
                disabled={isLoading}
              >
                <option value="">აირჩიეთ კატეგორია</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>სურათები</span>
            </h3>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-4">
                ატვირთეთ პროდუქტის სურათები (მაქსიმუმ 4). მხარდაჭერილია: JPG,
                PNG, WebP
              </p>

              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
                maxImages={4}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>მიმდინარეობს...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span className="text-black">პროდუქტის დამატება</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
