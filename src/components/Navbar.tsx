import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from 'antd';
import { ShoppingCart, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with screenshot */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/Screenshot 2025-12-10 151703.png"
              alt="LifeStore"
              className="h-10 w-auto rounded-lg shadow-sm"
            />
            <span className="text-xl font-bold text-gray-800">LifeStore</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActivePath('/')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              მთავარი
            </Link>
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActivePath('/products')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              პროდუქტები
            </Link>
            <Link
              to="/about"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActivePath('/about')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              ჩვენს შესახებ
            </Link>
            <Link
              to="/contact"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActivePath('/contact')
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              კონტაქტი
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart">
              <Badge count={0} size="small" color="green">
                <div className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                  <ShoppingCart className="h-5 w-5 text-gray-600 hover:text-green-600" />
                </div>
              </Badge>
            </Link>

            {/* Mobile menu button */}
            <button className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;