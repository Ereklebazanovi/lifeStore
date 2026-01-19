// src/pages/ProductDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Check,
  X,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { useInventoryRefresh } from "../hooks/useInventoryRefresh";
import { showToast } from "../components/ui/Toast";
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // ✅ Real-time inventory refresh კრიტიკული პროდუქტის გვერდზე
  useInventoryRefresh({ enabled: true, interval: 40000 }); // 40 წამი

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

        // Auto-select first available variant
        if (data.hasVariants && data.variants && data.variants.length > 0) {
          const firstAvailableVariant = data.variants.find(
            (v) => v.isActive && v.stock > 0
          );
          if (firstAvailableVariant) {
            setSelectedVariantId(firstAvailableVariant.id);
          } else {
            setSelectedVariantId(data.variants[0].id);
          }
        }
      }
      setIsFetching(false);
    };

    loadProduct();
  }, [id, getProductById]);

  // --- LOGIC HELPERS ---
  const getSelectedVariant = () => {
    if (!product?.hasVariants || !product.variants || !selectedVariantId) {
      return null;
    }
    return product.variants.find((v) => v.id === selectedVariantId) || null;
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariant();
    if (variant) {
      return variant.salePrice && variant.salePrice < variant.price
        ? variant.salePrice
        : variant.price;
    }
    if (product) {
      return product.salePrice && product.salePrice < product.price
        ? product.salePrice
        : product.price || 0;
    }
    return 0;
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
    if (product) {
      return product.salePrice && product.salePrice < product.price;
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

  const getCurrentWeight = () => {
    const variant = getSelectedVariant();
    if (variant && variant.weight !== undefined) {
      return variant.weight;
    }
    return product?.weight;
  };

  const isOutOfStock = () => {
    return getCurrentStock() <= 0;
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentStock = getCurrentStock();
    const selectedVariant = getSelectedVariant();

    if (product.hasVariants && !selectedVariant) {
      showToast("გთხოვთ აირჩიოთ ვარიანტი", "error");
      return;
    }

    if (currentStock <= 0) {
      showToast("პროდუქტი მარაგში არ არის", "error");
      return;
    }

    if (quantity > currentStock) {
      showToast(`მარაგში მხოლოდ ${currentStock} ცალია`, "error");
      return;
    }

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

  const handleShare = () => {
    if (!product) return;

    // Different URLs for different purposes
    const regularUrl = `https://lifestore.ge/product/${product.id}`;
    const facebookUrl = `https://lifestore.ge/api/og/${product.id}`; // Special URL for Facebook bot
    const shareText = `🛍️ ${product.name}\n💰 ₾${getCurrentPrice().toFixed(2)}\n\n📦 Life Store - ეკომეგობრული სახლის ნივთები`;

    // Enhanced Facebook Share URL with detailed quote + cache buster
    const cacheBuster = Date.now(); // Current timestamp to bust Facebook cache
    const shareUrl = `https://lifestore.ge/product/${product.id}?v=${cacheBuster}`;

    const detailedQuote = `🛍️ ${product.name}
💰 ფასი: ₾${getCurrentPrice().toFixed(2)}${hasCurrentDiscount() ? ` (ფასდაკლება ${Math.round(((getOriginalPrice() - getCurrentPrice()) / getOriginalPrice()) * 100)}%)` : ''}
📦 კატეგორია: ${product.category}${getCurrentWeight() ? `\n⚖️ წონა: ${getCurrentWeight()}გრ` : ''}

${product.description}

🌿 Life Store - ეკომეგობრული სახლის ნივთები
🚚 უფასო მიწოდება თბილისში
🛒 შეუკვეთეთ ახლავე: https://lifestore.ge/product/${product.id}`;

    const facebookParams = new URLSearchParams({
      u: shareUrl, // Use cache-busting URL
      quote: detailedQuote,
    });
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?${facebookParams.toString()}`;

    // WhatsApp Share URL with regular URL
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${regularUrl}`)}`;

    // Native Share API (Mobile)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator.share({
        title: shareText,
        url: regularUrl,
      }).catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to Facebook
        window.open(facebookShareUrl, '_blank', 'width=600,height=400');
      });
    } else {
      // Desktop - show share modal
      setIsShareModalOpen(true);
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">
          პროდუქტი ვერ მოიძებნა
        </h2>
        <Link
          to="/products"
          className="text-emerald-600 font-medium hover:underline"
        >
          პროდუქტებში დაბრუნება
        </Link>
      </div>
    );
  }

  const outOfStock = isOutOfStock();
  const totalPrice = getCurrentPrice() * quantity;
  const currentStock = getCurrentStock();

  // Discount Calculation Percentage
  const discountPercent = Math.round(
    ((getOriginalPrice() - getCurrentPrice()) / getOriginalPrice()) * 100
  );

  return (
    <>
      <SEOHead
        title={`${product.name} - ₾${getCurrentPrice().toFixed(2)} | Life Store`}
        description={`${product.description.slice(0, 140)}`}
        keywords={`${product.name}, ეკო პროდუქტები, ${product.category}`}
        ogImage={product.images?.[0] || "https://lifestore.ge/Screenshot 2025-12-10 151703.png"}
        ogType="product"
        canonicalUrl={`https://lifestore.ge/product/${product.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": product.images?.[0] || "",
          "offers": {
            "@type": "Offer",
            "price": getCurrentPrice(),
            "priceCurrency": "GEL",
            "availability": isOutOfStock() ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
          },
          "brand": {
            "@type": "Brand",
            "name": "Life Store"
          }
        }}
      />

      <div className="min-h-screen bg-white lg:bg-[#F8FAFC] pb-32 lg:pb-16">
        {/* --- MOBILE HEADER (Sticky) --- */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-stone-900 truncate max-w-[200px] text-sm">
            {product.name}
          </span>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-0 lg:px-8 lg:pt-8">
          {/* DESKTOP BREADCRUMB */}
          <div className="hidden lg:flex items-center gap-2 mb-6 text-sm text-stone-500 font-medium">
            <Link to="/" className="hover:text-stone-900 transition-colors">
              მთავარი
            </Link>
            <span className="text-stone-300">/</span>
            <Link
              to="/products"
              className="hover:text-stone-900 transition-colors"
            >
              პროდუქტები
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-emerald-600 truncate max-w-[300px]">
              {product.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 bg-white lg:rounded-3xl lg:shadow-sm lg:border border-stone-200 overflow-hidden">
            
            {/* --- LEFT COLUMN: IMAGES (Compact & Fixed Height) --- */}
            <div className="lg:col-span-7 bg-white relative">
               {/* Main Image Container */}
              <div className="relative w-full h-80 lg:h-96 bg-stone-50 flex items-center justify-center overflow-hidden group rounded-2xl lg:rounded-3xl border border-stone-100">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {outOfStock ? (
                    <span className="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      ამოწურულია
                    </span>
                  ) : hasCurrentDiscount() ? (
                    <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      -{discountPercent}%
                    </span>
                  ) : null}
                </div>

                {/* Zoom Icon */}
                {product.images && product.images.length > 0 && (
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="გადიდება"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                )}

                {product.images && product.images.length > 0 ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 lg:p-12 transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                ) : (
                  <Leaf className="w-20 h-20 text-emerald-200" />
                )}
              </div>

              {/* Image Gallery (Always show if images exist) */}
              {product.images && product.images.length > 0 && (
                <div className="border-t border-stone-100 bg-white">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        სურათები ({product.images.length}/4)
                      </h4>
                      {product.images.length > 1 && (
                        <span className="text-xs text-gray-500">
                          არჩეულია: {product.images.indexOf(selectedImage) + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                      {product.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img)}
                          className={`relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                            selectedImage === img
                              ? "border-emerald-500 ring-2 ring-emerald-100 opacity-100 transform scale-105"
                              : "border-stone-200 opacity-70 hover:opacity-100 hover:border-emerald-300 hover:scale-110"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} - სურათი ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                          {selectedImage === img && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- RIGHT COLUMN: INFO (Compact) --- */}
            <div className="lg:col-span-5 p-5 lg:p-10 lg:border-l border-stone-100 flex flex-col">
              
              {/* Stock & Category */}
              <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {product.category}
                  </span>
                  <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${outOfStock ? "text-red-600" : "text-emerald-700"}`}>
                          <div className={`w-2 h-2 rounded-full ${outOfStock ? "bg-red-500" : "bg-emerald-500"}`}></div>
                          <span>{outOfStock ? "მარაგში არ არის" : "მარაგშია"}</span>
                      </div>
                      {getCurrentWeight() && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
                              <span>⚖️ {getCurrentWeight()}გრ</span>
                          </div>
                      )}
                  </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 leading-tight mb-4 font-bpg-arial">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span
                  className={`text-3xl lg:text-4xl font-bold tracking-tight ${
                    hasCurrentDiscount() ? "text-red-600" : "text-stone-900"
                  }`}
                >
                  ₾{getCurrentPrice().toFixed(2)}
                </span>
                {hasCurrentDiscount() && (
                  <span className="text-lg text-stone-400 line-through font-medium">
                    ₾{getOriginalPrice().toFixed(2)}
                  </span>
                )}
              </div>

              {/* Variants (More compact) */}
              {product.hasVariants &&
                product.variants &&
                product.variants.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-stone-700 mb-2.5">
                      აირჩიეთ ვარიანტი:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants
                        .filter((variant) => variant.isActive)
                        .map((variant) => {
                          const isSelected = selectedVariantId === variant.id;
                          const isDisabled = variant.stock <= 0;
                          return (
                            <button
                              key={variant.id}
                              onClick={() => {
                                setSelectedVariantId(variant.id);
                                setQuantity(1);
                              }}
                              disabled={isDisabled}
                              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center gap-2
                                ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600"
                                    : isDisabled
                                    ? "border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed"
                                    : "border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:text-emerald-600"
                                }`}
                            >
                              <div className="flex flex-col items-center text-center">
                                <span>{variant.name}</span>
                                {variant.weight && (
                                  <span className="text-xs text-stone-500">⚖️ {variant.weight}გრ</span>
                                )}
                              </div>
                              {isSelected && !isDisabled && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Description */}
              <div className="prose prose-stone prose-sm max-w-none text-stone-600 mb-6 leading-relaxed line-clamp-5 hover:line-clamp-none transition-all">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>

              {/* Features List (Very Compact) */}
              <ul className="space-y-2 mb-6 bg-stone-50 p-4 rounded-xl border border-stone-100 text-sm text-stone-700 font-medium">
                  <li className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600" /> 100% ეკომეგობრული
                  </li>
                   <li className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" /> უფასო მიწოდება თბილისში
                  </li>
                   <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> ხარისხის გარანტია
                  </li>
              </ul>

              {/* Desktop Share Button */}
              <div className="hidden lg:flex items-center justify-center mb-6">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-lg transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>გაზიარება</span>
                </button>
              </div>

              {/* Desktop Add to Cart */}
              <div className="hidden lg:flex items-center gap-4 mt-auto">
                <div className="flex items-center bg-stone-100 rounded-xl h-14 p-1">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-12 h-full flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-emerald-600 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-xl text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= currentStock}
                    className="w-12 h-full flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-emerald-600 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`flex-1 h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95
                            ${
                              outOfStock
                                ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                                : "bg-stone-900 hover:bg-emerald-600 text-white shadow-stone-200 hover:shadow-emerald-200"
                            }`}
                >
                  {outOfStock ? (
                    "მარაგი ამოწურულია"
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

        {/* --- MOBILE STICKY ACTIONS --- */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-100 p-4 z-40 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 items-center">
            <div className="flex items-center bg-stone-100 rounded-lg h-12 px-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-10 h-full flex items-center justify-center text-stone-500 disabled:opacity-30"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-bold text-lg text-stone-900">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= currentStock}
                className="w-10 h-full flex items-center justify-center text-stone-500 disabled:opacity-30"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95
                        ${
                          outOfStock
                            ? "bg-stone-200 text-stone-400"
                            : "bg-stone-900 text-white"
                        }`}
            >
              {outOfStock ? (
                "ამოწურულია"
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>დამატება</span>
                    <span className="text-[10px] opacity-80">
                      ₾{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">{product?.name}</h3>
                <p className="text-sm opacity-75">
                  სურათი {(product?.images?.indexOf(selectedImage) || 0) + 1} / {product?.images?.length || 0}
                </p>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image - Limited Height */}
            <div className="flex-1 flex items-center justify-center min-h-0 py-4">
              <img
                src={selectedImage}
                alt={product?.name || ""}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Thumbnails Navigation - Always Visible at Bottom */}
            {product?.images && product.images.length > 1 && (
              <div className="p-4 border-t border-white/20 flex-shrink-0">
                <div className="flex gap-2 justify-center overflow-x-auto">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 overflow-hidden transition-all ${
                        selectedImage === img
                          ? "border-emerald-400 opacity-100 scale-105"
                          : "border-white/30 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">გაზიარება</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-1">{product?.name}</h4>
              <p className="text-sm text-gray-600">₾{getCurrentPrice().toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (!product) return;
                  const cacheBuster = Date.now();
                  const shareUrl = `https://lifestore.ge/product/${product.id}?v=${cacheBuster}`;
                  const detailedQuote = `🛍️ ${product.name}
💰 ფასი: ₾${getCurrentPrice().toFixed(2)}${hasCurrentDiscount() ? ` (ფასდაკლება ${Math.round(((getOriginalPrice() - getCurrentPrice()) / getOriginalPrice()) * 100)}%)` : ''}
📦 კატეგორია: ${product.category}${getCurrentWeight() ? `\n⚖️ წონა: ${getCurrentWeight()}გრ` : ''}

${product.description}

🌿 Life Store - ეკომეგობრული სახლის ნივთები
🚚 უფასო მიწოდება თბილისში
🛒 შეუკვეთეთ ახლავე: https://lifestore.ge/product/${product.id}`;

                  const facebookParams = new URLSearchParams({
                    u: shareUrl,
                    quote: detailedQuote,
                  });
                  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?${facebookParams.toString()}`;
                  window.open(facebookShareUrl, '_blank', 'width=600,height=400');
                  setIsShareModalOpen(false);
                }}
                className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">Facebook</span>
              </button>

              <button
                onClick={() => {
                  const shareText = `🛍️ ${product?.name}\n💰 ₾${getCurrentPrice().toFixed(2)}\n\n📦 Life Store - ეკომეგობრული სახლის ნივთები`;
                  const regularUrl = `https://lifestore.ge/product/${product?.id}`;
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${regularUrl}`)}`;
                  window.open(whatsappUrl, '_blank');
                  setIsShareModalOpen(false);
                }}
                className="flex items-center gap-3 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  const regularUrl = `https://lifestore.ge/product/${product?.id}`;
                  navigator.clipboard.writeText(regularUrl);
                  showToast("ლინკი დაკოპირდა!", "success");
                  setIsShareModalOpen(false);
                }}
                className="flex items-center gap-3 p-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">ლინკის კოპირება</span>
              </button>

              <button
                onClick={() => {
                  const shareText = `🛍️ ${product?.name}\n💰 ₾${getCurrentPrice().toFixed(2)}\n✅ მარაგშია ${getCurrentStock()} ცალი\n\n📦 Life Store - ეკომეგობრული სახლის ნივთები`;
                  const regularUrl = `https://lifestore.ge/product/${product?.id}`;
                  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(regularUrl)}&text=${encodeURIComponent(shareText)}`;
                  window.open(telegramUrl, '_blank');
                  setIsShareModalOpen(false);
                }}
                className="flex items-center gap-3 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="font-medium">Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailsPage;