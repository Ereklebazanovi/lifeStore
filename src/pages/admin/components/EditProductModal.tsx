import React, { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import ImageUpload from "../../../components/ui/ImageUpload";
import { PRIORITY_PRESETS, getPriorityEmoji } from "../../../utils/priority";
import type { Product } from "../../../types";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { updateProduct, isLoading } = useProductStore();

  // ✅ ახალი State
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    images: [] as string[],
    isActive: true,
    priority: 0,
  });

  const [hasDiscountEnabled, setHasDiscountEnabled] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.originalPrice
          ? product.originalPrice.toString()
          : "",
        stock: product.stock.toString(),
        images: product.images || [],
        isActive: product.isActive ?? true,
        priority: product.priority || 0,
      });

      // Discount Logic
      if (product.originalPrice && product.originalPrice > product.price) {
        setHasDiscountEnabled(true);
      } else {
        setHasDiscountEnabled(false);
      }

      // ✅ Custom Mode Logic
      // თუ პრიორიტეტი არ არის სტანდარტულ Preset-ებში (0, 10, 100), ე.ი. ხელითაა ჩაწერილი
      const isStandardPreset = PRIORITY_PRESETS.some(
        (p) => p.value === (product.priority || 0)
      );
      setIsCustomMode(!isStandardPreset);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData: Partial<Product> = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: "General", // ✅ ავტომატურად "General" კატეგორია
      stock: parseInt(formData.stock),
      images: formData.images.filter((img: string) => img.trim() !== ""),
      isActive: formData.isActive,
      priority: formData.priority,
    };

    if (hasDiscountEnabled && formData.originalPrice) {
      productData.originalPrice = parseFloat(formData.originalPrice);
    } else {
      productData.originalPrice = 0;
      if (!hasDiscountEnabled) delete productData.originalPrice;
    }

    await updateProduct(product.id, productData);
    onClose();
  };

  const handleNumberInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-50 flex justify-between items-center p-6 border-b border-gray-200 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">
            პროდუქტის რედაქტირება
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                პროდუქტის სახელი *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                აღწერა *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Pricing Section (with Discount Toggle) */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="editDiscountToggle"
                checked={hasDiscountEnabled}
                onChange={(e) => {
                  setHasDiscountEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, originalPrice: "" });
                  }
                }}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor="editDiscountToggle"
                className="text-sm font-medium text-gray-700 select-none cursor-pointer"
              >
                ფასდაკლების აქტივაცია
              </label>
            </div>

            <div
              className={`grid grid-cols-1 ${
                hasDiscountEnabled ? "md:grid-cols-3" : "md:grid-cols-2"
              } gap-4`}
            >
              {/* Original Price */}
              {hasDiscountEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ძველი ფასი (₾)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value,
                      })
                    }
                    onWheel={handleNumberInputWheel}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {hasDiscountEnabled ? "ახალი ფასი (₾) *" : "ფასი (₾) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  onWheel={handleNumberInputWheel}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  მარაგი *
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  onWheel={handleNumberInputWheel}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>


          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>სურათები</span>
            </h3>
            <ImageUpload
              images={formData.images}
              onChange={(images) =>
                setFormData((prev) => ({ ...prev, images }))
              }
              maxImages={4}
            />
          </div>

          {/* ✅ Priority Section - განახლებული */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              პოზიციონირება საიტზე
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRIORITY_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, priority: preset.value });
                    setIsCustomMode(false); // ✅ თიშავს Custom რეჟიმს
                  }}
                  className={`p-2 border-2 rounded-xl transition-all text-center hover:scale-105 flex flex-col items-center justify-center min-h-[80px] ${
                    !isCustomMode && formData.priority === preset.value
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : "border-gray-200 hover:border-green-300 text-gray-600"
                  }`}
                >
                  <div className="text-xl mb-1">{preset.emoji}</div>
                  <div className="font-bold text-xs">{preset.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                    {preset.description}
                  </div>
                </button>
              ))}

              {/* Custom Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true); // ✅ რთავს Custom რეჟიმს
                  if (formData.priority === 0)
                    setFormData({ ...formData, priority: 50 });
                }}
                className={`p-2 border-2 rounded-xl transition-all text-center hover:scale-105 flex flex-col items-center justify-center min-h-[80px] ${
                  isCustomMode
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 hover:border-blue-300 text-gray-600"
                }`}
              >
                <div className="text-xl mb-1">✏️</div>
                <div className="font-bold text-xs">ხელით</div>
                <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                  ნებისმიერი რიცხვი
                </div>
              </button>
            </div>

            {/* Custom Input */}
            {isCustomMode && (
              <div className="mt-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">
                  მიუთითეთ პრიორიტეტის დონე
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={formData.priority === 0 ? "" : formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority:
                          e.target.value === "" ? 0 : parseInt(e.target.value),
                      })
                    }
                    onWheel={handleNumberInputWheel}
                    className="block w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg font-bold text-blue-900"
                    placeholder="0"
                  />
                  <div className="text-xs text-blue-600 w-full">
                    <p>• 100 = TOP</p>
                    <p>• 1000 = Super TOP</p>
                    <p>• -1 = სიის ბოლოს</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500 text-right">
              ამჟამინდელი სტატუსი:{" "}
              {formData.priority > 0
                ? getPriorityEmoji(formData.priority)
                : "სტანდარტული"}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 select-none cursor-pointer"
            >
              აქტიური პროდუქტი (გამოჩნდეს საიტზე)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {isLoading ? "ინახება..." : "ცვლილებების შენახვა"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
