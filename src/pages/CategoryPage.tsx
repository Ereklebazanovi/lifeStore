import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Leaf,
  ArrowRight,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCategoryStore } from "../store/categoryStore";
import { hasDiscount, getDiscountText } from "../utils/discount";
import { getStockText, getStockColorClassesCompact } from "../utils/stock";
import {
  getProductDisplayPrice,
  getProductOriginalDisplayPrice,
  hasDiscount as hasProductDiscount,
} from "../utils/productHelpers";
import SEOHead from "../components/SEOHead";

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, fetchProducts, isLoading } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm]);

  const category = categories.find((cat) => cat.slug === slug && cat.isActive !== false);

  const getFilteredProducts = () => {
    let filtered = products.filter(
      (product) =>
        product.isActive !== false &&
        product.category === category?.name
    );

    if (searchTerm.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productCode &&
          product.productCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    switch (selectedFilter) {
      case "discounts":
        return filtered.filter((product) => hasDiscount(product));
      case "new":
        return [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
      case "popular":
        return filtered.filter((product) => product.priority === 100);
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
    { value: "discounts", label: "ფასდაკლება" },
    { value: "new", label: "ახალი" },
  ];

  const getCount = (type: string) => {
    const active = filteredProducts.filter((p) => p.isActive !== false);
    switch (type) {
      case "all":
        return active.length;
      case "popular":
        return active.filter((p) => p.priority === 100).length;
      case "discounts":
        return active.filter((p) => hasDiscount(p)).length;
      case "new":
        return active.length;
      default:
        return 0;
    }
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">კატეგორია ვერ მოიძებნა</h1>
          <Link
            to="/"
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 justify-center"
          >
            დაბრუნდი მთავარ გვერდზე <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const categoryStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description || category.name,
    image: category.image,
    url: `https://lifestore.ge/category/${slug}`,
  };

  return (
    <>
      <SEOHead
        title={`${category.name} | Life Store`}
        description={category.description || `${category.name} კოლექცია Life Store-ში`}
        keywords={`${category.name}, ეკო-მეგობრული, Life Store`}
        canonicalUrl={`https://lifestore.ge/category/${slug}`}
        structuredData={categoryStructuredData}
      />
      <div className="min-h-screen bg-stone-50">
        {/* Modern Category Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-white to-stone-100 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Text Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900/5 rounded-full text-sm text-stone-600 font-medium">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>კატეგორია</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
                  {category.name}
                </h1>

                {category.description && (
                  <p className="text-lg text-stone-600 max-w-lg leading-relaxed">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{filteredProducts.length} პროდუქტი</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500">
                    <Star className="w-4 h-4 fill-current text-amber-400" />
                    <span className="text-sm font-medium">ექსკლუზიური კოლექცია</span>
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="relative lg:order-last">
                {category.image ? (
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-stone-200/50">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent"></div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-70"></div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-stone-100 rounded-full opacity-50"></div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Leaf className="w-10 h-10 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-stone-700">{category.name}</h3>
                        <p className="text-sm text-stone-500">ეკომეგობრული პროდუქტები</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-stone-200/40 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          {/* Enhanced Filter Bar */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md py-6 mb-10 border border-stone-200/60 rounded-2xl shadow-lg shadow-stone-200/20 transition-all">
            <div className="px-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                {/* Filter Buttons */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                  {filterOptions.map((option) => {
                    const isActive = selectedFilter === option.value;
                    const count = getCount(option.value);

                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedFilter(option.value)}
                        className={`whitespace-nowrap flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                          ${
                            isActive
                              ? "bg-stone-900 text-white shadow-lg shadow-stone-300/30 transform scale-105"
                              : "bg-stone-50 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-100/50 hover:scale-102"
                          }`}
                      >
                        <span>{option.label}</span>
                        <span
                          className={`text-[10px] font-extrabold py-1 px-2 rounded-full min-w-[20px] text-center ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-stone-200/70 text-stone-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-80 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="მოძებნეთ პროდუქტი..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-200/60 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 focus:bg-white transition-all text-sm outline-none shadow-sm placeholder:text-stone-500 font-medium"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-stone-200 hover:bg-stone-300 rounded-full flex items-center justify-center transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
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
            <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-white to-stone-50 rounded-3xl border border-dashed border-stone-200/60 shadow-inner">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50">
                <Search className="w-16 h-16 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-3">პროდუქტი ვერ მოიძებნა</h3>
              <p className="text-stone-500 text-center max-w-md mb-8 leading-relaxed">
                სცადეთ შეცვალოთ ძიების კრიტერიუმები ან ფილტრები, შესაძლოა სხვა კატეგორიაში იპოვოთ სასურველი პროდუქტი
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedFilter("all");
                  }}
                  className="px-8 py-3.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all duration-300 shadow-lg hover:shadow-emerald-200/50 transform hover:scale-105"
                >
                  ფილტრის გასუფთავება
                </button>
                <Link
                  to="/products"
                  className="px-8 py-3.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-200 transition-all duration-300"
                >
                  ყველა პროდუქტი
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
                {currentProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-3xl border border-stone-100/70 hover:border-emerald-200/70 overflow-hidden hover:shadow-2xl hover:shadow-stone-200/30 transition-all duration-500 flex flex-col hover:-translate-y-1"
                    >
                      <Link
                        to={`/product/${product.id}`}
                        className="relative aspect-[4/5] overflow-hidden bg-stone-50 block"
                      >
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

                        {!isOutOfStock && (
                          <div className="hidden lg:flex absolute inset-x-0 bottom-4 justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                            <span className="bg-white/95 backdrop-blur text-stone-900 text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-stone-100">
                              პროდუქტის ნახვა
                            </span>
                          </div>
                        )}
                      </Link>

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

                          <div className="lg:hidden w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 bg-white rounded-2xl border border-stone-100 px-6 py-4 shadow-lg shadow-stone-200/20">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl border border-stone-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300
                          ${
                            currentPage === i + 1
                              ? "bg-stone-900 text-white shadow-lg shadow-stone-300/30 transform scale-110"
                              : "bg-stone-50 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600 hover:transform hover:scale-105"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl border border-stone-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
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

export default CategoryPage;
