// src/pages/admin/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProductStore } from "../../store/productStore";
import { OrderService } from "../../services/orderService";
import { Navigate } from "react-router-dom";
import ProductManager from "./components/ProductManager";
import OrdersManager from "./components/OrdersManager";
import AdminStats from "./components/AdminStats";
import LoadingSpinner from "./components/LoadingSpinner";
import AddProductModal from "./components/AddProductModal";
import { Package, ShoppingBag, Plus, RotateCcw, Bell } from "lucide-react";
import type { Order } from "../../types";

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
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

  // Real-time counts
  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending"
  ).length;
  const totalOrders = orders.length;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "დილა მშვიდობისა"
      : currentHour < 18
      ? "დღე მშვიდობისა"
      : "საღამო მშვიდობისა";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 mt-18">
      {/* Admin Welcome Header */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions - მხოლოდ ფუნქციონალური ღილაკები */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              სწრაფი მოქმედებები
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200 group"
              >
                <Plus className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">
                  ახალი პროდუქტის დამატება
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("orders");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center justify-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 group"
              >
                <Bell className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">
                  {" "}
                  შეკვეთების ნახვა
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <AdminStats products={products} />

        {/* Main Content with Tabs */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-8">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`flex items-center space-x-3 pb-2 border-b-2 transition-all ${
                    activeTab === "products"
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activeTab === "products" ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 ${
                        activeTab === "products"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">პროდუქტები</h2>
                    <p className="text-sm">{products.length} ერთეული მარაგში</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center space-x-3 pb-2 border-b-2 transition-all ${
                    activeTab === "orders"
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activeTab === "orders" ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <ShoppingBag
                      className={`w-5 h-5 ${
                        activeTab === "orders"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-semibold">შეკვეთები</h2>
                      {pendingOrders > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                          {pendingOrders} ახალი
                        </span>
                      )}
                    </div>
                    <p className="text-sm">
                      {ordersLoading
                        ? "იტვირთება..."
                        : `სულ ${totalOrders} შეკვეთა`}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "products" && <ProductManager />}
            {activeTab === "orders" && <OrdersManager />}
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
