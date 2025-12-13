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
      }
      setIsFetching(false);
    };

    loadProduct();
  }, [id, getProductById]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    if (product.stock > 0) {
      showToast(`${quantity} x ${product.name} კალათაში დაემატა!`, "success");
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
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

  const isOutOfStock = product.stock === 0;
  const totalPrice = product.price * quantity;

  return (
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
                {isOutOfStock && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    მარაგში არ არის
                  </div>
                )}
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
                  {product.stock > 0 && product.stock < 5 && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                      დარჩენილია: {product.stock}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900 mb-4 leading-tight">
                  {product.name}
                </h1>

                {/* Desktop Price View */}
                <div className="hidden md:block mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-emerald-700">
                      ₾{product.price}
                    </span>
                    {quantity > 1 && (
                      <span className="text-stone-400 font-medium">
                        x {quantity} ცალი
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Price View */}
                <div className="md:hidden mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">ერთეულის ფასი</p>
                    <span className="text-2xl font-bold text-emerald-700">
                      ₾{product.price}
                    </span>
                  </div>
                  {!isOutOfStock && (
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
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 flex items-center justify-center text-stone-600 disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="prose prose-stone prose-sm md:prose-base max-w-none mb-8 text-stone-600 leading-relaxed">
                  <p>{product.description}</p>
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
                      disabled={quantity >= product.stock}
                      className="w-12 h-full flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-5 h-5 text-stone-600" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-stone-900 hover:bg-emerald-600 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isOutOfStock ? (
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
            <span className="text-xs text-stone-500 font-medium">
              ჯამური ფასი
            </span>
            <span className="text-xl font-bold text-emerald-700">
              ₾{totalPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 bg-stone-900 active:bg-emerald-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:bg-stone-300"
          >
            {isOutOfStock ? (
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
  );
};

export default ProductDetailsPage;