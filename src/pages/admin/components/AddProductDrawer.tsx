//AddProductDrawer.tsx
import React, { useState } from "react";
import { X, Package, Plus, Trash2, Save, Info } from "lucide-react";
import { useProductStore } from "../../../store/productStore";
import ImageUpload from "../../../components/ui/ImageUpload";
import { PRIORITY_PRESETS, getPriorityEmoji } from "../../../utils/priority";
import { showToast } from "../../../components/ui/Toast";
import type { ProductVariant } from "../../../types";

interface AddProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

interface SimpleVariant {
  name: string;
  price: number;
  salePrice?: number;
  stock: number;
  weight?: number;
}

const AddProductDrawer: React.FC<AddProductDrawerProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const { addProduct, isLoading } = useProductStore();

  // ძირითადი ინფორმაცია
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [priority, setPriority] = useState(0);

  // ვარიანტების რეჟიმი
  const [hasVariants, setHasVariants] = useState(false);

  // მარტივი პროდუქტი (ვარიანტების გარეშე)
  const [simplePrice, setSimplePrice] = useState<number>(0);
  const [simpleSalePrice, setSimpleSalePrice] = useState<number | undefined>(undefined);
  const [simpleStock, setSimpleStock] = useState<number>(0);
  const [simpleWeight, setSimpleWeight] = useState<number | undefined>(undefined);

  // ვარიანტების მასივი
  const [variants, setVariants] = useState<SimpleVariant[]>([
    { name: "", price: 0, salePrice: undefined, stock: 0, weight: undefined },
  ]);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  // ვალიდაცია
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // ძირითადი ინფორმაცია
    if (!productName.trim()) {
      newErrors.productName = "პროდუქტის სახელი აუცილებელია";
    }

    if (hasVariants) {
      // ვარიანტების ვალიდაცია
      if (variants.length === 0) {
        newErrors.variants = "მინიმუმ ერთი ვარიანტი საჭიროა";
      }

      variants.forEach((variant, index) => {
        if (!variant.name.trim()) {
          newErrors[`variant_${index}_name`] = "ვარიანტის სახელი აუცილებელია";
        }
        if (variant.price <= 0) {
          newErrors[`variant_${index}_price`] = "ფასი დადებითი უნდა იყოს";
        }
        if (variant.stock < 0) {
          newErrors[`variant_${index}_stock`] =
            "მარაგი 0-ზე ნაკლები ვერ იქნება";
        }
      });

      // შეამოწმებს ვარიანტების სახელები განსხვავებულია თუ არა
      const variantNames = variants
        .map((v) => v.name.trim())
        .filter((name) => name);
      const uniqueNames = new Set(variantNames);
      if (variantNames.length !== uniqueNames.size) {
        newErrors.variantNames = "ვარიანტების სახელები უნიკალური უნდა იყოს";
      }
    } else {
      // მარტივი პროდუქტის ვალიდაცია
      if (simplePrice <= 0) {
        newErrors.simplePrice = "ფასი დადებითი უნდა იყოს";
      }
      if (simpleStock < 0) {
        newErrors.simpleStock = "მარაგი 0-ზე ნაკლები ვერ იქნება";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ვარიანტების მართვა
  const addVariant = () => {
    setVariants([
      ...variants,
      { name: "", price: 0, salePrice: undefined, stock: 0, weight: undefined },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  const updateVariant = (
    index: number,
    field: keyof SimpleVariant,
    value: string | number | boolean | undefined
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // Bulk discount application
  const applyBulkDiscount = () => {
    if (bulkDiscountPercent <= 0 || bulkDiscountPercent >= 100) {
      showToast("ფასდაკლება უნდა იყოს 1-99% შორის", "error");
      return;
    }

    const newVariants = variants.map((variant) => ({
      ...variant,
      salePrice:
        variant.price > 0
          ? Math.round(variant.price * (1 - bulkDiscountPercent / 100) * 100) /
            100
          : undefined,
    }));

    setVariants(newVariants);
    showToast(
      `${bulkDiscountPercent}% ფასდაკლება გამოყენებულია ყველა ვარიანტზე`,
      "success"
    );
  };

  // Clear all sale prices
  const clearAllSalePrices = () => {
    const newVariants = variants.map((variant) => ({
      ...variant,
      salePrice: undefined,
    }));
    setVariants(newVariants);
    showToast("ყველა ფასდაკლება მოხსნილია", "success");
  };

  // სტატისტიკის გამოთვლა
  const calculateStats = () => {
    if (!hasVariants) {
      return {
        minPrice: simplePrice,
        maxPrice: simplePrice,
        totalStock: simpleStock,
      };
    }

    const prices = variants.filter((v) => v.price > 0).map((v) => v.price);
    const stocks = variants.map((v) => v.stock);

    return {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      totalStock: stocks.reduce((sum, stock) => sum + stock, 0),
    };
  };

  // ფორმის გაგზავნა
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("შეავსეთ ყველა აუცილებელი ველი", "error");
      return;
    }

    try {
      const stats = calculateStats();
      const now = new Date();

      const productData = {
        name: productName.trim(),
        description: description.trim(),
        category: category.trim(),
        images,
        priority,
        isActive: true,
        hasVariants,

        // ძველი ველები backward compatibility-სთვის
        price: hasVariants ? stats.minPrice : simplePrice,
        ...((!hasVariants && simpleSalePrice !== undefined) && { salePrice: simpleSalePrice }),
        stock: hasVariants ? stats.totalStock : simpleStock,
        ...((!hasVariants && simpleWeight !== undefined) && { weight: simpleWeight }),

        // ახალი ველები variant system-ისთვის
        minPrice: stats.minPrice,
        maxPrice: stats.maxPrice,
        totalStock: stats.totalStock,

        // ვარიანტები - only include if hasVariants is true
        ...(hasVariants && {
          variants: variants.map((variant, index) => ({
            id: `var_${Date.now()}_${index}`,
            name: variant.name.trim(),
            price: variant.price,
            ...(variant.salePrice !== undefined && { salePrice: variant.salePrice }),
            stock: variant.stock,
            ...(variant.weight !== undefined && { weight: variant.weight }),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }))
        }),

        createdAt: now,
        updatedAt: now,
      };

      await addProduct(productData);
      showToast("პროდუქტი წარმატებით დაემატა", "success");

      // ფორმის რესეტი
      setProductName("");
      setDescription("");
      setCategory("");
      setImages([]);
      setPriority(0);
      setHasVariants(false);
      setSimplePrice(0);
      setSimpleSalePrice(undefined);
      setSimpleStock(0);
      setSimpleWeight(undefined);
      setVariants([{ name: "", price: 0, salePrice: undefined, stock: 0, weight: undefined }]);
      setBulkDiscountPercent(0);
      setErrors({});

      onProductAdded?.();
      onClose();
    } catch (error) {
      console.error("Error adding product:", error);
      showToast("პროდუქტის დამატება ვერ მოხერხდა", "error");
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
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <h2 className="text-xl font-semibold">ახალი პროდუქტის დამატება</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
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
                  შეავსეთ პროდუქტის მთავარი მონაცემები
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  პროდუქტის აღწერა
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
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
            </div>

            {/* ვარიანტების სისტემა */}
            <div className="space-y-5">
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      ფასი და მარაგი
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      აქვს თუ არა ამ პროდუქტს სხვადასხვა ვარიანტები? (ზომა,
                      ტიპი, ფერი)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        hasVariants
                          ? "text-gray-500"
                          : "text-emerald-600 font-medium"
                      }`}
                    >
                      მარტივი
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span
                      className={`text-sm ${
                        hasVariants
                          ? "text-emerald-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      ვარიანტებით
                    </span>
                  </div>
                </div>
              </div>

              {/* მარტივი პროდუქტი (ვარიანტების გარეშე) */}
              {!hasVariants && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-3">
                        მარტივი პროდუქტი
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
                            🏷️ ფასდაკლებული ფასი (₾)
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
              )}

              {/* ვარიანტები */}
              {hasVariants && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        პროდუქტის ვარიანტები
                      </h4>
                      <p className="text-sm text-gray-600">
                        ვარიანტებისთვის განსხვავებული ფასები და მარაგი
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      ვარიანტის დამატება
                    </button>
                  </div>

                  {errors.variants && (
                    <p className="text-red-500 text-sm">{errors.variants}</p>
                  )}
                  {errors.variantNames && (
                    <p className="text-red-500 text-sm">
                      {errors.variantNames}
                    </p>
                  )}

                

                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">
                            ვარიანტი #{index + 1}
                          </h5>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Variant Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ვარიანტის სახელი{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) =>
                                updateVariant(index, "name", e.target.value)
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                errors[`variant_${index}_name`]
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                              placeholder="მაგ: 500მლ"
                            />
                            {errors[`variant_${index}_name`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`variant_${index}_name`]}
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ფასი (₾) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.price === 0 ? "" : variant.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateVariant(index, "price", 0);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    updateVariant(index, "price", numValue);
                                  }
                                }
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                errors[`variant_${index}_price`]
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                              placeholder="0.00"
                            />
                            {errors[`variant_${index}_price`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`variant_${index}_price`]}
                              </p>
                            )}
                          </div>

                          {/* Sale Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ფასდაკლებული ფასი (₾)
                              <span className="text-xs text-gray-500 ml-1">
                                (არასავალდებულო)
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.salePrice === undefined || variant.salePrice === 0 ? "" : variant.salePrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateVariant(index, "salePrice", undefined);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    updateVariant(index, "salePrice", numValue);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="მაგ: 8.50"
                            />
                            {variant.salePrice &&
                              variant.salePrice >= variant.price && (
                                <p className="text-orange-600 text-xs mt-1">
                                  ფასდაკლებული ფასი ძირითად ფაზე ნაკლები უნდა
                                  იყოს
                                </p>
                              )}
                            {variant.salePrice &&
                              variant.price > 0 &&
                              variant.salePrice < variant.price && (
                                <p className="text-green-600 text-xs mt-1">
                                  ფასდაკლება:{" "}
                                  {Math.round(
                                    ((variant.price - variant.salePrice) /
                                      variant.price) *
                                      100
                                  )}
                                  %
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Stock */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              მარაგი <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock === 0 ? "" : variant.stock}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateVariant(index, "stock", 0);
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue)) {
                                    updateVariant(index, "stock", numValue);
                                  }
                                }
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                errors[`variant_${index}_stock`]
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                              placeholder="0"
                            />
                            {errors[`variant_${index}_stock`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`variant_${index}_stock`]}
                              </p>
                            )}
                          </div>

                          {/* Weight */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ⚖️ წონა (გრ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.weight === undefined ? "" : variant.weight}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateVariant(index, "weight", undefined);
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue)) {
                                    updateVariant(index, "weight", numValue);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="არასავალდებულო"
                            />
                          </div>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              "ემატება..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                პროდუქტის შენახვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductDrawer;
