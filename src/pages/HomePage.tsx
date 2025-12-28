import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ShoppingCart,
  Truck,
  ShieldCheck,
  ArrowRight,
  Star,
  CheckCircle,
  Facebook,
  Instagram,
  Utensils,
  Search,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { showToast } from "../components/ui/Toast";
import { hasDiscount, getDiscountText } from "../utils/discount";
import {
  getProductDisplayPrice,
  getProductOriginalDisplayPrice,
  hasDiscount as hasProductDiscount,
} from "../utils/productHelpers";
import {
  getStockText,
  getStockColorClassesCompact,
  getStockStatus,
  getStockMessage,
} from "../utils/stock";
import SEOHead from "../components/SEOHead";

// ფოტოები: სამზარეულო, ხე, კერამიკა, ეკო-ნივთები (არა ავეჯი) - ოპტიმიზებული ზომები
const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=75&w=1200&auto=format&fit=crop",
    title: "LifeStore - ჰარმონია დეტალებში",
    subtitle: "შექმენი ჯანსაღი და ესთეტიური გარემო შენს სამზარეულოში",
  },
  {
    url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=75&w=1200&auto=format&fit=crop",
    title: "ჯანმრთელობისთვის უვნებელი",
    subtitle: "უმაღლესი ხარისხის, ეკო-მეგობრული მასალები შენი ოჯახისთვის",
  },
  {
    url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=75&w=1200&auto=format&fit=crop",
    title: "თანამედროვე დიზაინი",
    subtitle: "დახვეწილი აქსესუარები, რომლებიც ალამაზებენ ყოველდღიურობას",
  },
];

const HomePage: React.FC = () => {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { addItem } = useCartStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
    // Hero images preloading
    HERO_IMAGES.forEach((image) => {
      const img = new Image();
      img.src = image.url;
    });
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (product: any) => {
    // შევამოწმოთ მარაგი
    const stockMessage = getStockMessage(product, 1, 0);
    if (stockMessage) {
      showToast(stockMessage, "error");
      return;
    }

    addItem(product);
    showToast(`${product.name} კალათაში დაემატა!`, "success");
  };

  // ფილტრაცია და ძებნა
  const getFilteredProducts = () => {
    let filtered = products.filter((product) => product.isActive !== false);

    // ძებნა
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ფილტრი
    switch (selectedFilter) {
      case "popular":
        return filtered.filter((product) => product.priority === 100);
      case "discounts":
        return filtered.filter((product) => hasDiscount(product));
      case "new":
        return [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
      case "all":
      default:
        return filtered;
    }
  };

  const filteredProducts = getFilteredProducts();

  // Structured data for homepage
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Life Store",
    url: "https://lifestore.ge",
    logo: "https://lifestore.ge/Screenshot 2025-12-10 151703.png",
    description:
      "Life Store - თანამედროვე დიზაინისა და ჯანმრთელობისთვის უვნებელი ეკომეგობრული სახლისა და სამზარეულოს ნივთები",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GE",
    },
    sameAs: [
      "https://facebook.com/lifestore",
      "https://instagram.com/lifestore",
    ],
  };

  return (
    <>
      <SEOHead
        title="Life Store - ჰარმონია დეტალებშია | ეკომეგობრული სახლის ნივთები"
        description="Life Store - თანამედროვე დიზაინისა და ჯანმრთელობისთვის უვნებელი ეკომეგობრული სახლისა და სამზარეულოს ნივთები. გახადე შენი სახლი კომფორტული და დახვეწილი სივრცე."
        keywords="ეკომეგობრული ნივთები, სახლის ნივთები, სამზარეულო, თანამედროვე დიზაინი, ჯანსაღი ცხოვრება, Life Store"
        canonicalUrl="https://lifestore.ge/"
        structuredData={organizationStructuredData}
      />
      <div className="min-h-screen bg-stone-50 overflow-x-hidden">
        {/* --- HERO SLIDER --- */}
        <section className="relative h-[450px] lg:h-[600px] w-full overflow-hidden">
          {/* Image Container with Preloader */}
          <div className="absolute inset-0">
            {HERO_IMAGES.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Fallback background color */}
                <div className="absolute inset-0 bg-stone-400" />

                <img
                  src={slide.url}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  onError={(e) => {
                    console.error("Image failed to load:", slide.url);
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 z-20" />
              </div>
            ))}
          </div>

          {/* Content Container - Better positioning */}
          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 z-20">
            <div className="max-w-5xl mx-auto space-y-4 lg:space-y-6">
              <span className="inline-block px-4 lg:px-6 py-2 lg:py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs lg:text-sm font-medium tracking-wider uppercase">
                Premium Home & Kitchen
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                {HERO_IMAGES[currentSlide].title}
              </h1>

              <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-white/95 font-light max-w-3xl mx-auto drop-shadow-lg leading-relaxed">
                {HERO_IMAGES[currentSlide].subtitle}
              </p>

              <div className="pt-4 lg:pt-6">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-3 bg-white text-stone-900 px-6 lg:px-10 py-3 lg:py-4 rounded-full font-bold text-sm lg:text-base hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-2xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                >
                  ნახე კოლექცია <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation Dots - Better positioned */}
          <div className="absolute bottom-6 lg:bottom-8 left-0 right-0 flex justify-center gap-3 z-30">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-500 rounded-full ${
                  index === currentSlide
                    ? "bg-white w-8 lg:w-10 h-2 lg:h-2.5 shadow-lg"
                    : "bg-white/50 w-2 lg:w-3 h-2 lg:h-2.5 hover:bg-white/80"
                }`}
                aria-label={`სლაიდზე გადასვლა ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* --- BRAND VALUES (ნიშა) --- */}
        <section className="py-6 lg:py-10 bg-white border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                  <Leaf className="w-6 h-6" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-bold text-stone-900 mb-1">
                    ეკო & უსაფრთხო
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    ჯანმრთელობისთვის უვნებელი, ეკოლოგიურად სუფთა მასალები.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="p-3.5 bg-stone-100 text-stone-700 rounded-2xl">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-bold text-stone-900 mb-1">
                    პრემიუმ ხარისხი
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    თანამედროვე დიზაინს მორგებული სამზარეულოს და სახლის ნივთები.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-bold text-stone-900 mb-1">
                    პირდაპირი იმპორტი
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    ჩვენ თვითონ ვახდენთ იმპორტს, რაც საუკეთესო ფასს
                    განაპირობებს.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- PRODUCTS SECTION --- */}
        <section className="py-8 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header & Filter Bar */}
            <div className="mb-6 lg:mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 lg:gap-6 mb-6 lg:mb-8">
                <div>
                  <span className="text-emerald-600 font-medium text-sm tracking-wider uppercase mb-2 block">
                    ჩვენი კოლექცია
                  </span>
                  <h2 className="text-xl lg:text-3xl font-bold text-stone-900">
                    {selectedFilter === "popular"
                      ? "პოპულარული ნივთები"
                      : selectedFilter === "discounts"
                      ? "ფასდაკლებები"
                      : selectedFilter === "new"
                      ? "ახალი დამატებული"
                      : "ყველა პროდუქტი"}
                  </h2>
                  {filteredProducts.length !==
                    products.filter((p) => p.isActive !== false).length && (
                    <p className="text-stone-500 text-sm mt-1">
                      ნაჩვენებია {filteredProducts.length} პროდუქტი{" "}
                      {products.filter((p) => p.isActive !== false).length}-დან
                    </p>
                  )}
                </div>
                <Link
                  to="/products"
                  className="text-stone-500 hover:text-emerald-600 font-medium flex items-center gap-2 group transition-colors"
                >
                  სრული კატალოგი{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Professional Filter Bar */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 lg:p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="ძებნა პროდუქტების დასახელებით..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm lg:text-base"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="grid grid-cols-2 lg:flex gap-2">
                    {[
                      {
                        value: "all",
                        label: "ყველა პროდუქტი",
                        shortLabel: "ყველა",
                        count: products.filter((p) => p.isActive !== false)
                          .length,
                      },
                      {
                        value: "popular",
                        label: "პოპულარული",
                        shortLabel: "პოპულარული",
                        count: products.filter(
                          (p) => p.isActive !== false && p.priority === 100
                        ).length,
                      },
                      {
                        value: "discounts",
                        label: "ფასდაკლებები",
                        shortLabel: "ფასდაკლება",
                        count: products.filter(
                          (p) => p.isActive !== false && hasDiscount(p)
                        ).length,
                      },
                      {
                        value: "new",
                        label: "ახალი დამატებული",
                        shortLabel: "ახალი",
                        count: products.filter((p) => p.isActive !== false)
                          .length,
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedFilter(option.value)}
                        className={`px-2 sm:px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg border transition-all text-xs lg:text-sm font-medium flex items-center justify-center gap-1 lg:gap-2 min-h-[40px] ${
                          selectedFilter === option.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                        }`}
                      >
                        <span className="truncate block sm:hidden">
                          {option.shortLabel}
                        </span>
                        <span className="truncate hidden sm:block">
                          {option.label}
                        </span>
                        <span className="text-xs bg-stone-100 text-stone-500 px-1 sm:px-1.5 lg:px-2 py-0.5 lg:py-1 rounded flex-shrink-0 min-w-[20px] text-center">
                          {option.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-80 animate-pulse border border-stone-100"
                  >
                    <div className="h-48 bg-stone-200 w-full"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-stone-200 w-3/4 rounded"></div>
                      <div className="h-4 bg-stone-200 w-1/2 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-stone-100">
                <Leaf className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-stone-900 mb-2">
                  {searchTerm
                    ? "ძებნის შედეგები ვერ მოიძებნა"
                    : "კოლექცია მალე განახლდება"}
                </h3>
                <p className="text-stone-500">
                  {searchTerm
                    ? `"${searchTerm}" მოძებნა შედეგების გარეშე`
                    : "პროდუქტები ემატება..."}
                </p>
                {(searchTerm || selectedFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedFilter("all");
                      setSearchTerm("");
                    }}
                    className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    ყველას ნახვა
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {filteredProducts.slice(0, 12).map((product) => {
                  const isOutOfStock = product.stock === 0;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-stone-100 hover:border-emerald-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      {/* Image Area */}
                      <Link
                        to={`/product/${product.id}`}
                        className="relative aspect-[4/5] overflow-hidden bg-stone-50"
                      >
                        {/* Badges */}
                        {isOutOfStock ? (
                          <div className="absolute top-3 left-3 z-10 bg-stone-900/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            ამოწურულია
                          </div>
                        ) : hasDiscount(product) ? (
                          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            {getDiscountText(product)}
                          </div>
                        ) : (
                          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> მარაგშია
                          </div>
                        )}

                        {/* Priority Badge */}
                        {product.priority === 100 && (
                          <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            TOP
                          </div>
                        )}

                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                              isOutOfStock ? "grayscale opacity-70" : ""
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Leaf className="w-10 h-10" />
                          </div>
                        )}

                        {/* Quick Add Button */}
                        {!isOutOfStock && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                            className="absolute bottom-4 right-4 w-11 h-11 bg-white text-stone-900 rounded-full shadow-lg flex items-center justify-center translate-y-20 group-hover:translate-y-0 transition-transform duration-300 hover:bg-emerald-600 hover:text-white"
                            title="კალათაში დამატება"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-3 lg:p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-stone-900 text-xs lg:text-base line-clamp-2 leading-snug hover:text-emerald-700 transition-colors mb-2">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Stock Status */}
                        <div className="mb-2">
                          <span
                            className={`text-xs font-medium ${getStockColorClassesCompact(
                              product
                            )}`}
                          >
                            {getStockText(product)}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasProductDiscount(product) ? (
                              <>
                                <span className="text-sm text-stone-400 line-through">
                                  {getProductOriginalDisplayPrice(product)}
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  {getProductDisplayPrice(product)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-emerald-700">
                                {getProductDisplayPrice(product)}
                              </span>
                            )}
                          </div>
                          <div className="flex text-yellow-400 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* --- SOCIAL BANNER --- */}
        <section className="py-16 bg-stone-700 text-white mt-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <Leaf className="w-10 h-10 text-emerald-500 mx-auto mb-5" />
            <h2 className="text-2xl lg:text-4xl font-bold mb-4">
              LifeStore - შენი სახლისთვის
            </h2>
            <p className="text-stone-400 mb-8 max-w-lg mx-auto">
              გამოგვყვევით სოციალურ ქსელებში, ნახეთ ახალი კოლექციები და მიიღეთ
              რჩევები სახლის მოწყობაზე.
            </p>
            <div className="flex justify-center gap-5">
              <a
                href="https://www.facebook.com/lifestore.ge"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-all font-medium"
              >
                <Facebook className="w-5 h-5" /> Facebook
              </a>
              <a
                href="https://www.instagram.com/lifestore.ge"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition-all font-medium"
              >
                <Instagram className="w-5 h-5" /> Instagram
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
