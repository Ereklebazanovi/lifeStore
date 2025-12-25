// src/pages/admin/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProductStore } from "../../store/productStore";
import { OrderService } from "../../services/orderService";
import { Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProductManager from "./components/ProductManager";
import OrdersManager from "./components/OrdersManager";
import AdminStats from "./components/AdminStats";
import LoadingSpinner from "./components/LoadingSpinner";
import AddProductModal from "./components/AddProductModal";
import InventoryAlerts from "../../components/admin/InventoryAlerts";
import { showToast } from "../../components/ui/Toast";
import { Plus, RefreshCw, AlertTriangle, Package, ShoppingBag, TrendingDown, DollarSign, Clock, Settings } from "lucide-react";
import type { Order } from "../../types";

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Fetch data when admin logs in
  useEffect(() => {
    if (user?.role === "admin") {
      fetchProducts();
      fetchOrdersData();
    }
  }, [user, fetchProducts]);

  const fetchOrdersData = async () => {
    try {
      setOrdersLoading(true);
      const allOrders = await OrderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Quick action handlers
  const handleRefreshData = () => {
    console.log("🔄 Refreshing all data...");
    fetchProducts(); // from useProductStore
    fetchOrdersData(); // local function
    showToast && showToast("მონაცემები განახლდა", "success");
  };

  // Content renderer based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">ახალი პროდუქტი</span>
              </button>
              <button
                onClick={() => setActiveSection('orders')}
                className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-700">შეკვეთები</span>
              </button>
              <button
                onClick={handleRefreshData}
                className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-gray-700">განახლება</span>
              </button>
            </div>

            {/* Stats */}
            <AdminStats products={products} />
          </div>
        );

      case 'products':
        return <ProductManager />;

      case 'orders':
        return ordersLoading ? <LoadingSpinner /> : <OrdersManager orders={orders} onRefresh={fetchOrdersData} />;

      case 'inventory':
        return (
          <div className="space-y-6">
            {/* Inventory Overview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">მარაგის მართვა</h2>
              <p className="text-gray-600 text-sm mb-4">პროდუქტების მარაგის მონიტორინგი და შეტყობინებები</p>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">სულ პროდუქტი</p>
                      <p className="text-lg font-bold text-blue-900">{products.filter(p => p.isActive).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-xs text-red-600 font-medium">ამოიწურა</p>
                      <p className="text-lg font-bold text-red-900">{products.filter(p => p.isActive && p.stock <= 0).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                    <div>
                      <p className="text-xs text-amber-600 font-medium">კრიტიკული</p>
                      <p className="text-lg font-bold text-amber-900">{products.filter(p => p.isActive && p.stock > 0 && p.stock <= 3).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-xs text-yellow-600 font-medium">დაბალი მარაგი</p>
                      <p className="text-lg font-bold text-yellow-900">{products.filter(p => p.isActive && p.stock > 3 && p.stock <= 10).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Alerts - Show ALL alerts */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <InventoryAlerts maxAlerts={50} showTitle={true} />
            </div>
          </div>
        );

      case 'analytics':
        const totalRevenue = orders.filter(o => o.orderStatus === 'delivered').reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingRevenue = orders.filter(o => o.orderStatus === 'pending').reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrdersCount = orders.length;
        const deliveredOrdersCount = orders.filter(o => o.orderStatus === 'delivered').length;

        return (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">ანალიტიკა და რეპორტები</h2>
              <p className="text-gray-600 text-sm">ბიზნესის პერფორმანსის ანალიზი</p>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">მიღებული შემოსავალი</p>
                    <p className="text-lg font-bold text-emerald-900">₾{totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">მიტანილი შეკვეთები</p>
                    <p className="text-lg font-bold text-blue-900">{deliveredOrdersCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">მოლოდინში შეკვეთები</p>
                    <p className="text-lg font-bold text-amber-900">{orders.filter(o => o.orderStatus === 'pending').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="w-8 h-8 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">საშ. შეკვეთის ღირ.</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₾{totalOrdersCount > 0 ? (totalRevenue / deliveredOrdersCount || 0).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">სწრაფი ანალიზი</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">ღირებული მომხმარებლები</h4>
                  <div className="space-y-2">
                    {orders
                      .filter(o => o.orderStatus === 'delivered')
                      .slice(0, 3)
                      .map((order, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                          <span className="font-semibold">₾{order.totalAmount.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">პოპულარული პროდუქტები</h4>
                  <div className="space-y-2">
                    {products
                      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                      .slice(0, 3)
                      .map((product, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{product.name}</span>
                          <span className="text-gray-500">{product.stock} ცალი</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Settings Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">სისტემის პარამეტრები</h2>
              <p className="text-gray-600 text-sm">LifeStore-ის კონფიგურაცია და მართვა</p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Store Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>მაღაზიის პარამეტრები</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">მაღაზიის დასახელება</label>
                    <input
                      type="text"
                      value="LifeStore"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">კონტაქტის ნომერი</label>
                    <input
                      type="text"
                      placeholder="+995 XXX XXX XXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">მიწოდების ზონა</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>თბილისი</option>
                      <option>ბათუმი</option>
                      <option>ქუთაისი</option>
                      <option>რუსთავი</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>გადახდის პარამეტრები</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">TBC Pay ინტეგრაცია</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-emerald-600 font-medium">აქტიური</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">მიწოდების ღირებულება (₾)</label>
                    <input
                      type="number"
                      value="5.00"
                      step="0.50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">უფასო მიწოდების მინიმუმი (₾)</label>
                    <input
                      type="number"
                      value="50.00"
                      step="5.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>მარაგის გაფრთხილებები</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">კრიტიკული დონე</label>
                    <input
                      type="number"
                      value="3"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">0-3 ცალი - კრიტიკული მდგომარეობა</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">დაბალი მარაგის დონე</label>
                    <input
                      type="number"
                      value="10"
                      min="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">4-10 ცალი - დაბალი მარაგი</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">ავტომატური შეტყობინებები</span>
                    <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out">
                      <span className="sr-only">ავტომატური შეტყობინებები</span>
                      <span className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5">
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <span>სისტემის პარამეტრები</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">ღამის რეჟიმი</span>
                    <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out">
                      <span className="sr-only">ღამის რეჟიმი</span>
                      <span className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0">
                      </span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">სესიის ხანგრძლივობა (წუთი)</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="30">30 წუთი</option>
                      <option value="60">1 საათი</option>
                      <option value="120" selected>2 საათი</option>
                      <option value="480">8 საათი</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">ავტომატური backup</span>
                    <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out">
                      <span className="sr-only">ავტომატური backup</span>
                      <span className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5">
                      </span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">მონაცემების მართვა</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                  პარამეტრების შენახვა
                </button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors duration-200">
                  მონაცემების ექსპორტი
                </button>
                <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors duration-200">
                  Backup შექმნა
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors duration-200">
                  სისტემის ლოგები
                </button>
              </div>
            </div>

          </div>
        );

      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderContent()}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={fetchProducts}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPage;