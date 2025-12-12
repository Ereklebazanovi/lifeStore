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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-stone-400 mb-4" />
        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          პროდუქტი ვერ მოიძებნა
        </h2>
        <Link
          to="/products"
          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          დაბრუნება პროდუქტებში
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  // დინამიური ფასის კალკულაცია
  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen bg-stone-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-stone-600 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          უკან დაბრუნება
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* LEFT SIDE: Images Gallery */}
            <div className="p-6 lg:p-10 bg-white">
              {/* Main Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-stone-50 mb-4 border border-stone-100 relative">
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                      მარაგში არ არის
                    </span>
                  </div>
                )}
                {product.images && product.images.length > 0 ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply p-8" // Added p-8 for breathing room
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf className="w-20 h-20 text-emerald-200" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                        selectedImage === img
                          ? "border-emerald-500 ring-2 ring-emerald-100 opacity-100"
                          : "border-stone-200 hover:border-emerald-300 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Product Info - IMPROVED LAYOUT */}
            <div className="p-6 lg:p-10 bg-stone-50/30 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-stone-200">
              <div className="mb-auto">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide rounded-full">
                    {product.category}
                  </span>
                  {product.stock > 0 && product.stock < 5 && (
                    <span className="text-xs font-medium text-orange-600 flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      ბოლო {product.stock} ერთეული
                    </span>
                  )}
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-6 leading-tight">
                  {product.name}
                </h1>

                {/* Price Section - BIGGER & DYNAMIC */}
                <div className="flex flex-col mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-sm text-stone-500 font-medium mb-1">
                    ჯამური ღირებულება
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-emerald-700">
                      ₾{totalPrice.toFixed(2)}
                    </span>
                    {quantity > 1 && (
                      <span className="text-stone-400 text-sm font-medium">
                        (₾{product.price} / ცალი)
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose prose-stone max-w-none mb-10">
                  <p className="text-stone-600 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-stone-700 font-medium">
                    <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <span>100% ეკოლოგიურად სუფთა</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-700 font-medium">
                    <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span>მიწოდება მთელ საქართველოში</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-700 font-medium">
                    <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span>ხარისხის გარანტია</span>
                  </div>
                </div>
              </div>

              {/* Action Area - IMPROVED UI */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mt-6 lg:mt-0">
                {isOutOfStock ? (
                  <div className="text-center py-2">
                    <p className="text-red-500 font-bold text-lg">
                      პროდუქტი დროებით ამოწურულია
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 !mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-stone-900 font-semibold">
                        რაოდენობა:
                      </span>
                      {/* Quantity Selector - Bigger & Better */}
                      <div className="flex items-center border-2 border-stone-200 rounded-xl">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-12 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-l-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center font-bold text-xl text-stone-900 border-x border-stone-200 py-1 bg-stone-50">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.stock}
                          className="w-12 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-r-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button - Wide & Bold */}
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-stone-900 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-lg"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      <span>კალათაში დამატება</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
