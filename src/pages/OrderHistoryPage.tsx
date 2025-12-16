import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { OrderService } from "../services/orderService";
import { useAuthStore } from "../store/authStore";
import { showToast } from "../components/ui/Toast";
import type { Order } from "../types";
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  Eye,
  Search,
  Filter,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const OrderHistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Order["orderStatus"]
  >("all");

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserOrders();
    }
  }, [user, authLoading]);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userOrders = await OrderService.getUserOrders(user.id);
      setOrders(userOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      showToast("შეკვეთების ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/" replace />;
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "delivered":
        return <Package className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return "მუშავდება";
      case "confirmed":
        return "მიღებულია";
      case "delivered":
        return "მიტანილია";
      case "cancelled":
        return "გაუქმებული";
      default:
        return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">ჩატვირთვა...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            შეკვეთების ისტორია
          </h1>
          <p className="text-stone-600">
            აქ ნახავთ თქვენ მიერ გაკეთებული შეკვეთების სრულ ისტორიას
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="ძიება შეკვეთის ნომრით ან პროდუქტით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-stone-200">
            {searchTerm || statusFilter !== "all" ? (
              // No results found
              <div>
                <Search className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-stone-600 mb-2">
                  შედეგები ვერ მოიძებნა
                </h3>
                <p className="text-stone-500 mb-6">
                  სცადეთ სხვა საძიებო კრიტერიუმები
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  ყველას ნახვა
                </button>
              </div>
            ) : (
              // No orders at all
              <div>
                <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-stone-600 mb-2">
                  შეკვეთები ჯერ არ გაქვთ
                </h3>
                <p className="text-stone-500 mb-6">
                  დაიწყეთ ყიდვა ჩვენი მაღაზიიდან და იხილეთ თქვენი შეკვეთების
                  ისტორია აქ
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  პროდუქტების ნახვა
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Order Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">
                        {order.orderNumber}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {order.createdAt.toLocaleDateString("ka-GE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {order.deliveryInfo.city}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusIcon(order.orderStatus)}
                    {getStatusText(order.orderStatus)}
                  </span>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-900 mb-3">
                    პროდუქტები ({order.items.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-stone-900 text-sm truncate">
                            {item.product.name}
                          </h5>
                          <p className="text-xs text-stone-500">
                            {item.quantity}x • ₾{item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center justify-center p-3 bg-stone-100 rounded-lg text-stone-500 text-sm">
                        +{order.items.length - 3} სხვა
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-6 text-sm text-stone-600">
                    <div>
                      <span className="font-medium">სულ: </span>
                      <span className="font-bold text-emerald-700 text-lg">
                        ₾{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    {order.shippingCost > 0 && (
                      <div>
                        <span>მიწოდება: ₾{order.shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/order-success/${order.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    დეტალების ნახვა
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-2xl text-stone-900">
                {orders.length}
              </h3>
              <p className="text-stone-600">სულ შეკვეთები</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-2xl text-emerald-700">
                ₾
                {orders
                  .reduce((sum, order) => sum + order.totalAmount, 0)
                  .toFixed(2)}
              </h3>
              <p className="text-stone-600">სრული ღირებულება</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
