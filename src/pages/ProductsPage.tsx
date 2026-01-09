// src/pages/ProductsPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  ArrowRight
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { hasDiscount, getDiscountText } from "../utils/discount";
import { getStockText, getStockColorClassesCompact } from "../utils/stock";
import {
  getProductDisplayPrice,
  getProductOriginalDisplayPrice,
  hasDiscount as hasProductDiscount,
} from "../utils/productHelpers";
import SEOHead from "../components/SEOHead";

const ProductsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { products, fetchProducts, isLoading } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // გვერდის გადატვირთვა ფილტრის შეცვლისას
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm]);

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

  const productsPerPage = 12;
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const filterOptions = [
    { value: "all", label: "ყველა" },
    { value: "popular", label: "პოპულარული" },
    { value: "discounts", label: "ფასდაკლებები" },
    { value: "new", label: "ახალი" },
  ];

  // Helper for counts
  const getCount = (type: string) => {
    const active = products.filter((p) => p.isActive !== false);
    switch (type) {
      case "all":
        return active.length;
      case "popular":
        return active.filter((p) => p.priority === 100).length;
      case "discounts":
        return active.filter((p) => hasDiscount(p)).length;
      case "new":
        return active.length; // მარტივი ლოგიკა დემოსთვის
      default:
        return 0;
    }
  };

  const productsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ეკომეგობრული სახლის ნივთები",
    description:
      "Life Store-ის ყველა პროდუქტი - ეკომეგობრული და ჯანმრთელობისთვის უვნებელი სახლისა და სამზარეულოს ნივთები",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "Product",
        position: index + 1,
        name: product.name,
        url: `https://lifestore.ge/product/${product.id}`,
      })),
    },
  };

  return (
    <>
      <SEOHead
        title="ყველა პროდუქტი | Life Store"
        description="Life Store-ის სრული კატალოგი."
        keywords="პროდუქტები, კატალოგი, Life Store"
        canonicalUrl="https://lifestore.ge/products"
        structuredData={productsStructuredData}
      />
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-18 lg:py-18">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight mb-3 font-bpg-arial">
              ყველა პროდუქტი
            </h1>
            <p className="text-stone-600 max-w-2xl">
              აღმოაჩინეთ ჩვენი ეკო-მეგობრული პროდუქტების სრული კოლექცია. შეარჩიეთ
              საუკეთესო თქვენი სახლისთვის.
            </p>
          </div>

          {/* 🔥 Professional Sticky Filter Bar 🔥 */}
          <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-sm py-4 mb-8 border-b border-stone-200/50 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Tabs Container */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {filterOptions.map((option) => {
                  const isActive = selectedFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedFilter(option.value)}
                      className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200
                                    ${
                                      isActive
                                        ? "bg-stone-900 text-white shadow-lg shadow-stone-200 transform scale-105"
                                        : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50"
                                    }`}
                    >
                      {option.label}
                      <span
                        className={`ml-1 text-[10px] py-0.5 px-1.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {getCount(option.value)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Container */}
              <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="ძებნა..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-full focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm outline-none shadow-sm placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-12">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-stone-100 h-[340px] animate-pulse"
                >
                  <div className="h-[200px] bg-stone-100 w-full rounded-t-2xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-stone-100 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                ვერაფერი მოიძებნა
              </h3>
              <p className="text-stone-500 mt-2">
                სცადეთ შეცვალოთ ფილტრი ან საძიებო სიტყვა
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedFilter("all");
                }}
                className="mt-6 px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
              >
                ფილტრის გასუფთავება
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-8 mb-12">
                {currentProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-stone-100 hover:border-emerald-200 overflow-hidden hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-300 flex flex-col"
                    >
                      {/* Image Area */}
                      <Link
                        to={`/product/${product.id}`}
                        className="relative aspect-[4/5] overflow-hidden bg-stone-50 block"
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
                          <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur text-emerald-600 p-1.5 rounded-full shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}

                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                              isOutOfStock ? "grayscale opacity-75" : ""
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Leaf className="w-12 h-12" />
                          </div>
                        )}

                        {/* Add Button Overlay (Desktop) */}
                        {!isOutOfStock && (
                          <div className="hidden lg:flex absolute inset-x-0 bottom-4 justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                            <span className="bg-white/95 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-stone-100">
                              პროდუქტის ნახვა
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-relaxed hover:text-emerald-700 transition-colors mb-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="mb-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${getStockColorClassesCompact(
                              product
                            )
                              .replace("text-", "border-")
                              .replace("bg-", "bg-opacity-10 ")}`}
                          >
                            {getStockText(product)}
                          </span>
                        </div>

                        <div className="mt-auto pt-3 border-t border-stone-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            {hasProductDiscount(product) ? (
                              <>
                                <span className="text-xs text-stone-400 line-through font-medium">
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

                          {/* Mobile Arrow */}
                          <div className="lg:hidden w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-stone-600" />
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all
                            ${
                              currentPage === i + 1
                                ? "bg-stone-900 text-white shadow-md"
                                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                            }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-stone-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsPage;