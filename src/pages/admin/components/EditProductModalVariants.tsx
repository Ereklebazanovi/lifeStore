//EditProductModalVariants.tsx
import React, { useState, useEffect } from "react";
import { X, Package, Save, Edit3, Info } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import ImageUpload from "../../../components/ui/ImageUpload";
import { PRIORITY_PRESETS, getPriorityEmoji } from "../../../utils/priority";
import { showToast } from "../../../components/ui/Toast";
import type { Product } from "../../../types";

interface EditProductModalVariantsProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onProductUpdated?: () => void;
}

const EditProductModalVariants: React.FC<EditProductModalVariantsProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}) => {
  const { updateProduct, isLoading } = useProductStore();

  // ძირითადი ინფორმაცია
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // მარტივი პროდუქტი
  const [simplePrice, setSimplePrice] = useState<number>(0);
  const [simpleSalePrice, setSimpleSalePrice] = useState<number | undefined>(
    undefined
  );
  const [simpleStock, setSimpleStock] = useState<number>(0);
  const [simpleWeight, setSimpleWeight] = useState<number | undefined>(
    undefined
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form with product data
  useEffect(() => {
    if (product && isOpen) {
      setProductName(product.name || "");
      setProductCode(product.productCode || "");
      setDescription(product.description || "");
      setCategory(product.category || "");
      setImages(product.images || []);
      setPriority(product.priority || 0);
      setIsActive(product.isActive ?? true);

      // Always treat as simple product
      setSimplePrice(product.price || 0);
      setSimpleSalePrice(product.salePrice);
      setSimpleStock(product.stock || 0);
      setSimpleWeight(product.weight);

      setErrors({});
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  // ვალიდაცია
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // ძირითადი ინფორმაცია
    if (!productName.trim()) {
      newErrors.productName = "პროდუქტის სახელი აუცილებელია";
    }

    if (!productCode.trim()) {
      newErrors.productCode = "პროდუქტის კოდი აუცილებელია";
    } else if (!/^[A-Z0-9-]+$/.test(productCode.trim())) {
      newErrors.productCode = "კოდი უნდა შედგებოდეს მხოლოდ დიდი ასოებისა, რიცხვებისა და ნიშნის (-) გამოყენებით";
    }

    // მარტივი პროდუქტის ვალიდაცია
    if (simplePrice <= 0) {
      newErrors.simplePrice = "ფასი დადებითი უნდა იყოს";
    }
    if (simpleStock < 0) {
      newErrors.simpleStock = "მარაგი 0-ზე ნაკლები ვერ იქნება";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ფორმის გაგზავნა
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("შეავსეთ ყველა აუცილებელი ველი", "error");
      return;
    }

    try {
      const now = new Date();

      const updatedData = {
        name: productName.trim(),
        productCode: productCode.trim().toUpperCase(),
        description: description.trim(),
        category: category.trim(),
        images,
        priority,
        isActive,
        hasVariants: false, // Always false now

        // Main product data
        price: simplePrice,
        ...(simpleSalePrice !== undefined && { salePrice: simpleSalePrice }),
        stock: simpleStock,
        ...(simpleWeight !== undefined && { weight: simpleWeight }),

        // Legacy fields for consistency
        minPrice: simplePrice,
        maxPrice: simplePrice,
        totalStock: simpleStock,

        updatedAt: now,
      };

      await updateProduct(product.id, updatedData);
      showToast("პროდუქტი წარმატებით განახლდა", "success");

      onProductUpdated?.();
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("პროდუქტის განახლება ვერ მოხერხდა", "error");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Centered Modal */}
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6" />
            <h2 className="text-xl font-semibold">პროდუქტის რედაქტირება</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* ძირითადი ინფორმაცია */}
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  ძირითადი ინფორმაცია
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  შეცვალეთ პროდუქტის მთავარი მონაცემები
                </p>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  პროდუქტის სახელი <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.productName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="მაგ: ლანჩბოქსი"
                />
                {errors.productName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.productName}
                  </p>
                )}
              </div>

              {/* Product Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  პროდუქტის კოდი <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(უნიკალური, ბუღალტრული)</span>
                </label>
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.productCode ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="მაგ: LFC-123"
                />
                {errors.productCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.productCode}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  პროდუქტის აღწერა
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="პროდუქტის დეტალური აღწერა..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  კატეგორია
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="მაგ: სამზარეულოს ნივთები"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  სურათები
                </label>
                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={4}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  პრიორიტეტი
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PRIORITY_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPriority(preset.value)}
                      className={`p-4 text-left border rounded-lg transition-colors ${
                        priority === preset.value
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getPriorityEmoji(preset.value)}</span>
                        <span className="font-medium">{preset.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    პროდუქტი აქტიურია
                  </span>
                </label>
              </div>
            </div>

            {/* ფასი და მარაგი */}
            <div className="space-y-5">
              <div className="border-t border-gray-200 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    ფასი და მარაგი
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    შეცვალეთ პროდუქტის ფასი და მარაგის რაოდენობა
                  </p>
                </div>
              </div>

              {/* პროდუქტის ფასი და მარაგი */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-3">
                      ფასი და მარაგის მონაცემები
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          ფასი (₾) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={simplePrice === 0 ? "" : simplePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setSimplePrice(0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                setSimplePrice(numValue);
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.simplePrice
                              ? "border-red-300"
                              : "border-blue-300"
                          }`}
                          placeholder="0.00"
                        />
                        {errors.simplePrice && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.simplePrice}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          ფასდაკლებული ფასი
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={simpleSalePrice === undefined || simpleSalePrice === 0 ? "" : simpleSalePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setSimpleSalePrice(undefined);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                setSimpleSalePrice(numValue);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="არასავალდებულო"
                        />
                        {simpleSalePrice && simpleSalePrice >= simplePrice && (
                          <p className="text-orange-600 text-sm mt-1">
                            ფასდაკლებული ფასი ნაკლები უნდა იყოს ძირითადზე
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          მარაგი <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={simpleStock === 0 ? "" : simpleStock}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setSimpleStock(0);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                setSimpleStock(numValue);
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.simpleStock
                              ? "border-red-300"
                              : "border-blue-300"
                          }`}
                          placeholder="0"
                        />
                        {errors.simpleStock && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.simpleStock}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          ⚖️ წონა (გრ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={simpleWeight === undefined ? "" : simpleWeight}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setSimpleWeight(undefined);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                setSimpleWeight(numValue);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="არასავალდებულო"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={isLoading}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              "განახლება..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                პროდუქტის განახლება
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModalVariants;