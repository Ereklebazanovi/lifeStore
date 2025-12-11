import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { Navigate } from 'react-router-dom';
import ProductManager from './components/ProductManager';
import AdminStats from './components/AdminStats';
import LoadingSpinner from './components/LoadingSpinner';
import AddProductModal from './components/AddProductModal';
import { Package, Shield, Settings, BarChart3 } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'დილა მშვიდობისა' : currentHour < 18 ? 'დღე მშვიდობისა' : 'საღამო მშვიდობისა';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Admin Header Bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-green-100">
                  {greeting}, {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}!
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">ანალიტიკა</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">პარამეტრები</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">სწრაფი მოქმედებები</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200 group"
              >
                <Package className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">ახალი პროდუქტი</span>
              </button>
              <button className="flex items-center justify-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 group">
                <BarChart3 className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">გაყიდვების რეპორტი</span>
              </button>
              <button className="flex items-center justify-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all duration-200 group">
                <Settings className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-purple-700">საიტის პარამეტრები</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <AdminStats products={products} />

        {/* Main Content */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">პროდუქტების მართვა</h2>
                    <p className="text-sm text-gray-600">მართეთ თქვენი მაღაზიის ასორტიმენტი</p>
                  </div>
                </div>
              </div>
            </div>
            <ProductManager />
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default AdminPage;