import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  Leaf,
  AlertCircle,
  Share2,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { showToast } from "../components/ui/Toast";
import { hasDiscount, getDiscountText } from "../utils/discount";
import {
  getStockText,
  getStockColorClasses,
  getStockStatus,
  canAddToCart,
  getStockMessage,
} from "../utils/stock";
import {
  getProductDisplayPrice,
  getProductOriginalDisplayPrice,
  hasDiscount as hasProductDiscount,
} from "../utils/productHelpers";
import SEOHead from "../components/SEOHead";
import type { Product } from "../types";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, isLoading } = useProductStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setIsFetching(true);
      const data = await getProductById(id);
      if (data) {
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }

        // Auto-select first available variant if product has variants
        if (data.hasVariants && data.variants && data.variants.length > 0) {
          const firstAvailableVariant = data.variants.find(
            (v) => v.isActive && v.stock > 0
          );
          if (firstAvailableVariant) {
            setSelectedVariantId(firstAvailableVariant.id);
          } else {
            // If no available variants, select the first one anyway
            setSelectedVariantId(data.variants[0].id);
          }
        }
      }
      setIsFetching(false);
    };

    loadProduct();
  }, [id, getProductById]);

  // Helper functions for variant support
  const getSelectedVariant = () => {
    if (!product?.hasVariants || !product.variants || !selectedVariantId) {
      return null;
    }
    return product.variants.find((v) => v.id === selectedVariantId) || null;
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariant();
    if (variant) {
      // Return sale price if available and less than regular price, otherwise regular price
      return variant.salePrice && variant.salePrice < variant.price
        ? variant.salePrice
        : variant.price;
    }
    return product?.price || 0;
  };

  const getOriginalPrice = () => {
    const variant = getSelectedVariant();
    if (variant) {
      return variant.price;
    }
    return product?.price || 0;
  };

  const hasCurrentDiscount = () => {
    const variant = getSelectedVariant();
    if (variant) {
      return variant.salePrice && variant.salePrice < variant.price;
    }
    return false;
  };

  const getCurrentStock = () => {
    const variant = getSelectedVariant();
    if (variant) {
      return variant.stock;
    }
    return product?.stock || 0;
  };

  const isOutOfStock = () => {
    return getCurrentStock() <= 0;
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentStock = getCurrentStock();
    const selectedVariant = getSelectedVariant();

    // Check if variant is required but not selected
    if (product.hasVariants && !selectedVariant) {
      showToast("გთხოვთ აირჩიოთ ვარიანტი", "error");
      return;
    }

    // Check stock
    if (currentStock <= 0) {
      showToast("პროდუქტი მარაგში არ არის", "error");
      return;
    }

    if (quantity > currentStock) {
      showToast(`მარაგში მხოლოდ ${currentStock} ცალია`, "error");
      return;
    }

    // Create cart item with variant info
    const cartItem = {
      ...product,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      price: getCurrentPrice(),
      stock: currentStock,
    };

    addItem(cartItem, quantity);

    const itemName = selectedVariant
      ? `${product.name} (${selectedVariant.name})`
      : product.name;

    showToast(`${quantity} x ${itemName} კალათაში დაემატა!`, "success");
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const currentStock = getCurrentStock();
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity);
    }
  };

  if (isFetching || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">
          პროდუქტი ვერ მოიძებნა
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="text-emerald-600 font-medium"
        >
          პროდუქტებში დაბრუნება
        </button>
      </div>
    );
  }

  const outOfStock = isOutOfStock();
  const totalPrice = getCurrentPrice() * quantity;

  // SEO data for product
  const productStructuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images || [],
    brand: {
      "@type": "Brand",
      name: "Life Store",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "GEL",
      availability: isOutOfStock()
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Life Store",
      },
    },
  };

  return (
    <>
      <SEOHead
        title={`${product.name} | Life Store - ეკომეგობრული სახლის ნივთები`}
        description={`${product.description.slice(
          0,
          150
        )}... - Life Store-ში შეიძინე ${product.name} მხოლოდ ${
          product.price
        }₾-ად. უფასო მიტანა თბილისში!`}
        keywords={`${product.name}, ${product.category}, ეკომეგობრული ნივთები, სახლის ნივთები, Life Store`}
        ogImage={
          product.images?.[0] ||
          "https://lifestore.ge/Screenshot 2025-12-10 151703.png"
        }
        ogType="product"
        canonicalUrl={`https://lifestore.ge/product/${product.id}`}
        structuredData={productStructuredData}
      />
      <div className="min-h-screen bg-white md:bg-stone-50 pb-28 md:pb-12 md:pt-8">
        {/* --- MOBILE HEADER (Sticky Top) --- */}
        <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-stone-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-stone-900 truncate max-w-[200px]">
            {product.name}
          </span>
          <button className="p-2 -mr-2 text-stone-700">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto md:px-6 lg:px-8">
          {/* DESKTOP BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="hidden md:flex items-center text-stone-500 hover:text-stone-900 transition-colors mb-6 group text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            უკან დაბრუნება
          </button>

          {/* --- MAIN CARD --- */}
          <div className="bg-white md:rounded-3xl md:shadow-sm md:border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* --- LEFT: IMAGE GALLERY --- */}
              <div className="bg-white md:border-r border-stone-100 relative">
                {/* Main Image Wrapper */}
                <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] flex items-center justify-center bg-stone-50/50">
                  {/* Badges */}
                  {isOutOfStock() ? (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      მარაგში არ არის
                    </div>
                  ) : hasCurrentDiscount() ? (
                    <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                      -
                      {Math.round(
                        ((getOriginalPrice() - getCurrentPrice()) /
                          getOriginalPrice()) *
                          100
                      )}
                      % ფასდაკლება
                    </div>
                  ) : null}
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-contain p-6 md:p-12 transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <Leaf className="w-16 h-16 text-emerald-200" />
                  )}
                </div>

                {/* Thumbnails (Scrollable on Mobile) */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto p-4 md:px-8 md:pb-8 scrollbar-hide border-b md:border-b-0 border-stone-100">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 overflow-hidden transition-all ${
                          selectedImage === img
                            ? "border-emerald-500 ring-2 ring-emerald-100"
                            : "border-stone-100 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* --- RIGHT: INFO SECTION --- */}
              <div className="p-5 md:p-8 lg:p-12 flex flex-col h-full">
                <div className="mb-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-lg">
                      {product.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg border ${getStockColorClasses(
                        product
                      )}`}
                    >
                      {getStockText(product)}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900 mb-4 leading-tight">
                    {product.name}
                  </h1>

                  {/* Variant Selector */}
                  {product.hasVariants &&
                    product.variants &&
                    product.variants.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          აირჩიეთ ვარიანტი:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.variants
                            .filter((variant) => variant.isActive)
                            .map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => {
                                  setSelectedVariantId(variant.id);
                                  setQuantity(1); // Reset quantity when variant changes
                                }}
                                disabled={variant.stock <= 0}
                                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                                  selectedVariantId === variant.id
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-200"
                                    : variant.stock <= 0
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-semibold">
                                    {variant.name}
                                  </div>
                                  <div className="text-xs mt-1">
                                    {variant.stock <= 0 ? (
                                      <div
                                        className={
                                          selectedVariantId === variant.id
                                            ? "text-red-200"
                                            : "text-red-500"
                                        }
                                      >
                                        არ არის
                                      </div>
                                    ) : variant.salePrice &&
                                      variant.salePrice < variant.price ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div
                                          className={`line-through ${
                                            selectedVariantId === variant.id
                                              ? "text-gray-300"
                                              : "text-gray-400"
                                          } text-[10px]`}
                                        >
                                          ₾{variant.price.toFixed(2)}
                                        </div>
                                        <div
                                          className={`font-bold ${
                                            selectedVariantId === variant.id
                                              ? "text-red-200"
                                              : "text-red-600"
                                          }`}
                                        >
                                          ₾{variant.salePrice.toFixed(2)}
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className={
                                          selectedVariantId === variant.id
                                            ? "text-emerald-100"
                                            : "text-emerald-600"
                                        }
                                      >
                                        ₾{variant.price.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Desktop Price View */}
                  <div className="hidden md:block mb-6">
                    <div className="flex items-baseline gap-3 mb-3">
                      {hasCurrentDiscount() ? (
                        <div className="flex flex-col">
                          <span className="text-lg text-stone-400 line-through">
                            ₾{getOriginalPrice().toFixed(2)}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-red-600">
                              ₾{getCurrentPrice().toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                              -
                              {Math.round(
                                ((getOriginalPrice() - getCurrentPrice()) /
                                  getOriginalPrice()) *
                                  100
                              )}
                              % დანაზოგი
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-4xl font-bold text-emerald-700">
                          ₾{getCurrentPrice().toFixed(2)}
                        </span>
                      )}
                      {quantity > 1 && (
                        <span className="text-stone-400 font-medium">
                          x {quantity} ცალი
                        </span>
                      )}
                    </div>

                    {/* Desktop Stock Information */}
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex items-center gap-1 ${
                          getCurrentStock() <= 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            getCurrentStock() <= 0
                              ? "bg-red-500"
                              : "bg-emerald-500"
                          }`}
                        ></span>
                        {getCurrentStock() <= 0
                          ? "მარაგში არ არის"
                          : `მარაგშია ${getCurrentStock()} ცალი`}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Price View */}
                  <div className="md:hidden mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">ერთეულის ფასი</p>
                      {hasCurrentDiscount() ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-stone-400 line-through">
                            ₾{getOriginalPrice().toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-red-600">
                            ₾{getCurrentPrice().toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-emerald-700">
                          ₾{getCurrentPrice().toFixed(2)}
                        </span>
                      )}
                    </div>

                    {!outOfStock && (
                      <div className="flex items-center bg-stone-100 rounded-xl p-1">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center text-stone-600 disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-stone-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= getCurrentStock()}
                          className="w-10 h-10 flex items-center justify-center text-stone-600 disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="prose prose-stone prose-sm md:prose-base max-w-none mb-8 text-stone-600 leading-relaxed">
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  </div>

                  {/* Features Grid - FIXED BOXES */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    {/* Box 1 */}
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 h-full">
                      <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm flex-shrink-0">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-bold text-stone-700">
                        100% ეკო
                      </span>
                    </div>

                    {/* Box 2 - Fixed for long text */}
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 h-full">
                      <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm flex-shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm font-bold text-stone-700 leading-tight">
                          უფასო მიტანა თბილისში
                        </span>
                        <span className="text-[10px] md:text-xs text-stone-500 mt-0.5">
                          რეგიონებში (7₾)
                        </span>
                      </div>
                    </div>

                    {/* Box 3 */}
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 h-full">
                      <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-bold text-stone-700">
                        ხარისხის გარანტია
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- DESKTOP ACTION AREA --- */}
                <div className="hidden md:flex items-center gap-4 pt-6 border-t border-stone-100 mt-auto">
                  {!isOutOfStock && (
                    <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl h-14 px-2">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-12 h-full flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-5 h-5 text-stone-600" />
                      </button>
                      <span className="w-12 text-center font-bold text-xl text-stone-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= getCurrentStock()}
                        className="w-12 h-full flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-5 h-5 text-stone-600" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className="flex-1 bg-stone-900 hover:bg-emerald-600 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {outOfStock ? (
                      <span>მარაგი ამოწურულია</span>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>დამატება — ₾{totalPrice.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MOBILE STICKY BOTTOM BAR --- */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 p-4 safe-area-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-4">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
                <span>ჯამური ფასი</span>
                <span className="w-1 h-1 bg-stone-400 rounded-full"></span>
                <span>მარაგი: {getCurrentStock()} ცალი</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">
                ₾{totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock()}
              className="flex-1 bg-stone-900 active:bg-emerald-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:bg-stone-300"
            >
              {isOutOfStock() ? (
                <span className="text-sm">ამოწურულია</span>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>დამატება</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailsPage;
