import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCategoryStore } from "../store/categoryStore";

const CategoryGrid: React.FC = () => {
  const { categories, fetchCategories, isLoading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activeCategories = categories.filter((cat) => cat.isActive !== false);

  return (
    <section className="py-12 lg:py-20 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 lg:mb-12">
          <span className="text-emerald-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            ხელმისაწვდომი კატეგორიები
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold text-stone-900">
            აირჩიე თემატური კოლექცია
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-stone-100 rounded-2xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500">კატეგორიები ჯერ არ არის</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-stone-100 to-stone-200 hover:shadow-xl transition-all duration-300"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-200 to-emerald-400" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-2 text-emerald-300 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-sm font-bold">გადასვლა</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
