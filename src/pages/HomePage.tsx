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
  Filter,
  X,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { showToast } from "../components/ui/Toast";
import { hasDiscount, getDiscountText } from "../utils/discount";
import {
  getStockText,
  getStockColorClassesCompact,
  getStockStatus,
  getStockMessage,
} from "../utils/stock";
import SEOHead from "../components/SEOHead";

// ფოტოები: სამზარეულო, ხე, კერამიკა, ეკო-ნივთები (არა ავეჯი)
const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop",
    title: "LifeStore - ჰარმონია დეტალებში",
    subtitle: "შექმენი ჯანსაღი და ესთეტიური გარემო შენს სამზარეულოში",
  },
  {
    url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop",
    title: "ჯანმრთელობისთვის უვნებელი",
    subtitle: "უმაღლესი ხარისხის, ეკო-მეგობრული მასალები შენი ოჯახისთვის",
  },
  {
    url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=2032&auto=format&fit=crop",
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
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

  const clearFilters = () => {
    setSelectedFilter("all");
    setSearchTerm("");
    setIsFilterOpen(false);
  };

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
        <section className="relative h-[400px] lg:h-[520px] w-full overflow-hidden">
          {HERO_IMAGES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              {/* გრადიენტი ტექსტისთვის */}
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ))}

          <div className="absolute inset-0 flex items-center justify-center text-center mt-6">
            <div className="max-w-4xl px-4 animate-fade-in-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs lg:text-sm font-medium tracking-widest uppercase mb-4">
                Premium Home & Kitchen
              </span>
              <h1 className="text-3xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
                {HERO_IMAGES[currentSlide].title}
              </h1>
              <p className="text-base lg:text-xl text-stone-100 mb-8 font-light max-w-2xl mx-auto drop-shadow-md">
                {HERO_IMAGES[currentSlide].subtitle}
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-white text-stone-900 px-8 py-3.5 rounded-full font-bold hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-xl hover:shadow-emerald-500/20 active:scale-95"
              >
                ნახე კოლექცია <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/40 w-2 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </section>

        {/* --- BRAND VALUES (ნიშა) --- */}
        <section className="py-10 bg-white border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
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
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header & Filter Bar */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                  <span className="text-emerald-600 font-medium text-sm tracking-wider uppercase mb-2 block">
                    ჩვენი კოლექცია
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-bold text-stone-900">
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
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="ძებნა პროდუქტების დასახელებით..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Filter Button & Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                        selectedFilter !== "all" || isFilterOpen
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedFilter === "popular"
                          ? "პოპულარული"
                          : selectedFilter === "discounts"
                          ? "ფასდაკლებები"
                          : selectedFilter === "new"
                          ? "ახალი"
                          : "ფილტრი"}
                      </span>
                    </button>

                    {/* Dropdown */}
                    {isFilterOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
                        <div className="p-3 border-b border-stone-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-stone-900">
                              ფილტრები
                            </span>
                            {(selectedFilter !== "all" || searchTerm) && (
                              <button
                                onClick={clearFilters}
                                className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                გაასუფთავე
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-2">
                          {[
                            {
                              value: "all",
                              label: "ყველა პროდუქტი",
                              count: products.filter(
                                (p) => p.isActive !== false
                              ).length,
                            },
                            {
                              value: "popular",
                              label: "პოპულარული",
                              count: products.filter(
                                (p) =>
                                  p.isActive !== false && p.priority === 100
                              ).length,
                            },
                            {
                              value: "discounts",
                              label: "ფასდაკლებები",
                              count: products.filter(
                                (p) => p.isActive !== false && hasDiscount(p)
                              ).length,
                            },
                            {
                              value: "new",
                              label: "ახალი დამატებული",
                              count: products.filter(
                                (p) => p.isActive !== false
                              ).length,
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedFilter(option.value);
                                setIsFilterOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                                selectedFilter === option.value
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "hover:bg-stone-50 text-stone-700"
                              }`}
                            >
                              <span className="text-sm">{option.label}</span>
                              <span className="text-xs text-stone-400">
                                {option.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    ყველას ნახვა
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-8">
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
                      <div className="p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-stone-900 text-sm lg:text-base line-clamp-2 leading-snug hover:text-emerald-700 transition-colors mb-2">
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
                            {hasDiscount(product) ? (
                              <>
                                <span className="text-sm text-stone-400 line-through">
                                  ₾{product.originalPrice}
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  ₾{product.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-emerald-700">
                                ₾{product.price}
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
