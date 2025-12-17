// src/pages/admin/components/OrdersManager.tsx
import React, { useState, useEffect } from "react";
import { OrderService } from "../../../services/orderService";
import { showToast } from "../../../components/ui/Toast";
import type { Order } from "../../../types";
// ✅ ახალი მოდალის იმპორტი
import CreateManualOrderModal from "./CreateManualOrderModal";
import {
  Package,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  Phone,
  MapPin,
  Download,
  FileText,
  Trash2,
  Plus, // ✅ Plus აიკონი დამატებულია
} from "lucide-react";

const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Order["orderStatus"]
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);

  // ✅ ახალი state მოდალისთვის
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await OrderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("შეკვეთების ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["orderStatus"]
  ) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      showToast("სტატუსი წარმატებით განახლდა", "success");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, orderStatus: newStatus, updatedAt: new Date() }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? { ...prev, orderStatus: newStatus, updatedAt: new Date() }
            : null
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("სტატუსის განახლება ვერ მოხერხდა", "error");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await OrderService.deleteOrder(orderId);
      showToast("შეკვეთა წარმატებით წაიშალა", "success");

      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      setShowDeleteModal(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("შეკვეთის წაშლა ვერ მოხერხდა", "error");
    }
  };

  // PDF Generation using browser's print functionality
  const generateInvoicePDF = (order: Order) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const generateBulkReportPDF = () => {
    setShowBulkPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customerInfo.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;

    const orderDate = new Date(order.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + "T23:59:59") : null;

    const matchesDateRange =
      (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusIcon = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
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
        return "დადასტურებული";
      case "delivered":
        return "მიტანილი";
      case "cancelled":
        return "გაუქმებული";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-stone-600">შეკვეთების ჩატვირთვა...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-900">
          შეკვეთები ({orders.length})
        </h2>

        {/* ✅ ღილაკების ჯგუფი (დაემატა "დამატება") */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            ხელით დამატება
          </button>

          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
          >
            განახლება
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="ძიება ნომრით, სახელით ან ტელეფონით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">მუშავდება</option>
            <option value="confirmed">დადასტურებული</option>
            <option value="delivered">მიტანილი</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="თარიღიდან"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="თარიღამდე"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={generateBulkReportPDF}
          disabled={filteredOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          დოკუმენტის ჩამოტვირთვა PDF
        </button>

        {(dateFrom || dateTo || statusFilter !== "all") && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setStatusFilter("all");
              setSearchTerm("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-stone-500 text-white rounded-lg hover:bg-stone-600 transition-colors"
          >
            ფილტრების გასუფთავება
          </button>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-600 mb-2">
            შეკვეთები არ არის
          </h3>
          <p className="text-stone-500">
            {searchTerm || statusFilter !== "all"
              ? "მოცემული ფილტრებით შეკვეთები ვერ მოიძებნა"
              : "შეკვეთები ჯერ არ არის შექმნილი"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">
                      {order.orderNumber}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {order.createdAt.toLocaleDateString("ka-GE")} •{" "}
                      {order.createdAt.toLocaleTimeString("ka-GE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {/* ✅ Source Tag - აქ გამოჩნდება საიდანაა შეკვეთა */}
                    {order.source && order.source !== "website" && (
                      <span className="text-xs font-bold text-purple-600 mt-1 block uppercase">
                        {order.source}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusIcon(order.orderStatus)}
                    {getStatusText(order.orderStatus)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-stone-600 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {order.customerInfo.phone}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700">
                    ₾{order.totalAmount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateInvoicePDF(order);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      title="PDF ინვოისი"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      ნახვა
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(order.id);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 sticky top-6 h-fit">
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onStatusChange={handleStatusChange}
                onPrintInvoice={generateInvoicePDF}
              />
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-stone-600 mb-2">
                  აირჩიეთ შეკვეთა
                </h3>
                <p className="text-stone-500">
                  დეტალების სანახავად აირჩიეთ შეკვეთა ცხრილიდან
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {selectedOrder && (
        <div className="print-content">
          <InvoicePrintView order={selectedOrder} />
        </div>
      )}

      {/* Bulk Report Print Modal */}
      {showBulkPrintModal && (
        <div className="print-content">
          <BulkReportPrintView
            orders={filteredOrders}
            dateFrom={dateFrom}
            dateTo={dateTo}
            statusFilter={statusFilter}
            getStatusText={getStatusText}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              შეკვეთის წაშლა
            </h3>
            <p className="text-stone-600 mb-6">
              დარწმუნებული ხართ რომ გსურთ წაშალოთ ეს შეკვეთა?
              <br />
              <strong>ეს შეკვეთა აღარ დაბრუნდება!</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={() => handleDeleteOrder(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                დიახ, წაშლა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 5. ახალი მოდალი - Create Manual Order */}
      <CreateManualOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={fetchOrders} // რომ სიამ განახლება გააკეთოს შექმნის შემდეგ
      />

      {/* Print cleanup */}
      <div className="print:hidden">
        {showBulkPrintModal &&
          setTimeout(() => setShowBulkPrintModal(false), 2000) &&
          null}
      </div>
    </div>
  );
};

// --- Sub-components (InvoicePrintView, BulkReportPrintView, OrderDetails, getInvoiceStatusText) ---

// Invoice Print Component
const InvoicePrintView: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LifeStore</h1>
          <p className="text-gray-600">თბილისი, საქართველო</p>
          <p className="text-gray-600">Tel: +995 511 72 72 57</p>
          <p className="text-gray-600">Email: info@lifestore.ge</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ინვოისი</h2>
          <p className="text-gray-600">ნომერი: {order.orderNumber}</p>
          <p className="text-gray-600">
            თარიღი: {order.createdAt.toLocaleDateString("ka-GE")}
          </p>
          <p className="text-gray-600">
            სტატუსი: {getInvoiceStatusText(order.orderStatus)}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">მყიდველი:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p>
            <strong>სახელი:</strong> {order.customerInfo.firstName}{" "}
            {order.customerInfo.lastName}
          </p>
          <p>
            <strong>ტელეფონი:</strong> {order.customerInfo.phone}
          </p>
          {order.customerInfo.email && (
            <p>
              <strong>Email:</strong> {order.customerInfo.email}
            </p>
          )}
          <p>
            <strong>მისამართი:</strong> {order.deliveryInfo.city},{" "}
            {order.deliveryInfo.address}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">#</th>
              <th className="border border-gray-300 p-3 text-left">პროდუქტი</th>
              <th className="border border-gray-300 p-3 text-center">
                ღირებულება
              </th>
              <th className="border border-gray-300 p-3 text-center">
                რაოდენობა
              </th>
              <th className="border border-gray-300 p-3 text-right">ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-3">{index + 1}</td>
                <td className="border border-gray-300 p-3">
                  {item.product.name}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  ₾{item.price.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {item.quantity}
                </td>
                <td className="border border-gray-300 p-3 text-right">
                  ₾{item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
            <span>პროდუქტები:</span>
            <span>₾{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>მიწოდება:</span>
            <span>
              {order.shippingCost === 0
                ? "უფასო"
                : `₾${order.shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg border-t-2 border-gray-900">
            <span>სულ:</span>
            <span>₾{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm pt-8 border-t">
        <p>მადლობთ შეკვეთისთვის!</p>
        <p>დოკუმენტი გენერირებულია: {new Date().toLocaleString("ka-GE")}</p>
      </div>
    </div>
  );
};

// Bulk Report Print Component
const BulkReportPrintView: React.FC<{
  orders: Order[];
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  getStatusText: (status: Order["orderStatus"]) => string;
}> = ({ orders, dateFrom, dateTo, statusFilter, getStatusText }) => {
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white">
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LifeStore</h1>
        <h2 className="text-xl font-bold text-gray-700">
         დოკუმენტის ჩამოტვირთვა PDF
        </h2>
        <div className="mt-4 text-gray-600">
          {dateFrom && dateTo && (
            <p>
              პერიოდი: {new Date(dateFrom).toLocaleDateString("ka-GE")} -{" "}
              {new Date(dateTo).toLocaleDateString("ka-GE")}
            </p>
          )}
          {statusFilter !== "all" && (
            <p>
              სტატუსი: {getStatusText(statusFilter as Order["orderStatus"])}
            </p>
          )}
          <p>ჩანაწერის თარიღი: {new Date().toLocaleString("ka-GE")}</p>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">თარიღი</th>
              <th className="border border-gray-300 p-3 text-left">ნომერი</th>
              <th className="border border-gray-300 p-3 text-left">კლიენტი</th>
              <th className="border border-gray-300 p-3 text-center">
                ტელეფონი
              </th>
              <th className="border border-gray-300 p-3 text-right">თანხა</th>
              <th className="border border-gray-300 p-3 text-center">
                სტატუსი
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  {order.createdAt.toLocaleDateString("ka-GE")}
                </td>
                <td className="border border-gray-300 p-2">
                  {order.orderNumber}
                </td>
                <td className="border border-gray-300 p-2">
                  {order.customerInfo.firstName} {order.customerInfo.lastName}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {order.customerInfo.phone}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ₾{order.totalAmount.toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {getStatusText(order.orderStatus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64 bg-gray-50 p-4 rounded">
          <div className="flex justify-between py-2 border-b">
            <span>სულ შეკვეთები:</span>
            <span className="font-bold">{orders.length}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg border-t-2 border-gray-900">
            <span>მთლიანი შემოსავალი:</span>
            <span>₾{totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for status text
const getInvoiceStatusText = (status: Order["orderStatus"]) => {
  switch (status) {
    case "pending":
      return "მუშავდება";
    case "confirmed":
      return "დადასტურებული";
    case "delivered":
      return "მიტანილი";
    case "cancelled":
      return "გაუქმებული";
    default:
      return status;
  }
};

// Order Details Component
const OrderDetails: React.FC<{
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order["orderStatus"]) => void;
  onPrintInvoice: (order: Order) => void;
}> = ({ order, onStatusChange, onPrintInvoice }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-stone-900">
          {order.orderNumber}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPrintInvoice(order)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF ინვოისი
          </button>
          <span className="text-sm text-stone-500">
            {order.createdAt.toLocaleDateString("ka-GE")}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          მომხმარებელი
        </h4>
        <div className="space-y-2 text-sm">
          <p>
            <strong>სახელი:</strong> {order.customerInfo.firstName}{" "}
            {order.customerInfo.lastName}
          </p>
          <p>
            <strong>ტელეფონი:</strong> {order.customerInfo.phone}
          </p>
          <p>
            <strong>ელ-ფოსტა:</strong> {order.customerInfo.email}
          </p>
          <p>
            <strong>ტიპი:</strong>{" "}
            {order.customerInfo.isGuest ? "სტუმარი" : "დარეგისტრირებული"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          მიწოდება
        </h4>
        <div className="space-y-2 text-sm">
          <p>
            <strong>ქალაქი:</strong> {order.deliveryInfo.city}
          </p>
          <p>
            <strong>მისამართი:</strong> {order.deliveryInfo.address}
          </p>
          {order.deliveryInfo.comment && (
            <p>
              <strong>კომენტარი:</strong> {order.deliveryInfo.comment}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          პროდუქტები ({order.items.length})
        </h4>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg"
            >
              <div className="w-12 h-12 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-stone-900 truncate">
                  {item.product.name}
                </h5>
                <p className="text-sm text-stone-600">
                  {item.quantity} x ₾{item.price.toFixed(2)} = ₾
                  {item.total.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-stone-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>პროდუქტები:</span>
            <span>₾{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>მიწოდება:</span>
            <span>
              {order.shippingCost === 0
                ? "უფასო"
                : `₾${order.shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-stone-200">
            <span>სულ:</span>
            <span className="text-emerald-700">
              ₾{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-stone-900 mb-3">სტატუსის მართვა</h4>
        <div className="grid grid-cols-2 gap-2">
          {(["pending", "confirmed", "delivered"] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(order.id, status)}
              disabled={order.orderStatus === status}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                order.orderStatus === status
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {status === "pending" && "მუშავდება"}
              {status === "confirmed" && "დადასტურება"}
              {status === "delivered" && "მიტანა"}
            </button>
          ))}
        </div>

        {order.orderStatus !== "cancelled" && (
          <button
            onClick={() => onStatusChange(order.id, "cancelled")}
            className="w-full mt-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            გაუქმება
          </button>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
