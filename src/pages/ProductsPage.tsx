import React, { useState } from 'react';
import { Leaf, ShoppingCart, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
 
  const [currentPage, setCurrentPage] = useState(1);

  const products = [
    { id: 1, name: 'ბუნებრივი ნივთი #1', price: 45.99, category: 'category1' },
    { id: 2, name: 'ბუნებრივი ნივთი #2', price: 32.50, category: 'category2' },
    { id: 3, name: 'ბუნებრივი ნივთი #3', price: 78.00, category: 'category1' },
    { id: 4, name: 'ბუნებრივი ნივთი #4', price: 55.75, category: 'category3' },
    { id: 5, name: 'ბუნებრივი ნივთი #5', price: 89.99, category: 'category2' },
    { id: 6, name: 'ბუნებრივი ნივთი #6', price: 42.00, category: 'category1' },
    { id: 7, name: 'ბუნებრივი ნივთი #7', price: 67.50, category: 'category3' },
    { id: 8, name: 'ბუნებრივი ნივთი #8', price: 53.25, category: 'category2' },
    { id: 9, name: 'ბუნებრივი ნივთი #9', price: 95.00, category: 'category1' },
    { id: 10, name: 'ბუნებრივი ნივთი #10', price: 38.99, category: 'category3' },
    { id: 11, name: 'ბუნებრივი ნივთი #11', price: 71.50, category: 'category2' },
    { id: 12, name: 'ბუნებრივი ნივთი #12', price: 44.75, category: 'category1' },
  ];

  const totalPages = 3;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-3">
            ყველა პროდუქტი
          </h1>
          <p className="text-stone-600">
            აღმოაჩინეთ ჩვენი ეკო-მეგობრული პროდუქტების სრული კოლექცია
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="flex items-center gap-3 flex-1">
            <SlidersHorizontal className="h-5 w-5 text-stone-500" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none border border-stone-300 bg-white rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            >
              <option value="all">ყველა კატეგორია</option>
              <option value="category1">ბუნებრივი მასალები</option>
              <option value="category2">ხელით დამზადებული</option>
              <option value="category3">ორგანული პროდუქტები</option>
            </select>
          </div>

        
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 !mt-10">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-stone-100 to-emerald-50 flex items-center justify-center">
                <Leaf className="w-16 h-16 lg:w-20 lg:h-20 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Product Info */}
              <div className="p-4 lg:p-5 space-y-3">
                <h3 className="text-stone-900 tracking-tight line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">
                  ხელით დამზადებული, ეკო-მეგობრული მასალისგან
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl text-emerald-700 tracking-tight">
                    ₾{product.price.toFixed(2)}
                  </span>
                  <button
                    className="w-10 h-10 bg-stone-900 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-colors duration-200 group-hover:scale-110"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 border border-stone-300 bg-white rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5 text-stone-600" />
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-xl transition-all ${
                  currentPage === index + 1
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 border border-stone-300 bg-white rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
