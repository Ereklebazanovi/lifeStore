// src/pages/admin/components/OrdersManager.tsx
import React, { useState } from "react";
import { OrderService } from "../../../services/orderService";
import { showToast } from "../../../components/ui/Toast";
import type { Order } from "../../../types";
import CreateManualOrderModal from "./CreateManualOrderModal";
import {
  Package,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Calendar,
  Phone,
  MapPin,
  Download,
  Plus,
  DollarSign,
} from "lucide-react";

interface OrdersManagerProps {
  orders: Order[];
  onRefresh: () => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ orders, onRefresh }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["orderStatus"]>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleStatusChange = async (orderId: string, newStatus: Order["orderStatus"]) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      showToast("შეკვეთის სტატუსი განახლდა", "success");
      onRefresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("სტატუსის განახლება ვერ მოხერხდა", "error");
    }
  };

  const getStatusColor = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending": return "მოლოდინში";
      case "confirmed": return "დადასტურებული";
      case "delivered": return "მიტანილი";
      case "cancelled": return "გაუქმებული";
      default: return status;
    }
  };

  const getStatusIcon = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "delivered": return <Package className="w-4 h-4" />;
      case "cancelled": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrderSuccess = () => {
    setShowCreateModal(false);
    onRefresh();
    showToast("შეკვეთა წარმატებით შეიქმნა", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">შეკვეთების მართვა</h2>
            <p className="text-gray-600 text-sm mt-1">გამოიყენეთ ფილტრები შეკვეთების ძებნისთვის</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-600">სულ: </span>
              <span className="font-semibold text-gray-900">{orders.length} შეკვეთა</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>ხელით შეკვეთა</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ძებნა შეკვეთის ნომრით ან მომხმარებლით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">მოლოდინში</option>
            <option value="confirmed">დადასტურებული</option>
            <option value="delivered">მიტანილი</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">შეკვეთები არ მოიძებნა</h3>
          <p className="text-gray-600">შეცვალეთ ფილტრები ან შექმენით ახალი შეკვეთა</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    შეკვეთა
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    მომხმარებელი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    თანხა
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    თარიღი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    მოქმედება
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} პროდუქტი
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerInfo.firstName} {order.customerInfo.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerInfo.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          ₾{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order["orderStatus"])}
                        className={`px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(order.orderStatus)}`}
                      >
                        <option value="pending">მოლოდინში</option>
                        <option value="confirmed">დადასტურებული</option>
                        <option value="delivered">მიტანილი</option>
                        <option value="cancelled">გაუქმებული</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {order.createdAt.toLocaleDateString('ka-GE')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        title="დეტალების ნახვა"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedOrder(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">შეკვეთის დეტალები</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">შეკვეთის ინფორმაცია</h4>
                    <p className="text-sm text-gray-600">ნომერი: {selectedOrder.orderNumber}</p>
                    <p className="text-sm text-gray-600">სტატუსი: {getStatusText(selectedOrder.orderStatus)}</p>
                    <p className="text-sm text-gray-600">თარიღი: {selectedOrder.createdAt.toLocaleDateString('ka-GE')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">მომხმარებელი</h4>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}
                    </p>
                    <p className="text-sm text-gray-600">ტელეფონი: {selectedOrder.customerInfo.phone}</p>
                    <p className="text-sm text-gray-600">მისამართი: {selectedOrder.customerInfo.address}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">პროდუქტები</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>₾{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>სულ:</span>
                        <span>₾{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Order Modal */}
      {showCreateModal && (
        <CreateManualOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={handleCreateOrderSuccess}
        />
      )}
    </div>
  );
};

export default OrdersManager;