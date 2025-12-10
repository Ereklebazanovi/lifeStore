import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";

const CartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-12">
          თქვენი კალათა
        </h1>

        {/* Empty cart message */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 lg:p-16 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 text-stone-300" />
            </div>
          </div>
          
          <h3 className="text-2xl text-stone-900 tracking-tight mb-3">
            კალათა ცარიელია
          </h3>
          <p className="text-stone-600 mb-8 max-w-md mx-auto">
            დაამატეთ პროდუქტები თქვენს კალათაში და დაიწყეთ ეკო-მეგობრული შოპინგი
          </p>
          
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span>პროდუქტების ნახვა</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Cart items would be displayed here when implemented */}
      </div>
    </div>
  );
};

export default CartPage;
