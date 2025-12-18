import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ShoppingCart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { showToast } from "../components/ui/Toast";
import { hasDiscount, getDiscountText } from "../utils/discount";
import { getStockText, getStockColorClassesCompact, getStockStatus, getStockMessage } from "../utils/stock";
import SEOHead from "../components/SEOHead";

const ProductsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { products, fetchProducts, isLoading } = useProductStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const getFilteredProducts = () => {
    let filtered = products.filter(product => product.isActive !== false);

    // ძებნა
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ფილტრი
    switch (selectedFilter) {
      case "popular":
        return filtered.filter(product => product.priority === 100);
      case "discounts":
        return filtered.filter(product => hasDiscount(product));
      case "new":
        return [...filtered].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
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
    { value: "all", label: "ყველა პროდუქტი", count: products.filter(p => p.isActive !== false).length },
    { value: "popular", label: "პოპულარული", count: products.filter(p => p.isActive !== false && p.priority === 100).length },
    { value: "discounts", label: "ფასდაკლებები", count: products.filter(p => p.isActive !== false && hasDiscount(p)).length },
    { value: "new", label: "ახალი დამატებული", count: products.filter(p => p.isActive !== false).length },
  ];

  const productsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ეკომეგობრული სახლის ნივთები",
    "description": "Life Store-ის ყველა პროდუქტი - ეკომეგობრული და ჯანმრთელობისთვის უვნებელი სახლისა და სამზარეულოს ნივთები",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => ({
        "@type": "Product",
        "position": index + 1,
        "name": product.name,
        "url": `https://lifestore.ge/product/${product.id}`
      }))
    }
  };

  return (
    <>
      <SEOHead
        title="ყველა პროდუქტი | Life Store - ეკომეგობრული სახლის ნივთები"
        description="იხილე Life Store-ის სრული პროდუქციის კატალოგი - ეკომეგობრული და ჯანმრთელობისთვის უვნებელი სახლისა და სამზარეულოს ნივთები. თანამედროვე დიზაინი და მაღალი ხარისხი."
        keywords="პროდუქტები, კატალოგი, ეკომეგობრული ნივთები, სახლის ნივთები, სამზარეულო, თანამედროვე დიზაინი, Life Store"
        canonicalUrl="https://lifestore.ge/products"
        structuredData={productsStructuredData}
      />
      <div className="min-h-screen bg-stone-50 mt-2">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-3 !mt-4">
            ყველა პროდუქტი
          </h1>
          <p className="text-stone-600">
            აღმოაჩინეთ ჩვენი ეკო-მეგობრული პროდუქტების სრული კოლექცია
          </p>
        </div>

        {/* Professional Filter Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm mb-12">
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

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-lg border transition-all text-sm font-medium flex items-center gap-2 ${
                    selectedFilter === option.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded">
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 lg:p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Leaf className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-xl text-stone-900 mb-2">
              პროდუქტები ვერ მოიძებნა
            </h3>
            <p className="text-stone-600">
              შეცვალეთ კატეგორიის ფილტრი ან დაელოდეთ ახალ პროდუქტებს
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {currentProducts.map((product) => {
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative"
                >
                  {/* Badges */}
                  {isOutOfStock ? (
                    <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
                      მარაგში არ არის
                    </div>
                  ) : hasDiscount(product) ? (
                    <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-lg">
                      {getDiscountText(product)}
                    </div>
                  ) : null}

                  {/* Product Image LINK */}
                  <Link
                    to={`/product/${product.id}`}
                    className="block aspect-square bg-gradient-to-br from-stone-100 to-emerald-50 overflow-hidden"
                  >
                    <div
                      className={
                        isOutOfStock
                          ? "opacity-60 grayscale transition-all w-full h-full"
                          : "w-full h-full"
                      }
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-16 h-16 lg:w-20 lg:h-20 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 lg:p-5 space-y-3">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-stone-900 tracking-tight line-clamp-1 hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-stone-600 line-clamp-2">
                      {product.description ||
                        "ხელით დამზადებული, ეკო-მეგობრული მასალისგან"}
                    </p>

                    {/* Stock Status */}
                    <div>
                      <span className={`text-xs font-medium ${getStockColorClassesCompact(product)}`}>
                        {getStockText(product)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        {hasDiscount(product) ? (
                          <>
                            <span className="text-sm text-stone-400 line-through">
                              ₾{product.originalPrice?.toFixed(2)}
                            </span>
                            <span className="text-xl text-red-600 font-bold tracking-tight">
                              ₾{product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl text-emerald-700 tracking-tight">
                            ₾{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button (Not a Link) */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 
                            ${
                              isOutOfStock
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-stone-900 hover:bg-emerald-600 text-white group-hover:scale-110"
                            }`}
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 border border-stone-300 bg-white rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-xl transition-all ${
                  currentPage === index + 1
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "border border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="w-10 h-10 border border-stone-300 bg-white rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductsPage;
