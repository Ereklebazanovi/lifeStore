import React, { useState } from "react";
import { X, Package, ImageIcon } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import ImageUpload from "../../../components/ui/ImageUpload";
import { PRIORITY_PRESETS, getPriorityEmoji } from "../../../utils/priority";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addProduct, isLoading } = useProductStore();

  // ✅ ახალი State: აკონტროლებს, ჩართულია თუ არა "ხელით" რეჟიმი
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    images: [] as string[],
    priority: 0,
  });

  const [hasDiscountEnabled, setHasDiscountEnabled] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    originalPrice: "",
    stock: "",
  });

  const validateForm = () => {
    const newErrors = {
      name: "",
      price: "",
      originalPrice: "",
      stock: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "პროდუქტის სახელი აუცილებელია";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "ფასი უნდა იყოს დადებითი რიცხვი";
    }


    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "მარაგი უნდა იყოს 0 ან მეტი";
    }

    // ფასდაკლების ვალიდაცია
    if (hasDiscountEnabled) {
      if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
        newErrors.originalPrice = "ძველი ფასი აუცილებელია";
      } else if (
        parseFloat(formData.originalPrice) <= parseFloat(formData.price || "0")
      ) {
        newErrors.originalPrice = "ძველი ფასი ახალ ფასზე მეტი უნდა იყოს";
      }
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
      ...(hasDiscountEnabled &&
        formData.originalPrice && {
          originalPrice: parseFloat(formData.originalPrice),
        }),
      category: "General", // ✅ ავტომატურად "General" კატეგორია
      stock: parseInt(formData.stock),
      images: formData.images.filter((img: string) => img.trim() !== ""),
      priority: formData.priority,
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
        originalPrice: "",
        stock: "",
        images: [] as string[],
        priority: 0,
      });
      setHasDiscountEnabled(false);
      setIsCustomMode(false); // Reset mode
      setErrors({
        name: "",
        price: "",
        originalPrice: "",
        stock: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("პროდუქტის დამატება ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
    }
  };


  const handleNumberInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

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

            {/* Discount Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="discountToggle"
                checked={hasDiscountEnabled}
                onChange={(e) => {
                  setHasDiscountEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, originalPrice: "" });
                    setErrors({ ...errors, originalPrice: "" });
                  }
                }}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                disabled={isLoading}
              />
              <label
                htmlFor="discountToggle"
                className="text-sm font-medium text-gray-700"
              >
                ფასდაკლების დამატება
              </label>
              {hasDiscountEnabled &&
                formData.originalPrice &&
                formData.price && (
                  <span className="ml-auto px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    -
                    {Math.round(
                      ((parseFloat(formData.originalPrice) -
                        parseFloat(formData.price)) /
                        parseFloat(formData.originalPrice)) *
                        100
                    )}
                    %
                  </span>
                )}
            </div>

            {/* Price Fields */}
            <div
              className={`grid grid-cols-1 ${
                hasDiscountEnabled ? "md:grid-cols-3" : "md:grid-cols-2"
              } gap-4`}
            >
              {/* Original Price (if discount enabled) */}
              {hasDiscountEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ძველი ფასი (₾) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value,
                      })
                    }
                    onWheel={handleNumberInputWheel}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.originalPrice
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-green-500"
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {errors.originalPrice && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.originalPrice}
                    </p>
                  )}
                </div>
              )}

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {hasDiscountEnabled ? "ახალი ფასი (₾) *" : "ფასი (₾) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  onWheel={handleNumberInputWheel}
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
                  onWheel={handleNumberInputWheel}
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

            {/* ✅ Priority Section - განახლებული ლოგიკით */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                პოზიციონირება საიტზე
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Preset ღილაკები */}
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

                {/* Custom ღილაკი */}
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

              {/* Custom Input - დამოკიდებულია isCustomMode-ზე */}
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
                            e.target.value === ""
                              ? 0
                              : parseInt(e.target.value),
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
                ამჟამინდელი პრიორიტეტი: <strong>{formData.priority}</strong>{" "}
                {getPriorityEmoji(formData.priority)}
              </div>
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
