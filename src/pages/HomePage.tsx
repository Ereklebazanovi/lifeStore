// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ArrowRight,
  Star,
  CheckCircle,
  Facebook,
  Instagram,
  Utensils,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCategoryStore } from "../store/categoryStore";
import { showToast } from "../components/ui/Toast";
import { hasDiscount, getDiscountText } from "../utils/discount";
import {
  getProductDisplayPrice,
  getProductOriginalDisplayPrice,
  hasDiscount as hasProductDiscount,
} from "../utils/productHelpers";
import { getStockText, getStockColorClassesCompact } from "../utils/stock";
import SEOHead from "../components/SEOHead";
import CategoryGrid from "../components/CategoryGrid";

// HERO_IMAGE_CONFIG - ერთი მთავარი ფოტო
// როცა ახალ ფოტოს მიიღებთ, ჩააგდეთ src/assets/hero.jpg და გამოიყენეთ:
// import heroImg from "../assets/hero.jpg";
// url: heroImg
const HERO_IMAGE_CONFIG = {
  url: "/hero.png",
  title: "LifeStore - ჰარმონია დეტალებში",
  subtitle: "შექმენი ჯანსაღი და ესთეტიური გარემო შენს სამზარეულოში",
};

const HomePage: React.FC = () => {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { categories: categoryObjects, fetchCategories } = useCategoryStore();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(12);

  // პრიორიტეტის მიხედვით დალაგებული კატეგორიების სია
  const sortedCategories = categoryObjects
    .filter((cat) => cat.isActive !== false) // მხოლოდ აქტიური კატეგორიები
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)) // მაღალი priority პირველი
    .map((cat) => cat.name); // მხოლოდ სახელები


  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // Preload hero image
    const img = new Image();
    img.src = HERO_IMAGE_CONFIG.url;
  }, [fetchProducts, fetchCategories]);

  const getFilteredProducts = () => {
    let filtered = products.filter((product) => product.isActive !== false);

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productCode && product.productCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
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
  const hasMoreProducts = filteredProducts.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 12);
  };

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(12);
  }, [selectedFilter, selectedCategory, searchTerm]);

  // Helper to count items for filters
  const getCount = (type: string) => {
    const activeProducts = products.filter((p) => p.isActive !== false);
    switch (type) {
      case "all":
        return activeProducts.length;
      case "popular":
        return activeProducts.filter((p) => p.priority === 100).length;
      case "discounts":
        return activeProducts.filter((p) => hasDiscount(p)).length;
      case "new":
        return activeProducts.length; // Simplified for demo
      default:
        return 0;
    }
  };

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

  const filterOptions = [
    { value: "all", label: "ყველა" },
    { value: "popular", label: "პოპულარული" },
    { value: "discounts", label: "ფასდაკლება" },
    { value: "new", label: "ახალი" },
  ];

  return (
    <>
      <SEOHead
        title="Life Store - ჰარმონია დეტალებშია | ეკომეგობრული სახლის ნივთები"
        description="Life Store - თანამედროვე დიზაინისა და ჯანმრთელობისთვის უვნებელი ეკომეგობრული სახლისა და სამზარეულოს ნივთები."
        keywords="ეკომეგობრული ნივთები, სახლის ნივთები, სამზარეულო, Life Store"
        canonicalUrl="https://lifestore.ge/"
        structuredData={organizationStructuredData}
      />
      <div className="min-h-screen bg-stone-50 overflow-x-hidden">
        {/* --- HERO --- */}
        <section className="w-full bg-white border-b border-stone-100 mt-[72px]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row">

            {/* Image — მობილურზე პირველი, desktop-ზე მარჯვნივ */}
            <div className="relative md:w-[55%] h-[200px] md:h-[300px] lg:h-[320px] overflow-hidden bg-stone-100 order-first md:order-last shrink-0">
              <img
                src={HERO_IMAGE_CONFIG.url}
                alt={HERO_IMAGE_CONFIG.title}
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* ტექსტი — მობილურზე მეორე, desktop-ზე მარცხნივ */}
            <div className="flex flex-col justify-center px-5 py-6 md:py-0 md:px-10 lg:px-16 md:w-[46%] lg:w-[42%] shrink-0 order-last md:order-first">
              <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-widest mb-2">
                Premium Home & Kitchen
              </span>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 leading-tight mb-2">
                {HERO_IMAGE_CONFIG.title}
              </h1>
              <p className="text-stone-500 text-sm lg:text-base leading-relaxed mb-5 max-w-sm">
                {HERO_IMAGE_CONFIG.subtitle}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all duration-300 shadow-sm active:scale-95"
                >
                  კოლექცია <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors"
                >
                  ჩვენ შესახებ
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* --- CATEGORIES GRID --- */}
        <CategoryGrid />

        {/* --- BRAND VALUES --- */}
        <section className="py-6 lg:py-10 bg-white border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center md:text-left">
              {[
                {
                  icon: Leaf,
                  title: "ეკო & უსაფრთხო",
                  text: "ჯანმრთელობისთვის უვნებელი, ეკოლოგიურად სუფთა მასალები.",
                  color: "bg-emerald-50 text-emerald-700",
                },
                {
                  icon: Utensils,
                  title: "პრემიუმ ხარისხი",
                  text: "თანამედროვე დიზაინს მორგებული სამზარეულოს და სახლის ნივთები.",
                  color: "bg-stone-100 text-stone-700",
                },
                {
                  icon: ShieldCheck,
                  title: "პირდაპირი იმპორტი",
                  text: "ვახდენთ პირდაპირ იმპორტს, რაც საუკეთესო ფასს განაპირობებს.",
                  color: "bg-blue-50 text-blue-700",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row items-center md:items-start gap-4"
                >
                  <div className={`p-3.5 rounded-2xl ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-stone-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRODUCTS SECTION --- */}
        <section className="py-8 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 lg:mb-8">
              <div>
                <span className="text-emerald-600 font-bold text-xs tracking-wider uppercase mb-2 block">
                  ჩვენი კოლექცია
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-stone-900">
                  აღმოაჩინე რჩეული ნივთები
                </h2>
              </div>
              <Link
                to="/products"
                className="hidden md:flex text-stone-500 hover:text-stone-900 font-medium items-center gap-2 group transition-colors text-sm"
              >
                სრული კატალოგი{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 🔥 IMPROVED MOBILE RESPONSIVE FILTER BAR 🔥 */}
            <div className="sticky top-0 z-20 md:static bg-stone-50 md:bg-transparent pb-4 md:pb-8 pt-2">
              <div className="flex flex-col gap-3">
                {/* Search Input - Mobile First */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ძებნა..."
                    className="w-full bg-white pl-10 pr-4 py-3 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm text-stone-900 placeholder:text-stone-400 transition-all shadow-sm"
                  />
                </div>

                {/* Filter Tabs - Better Mobile Spacing */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                  {filterOptions.map((option) => {
                    const isActive = selectedFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedFilter(option.value)}
                        className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 border flex-shrink-0
                                        ${
                                          isActive
                                            ? "bg-stone-900 text-white border-stone-900 shadow-md shadow-stone-200"
                                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                                        }`}
                      >
                        {option.label}
                        <span
                          className={`px-1 py-0.5 rounded-full text-[10px] font-bold min-w-[16px] text-center ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {getCount(option.value)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Category Filter - Mobile Optimized */}
                {sortedCategories.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-stone-700 px-2">კატეგორიები</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border flex-shrink-0
                                    ${
                                      selectedCategory === "all"
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                                    }`}
                      >
                        ყველა
                      </button>
                      {sortedCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border flex-shrink-0
                                      ${
                                        selectedCategory === category
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                                      }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    <div className="h-48 bg-stone-200 w-full rounded-t-2xl"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-stone-200 w-3/4 rounded"></div>
                      <div className="h-4 bg-stone-200 w-1/2 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 border-dashed">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-stone-300" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">
                  {searchTerm ? "ვერაფერი მოიძებნა" : "კოლექცია ცარიელია"}
                </h3>
                <p className="text-stone-500 text-sm">
                  {searchTerm
                    ? `სცადეთ სხვა სიტყვა ან შეცვალეთ ფილტრი`
                    : "ამ კატეგორიაში პროდუქტები ჯერ არ არის"}
                </p>
                {(searchTerm || selectedFilter !== "all" || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedFilter("all");
                      setSelectedCategory("all");
                      setSearchTerm("");
                    }}
                    className="mt-4 px-6 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
                  >
                    ყველას ნახვა
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {filteredProducts.slice(0, displayCount).map((product) => {
                  const isOutOfStock = product.stock === 0;
                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-stone-100 hover:border-emerald-200 overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300 flex flex-col"
                    >
                      {/* Image Area */}
                      <Link
                        to={`/product/${product.id}`}
                        className="relative aspect-[4/5] overflow-hidden bg-stone-100"
                      >
                        {/* Badges */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                          {isOutOfStock ? (
                            <span className="bg-stone-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md">
                              ამოწურულია
                            </span>
                          ) : hasDiscount(product) ? (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                              {getDiscountText(product)}
                            </span>
                          ) : null}
                        </div>

                        {/* Priority Badge */}
                        {product.priority === 100 && (
                          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur text-emerald-700 p-1 rounded-full shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}

                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                              isOutOfStock ? "grayscale opacity-80" : ""
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Leaf className="w-10 h-10" />
                          </div>
                        )}

                        {/* Hover Overlay (Optional but nice) */}
                        {!isOutOfStock && (
                          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-6 bg-gradient-to-t from-black/20 to-transparent">
                            <span className="bg-white text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                              დაწვრილებით
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug hover:text-emerald-700 transition-colors mb-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="mb-3">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getStockColorClassesCompact(
                              product
                            )}`}
                          >
                            {getStockText(product)}
                          </span>
                        </div>

                        <div className="mt-auto pt-3 border-t border-stone-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasProductDiscount(product) ? (
                              <>
                                <span className="text-xs text-stone-400 line-through">
                                  {getProductOriginalDisplayPrice(product)}
                                </span>
                                <span className="text-base font-bold text-red-600">
                                  {getProductDisplayPrice(product)}
                                </span>
                              </>
                            ) : (
                              <span className="text-base font-bold text-emerald-700">
                                {getProductDisplayPrice(product)}
                              </span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {!isLoading && filteredProducts.length > 0 && hasMoreProducts && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-6 py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  მეტის ნახვა ({filteredProducts.length - displayCount}{" "}
                  დარჩენილი) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-6 py-3 rounded-full"
              >
                სრული კატალოგი <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* --- SOCIAL BANNER --- */}
        <section className="py-16 bg-stone-900 text-white mt-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <Leaf className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-4">
              LifeStore - შენი სახლისთვის
            </h2>
            <p className="text-stone-400 mb-8 max-w-lg mx-auto text-sm lg:text-base">
              გამოგვყვევით სოციალურ ქსელებში, ნახეთ ახალი კოლექციები და მიიღეთ
              რჩევები სახლის მოწყობაზე.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://www.facebook.com/lifestore.ge"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] rounded-xl hover:bg-[#166fe5] transition-all font-medium shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <Facebook className="w-5 h-5" /> Facebook
              </a>
              <a
                href="https://www.instagram.com/lifestore.ge"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-pink-900/20 active:scale-95"
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
