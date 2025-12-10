import React from 'react';
import { Link } from 'react-router-dom';

const CartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">თქვენი კალათა</h1>

        {/* Empty cart message */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2-2m2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">კალათა ცარიელია</h3>
          <p className="text-gray-600 mb-6">დაამატეთ პროდუქტები თქვენს კალათაში</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            პროდუქტების ნახვა
          </Link>
        </div>

        {/* Cart items would be displayed here when implemented */}
      </div>
    </div>
  );
};

export default CartPage;