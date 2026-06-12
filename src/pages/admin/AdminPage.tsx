// src/pages/admin/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProductStore } from "../../store/productStore";
import { OrderService } from "../../services/orderService";
import AdminLayout from "./components/AdminLayout";
import ProductManager from "./components/ProductManager";
import OrdersManager from "./components/OrdersManager";
import LoadingSpinner from "./components/LoadingSpinner";
import AddProductDrawer from "./components/AddProductDrawer";
import CreateManualOrderModal from "./components/CreateManualOrderModal";
import InventoryManagerVariants from "./components/InventoryManagerVariants";
import CategoryManager from "./components/CategoryManager";
import ParametersPage from "./components/ParametersPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ReviewsManager from "./components/ReviewsManager";
import BlogManager from "./components/BlogManager";
import { showToast } from "../../components/ui/Toast";

import {
  Plus,
  AlertTriangle,
  Package,
  ShoppingBag,
  Clock,
} from "lucide-react";
import type { Order } from "../../types";

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const { products, subscribeToProducts } = useProductStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (user?.role === "manager") return "orders";
    if (user?.role === "admin") return "analytics"; // admin პირდაპირ ანალიტიკაზე ეშვება
    return "dashboard";
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Set up real-time listeners when admin or manager logs in
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "manager") {
      // Set up real-time products listener
      const unsubscribeProducts = subscribeToProducts();

      // Set up real-time orders listener
      const unsubscribeOrders = OrderService.subscribeToOrders(
        (newOrders) => {
          console.log("🔥 Real-time orders update received:", newOrders.length, "orders");
          setOrders(newOrders);
          setOrdersLoading(false);
        },
        (error) => {
          console.error("Orders subscription error:", error);
          setOrdersLoading(false);
        }
      );

      // Cleanup function
      return () => {
        unsubscribeProducts();
        unsubscribeOrders();
      };
    }
  }, [user, subscribeToProducts]);



  if (isLoading) {
    return <LoadingSpinner />;
  }


  // Content renderer based on active section

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Manager / warehouse dashboard (POS-focused) — admin აქ აღარ ხვდება */}
            {(
              <>
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    📱 სწრაფი POS სისტემა
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Instagram და Facebook გაყიდვების რეგისტრაცია
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setIsManualOrderModalOpen(true)}
                    className="flex items-center justify-center space-x-3 p-4 sm:p-6 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 shadow-lg"
                  >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg font-semibold">ხელით შეკვეთა</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("orders")}
                    className="flex items-center justify-center space-x-3 p-4 sm:p-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg"
                  >
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg font-semibold">შეკვეთები</span>
                  </button>
                </div>

                {/* Manager Stats - Basic only */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 font-medium truncate">
                          სულ პროდუქტი
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {products.filter((p) => p.isActive).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 font-medium truncate">
                          შეკვეთები დღეს
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {
                            orders.filter((o) => {
                              const today = new Date();
                              const orderDate = new Date(o.createdAt);
                              return (
                                orderDate.toDateString() ===
                                today.toDateString()
                              );
                            }).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 font-medium truncate">
                          მოლოდინში
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {
                            orders.filter((o) => o.orderStatus === "pending")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "products":
        return <ProductManager />;

      case "orders":
        return ordersLoading ? (
          <LoadingSpinner />
        ) : (
          <OrdersManager orders={orders} onRefresh={() => {}} />
        );

      case "inventory":
        // New warehouse management - accessible by both admin and manager
        return <InventoryManagerVariants />;

      case "categories":
        // Category management - admin only
        if (user?.role !== "admin") {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                წვდომა შეზღუდულია
              </h3>
              <p className="text-gray-600">
                კატეგორიების მართვა მხოლოდ ადმინისტრატორისთვისაა ხელმისაწვდომი.
              </p>
            </div>
          );
        }
        return <CategoryManager />;

      case "parameters":
        // Parameters management - admin only
        if (user?.role !== "admin") {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                წვდომა შეზღუდულია
              </h3>
              <p className="text-gray-600">
                პარამეტრების მართვა მხოლოდ ადმინისტრატორისთვისაა ხელმისაწვდომი.
              </p>
            </div>
          );
        }
        return <ParametersPage />;

      case "reviews":
        if (user?.role !== "admin") {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">წვდომა შეზღუდულია</h3>
              <p className="text-gray-600">შეფასებების მართვა მხოლოდ ადმინისტრატორისთვისაა.</p>
            </div>
          );
        }
        return <ReviewsManager />;

      case "blog":
        if (user?.role !== "admin") {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">წვდომა შეზღუდულია</h3>
              <p className="text-gray-600">ბლოგის მართვა მხოლოდ ადმინისტრატორისთვისაა.</p>
            </div>
          );
        }
        return <BlogManager />;

case "analytics": {
        // Analytics is admin-only
        if (user?.role !== "admin") {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                წვდომა შეზღუდულია
              </h3>
              <p className="text-gray-600">
                ანალიტიკა მხოლოდ ადმინისტრატორისთვისაა ხელმისაწვდომი.
              </p>
            </div>
          );
        }

        return <AnalyticsDashboard orders={orders} />;
      }

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

      {/* Add Product Modal - Admin Only */}
      {isAddModalOpen && user?.role === "admin" && (
        <AddProductDrawer
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={() => {
            // Real-time listener will automatically update products
            showToast("პროდუქტი წარმატებით დაემატა!", "success");
          }}
        />
      )}

      {/* Manual Order Modal */}
      {isManualOrderModalOpen && (
        <CreateManualOrderModal
          isOpen={isManualOrderModalOpen}
          onClose={() => setIsManualOrderModalOpen(false)}
          onOrderCreated={() => {
            // Real-time listeners will automatically update both orders and products
            showToast("შეკვეთა წარმატებით შეიქმნა!", "success");
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPage;
