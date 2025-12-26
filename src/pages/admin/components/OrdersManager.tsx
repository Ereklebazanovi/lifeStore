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
  X,
} from "lucide-react";

interface OrdersManagerProps {
  orders: Order[];
  onRefresh: () => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ orders, onRefresh }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Order["orderStatus"]
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // PDF Export functions
  const exportSingleOrderPDF = (order: Order) => {
    // Create a new window with the order details for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>შეკვეთა ${order.orderNumber}</title>
        <style>
          body { font-family: 'Noto Sans Georgian', Arial, sans-serif; margin: 20px; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
          .products { margin-top: 20px; }
          .product-item { border-bottom: 1px solid #eee; padding: 8px 0; display: flex; justify-content: space-between; }
          .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LifeStore</h1>
          <h2>შეკვეთის ინვოისი</h2>
          <p>თარიღი: ${new Date().toLocaleDateString("ka-GE")}</p>
        </div>

        <div class="section">
          <div><span class="label">შეკვეთის №:</span> ${order.orderNumber}</div>
          <div><span class="label">თარიღი:</span> ${order.createdAt.toLocaleDateString(
            "ka-GE"
          )} ${order.createdAt.toLocaleTimeString("ka-GE", {
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
          <div><span class="label">სტატუსი:</span> ${getStatusText(
            order.orderStatus
          )}</div>
          <div><span class="label">გადახდა:</span> ${
            order.paymentMethod === "cash"
              ? "ადგილზე გადახდა"
              : "საბანკო გადარიცხვა"
          }</div>
        </div>

        <div class="section">
          <h3>მომხმარებლის ინფო:</h3>
          <div><span class="label">სახელი:</span> ${
            order.customerInfo.firstName
          } ${order.customerInfo.lastName}</div>
          <div><span class="label">ტელეფონი:</span> ${
            order.customerInfo.phone
          }</div>
          <div><span class="label">მისამართი:</span> ${
            order.deliveryInfo.city
          }, ${order.deliveryInfo.address}</div>
          ${
            order.deliveryInfo.comment
              ? `<div><span class="label">კომენტარი:</span> ${order.deliveryInfo.comment}</div>`
              : ""
          }
        </div>

        <div class="products">
          <h3>პროდუქტები:</h3>
          ${order.items
            .map(
              (item) => `
            <div class="product-item">
              <span>${item.product.name} - ${
                item.quantity
              } ცალი × ₾${item.price.toFixed(2)}</span>
              <span>₾${item.total.toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="total">
          <div style="display: flex; justify-content: space-between;">
            <span>პროდუქტები:</span>
            <span>₾${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>მიწოდება:</span>
            <span>${
              order.shippingCost === 0
                ? "უფასო"
                : "₾" + order.shippingCost.toFixed(2)
            }</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; margin-top: 10px;">
            <span>სულ გადასახდელი:</span>
            <span>₾${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const exportFilteredOrdersPDF = () => {
    const filtered = getFilteredOrders();
    if (filtered.length === 0) {
      showToast("ფილტრირებული შეკვეთები არ არის", "info");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalAmount = filtered.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const fromDate = dateFrom
      ? new Date(dateFrom).toLocaleDateString("ka-GE")
      : "დასაწყისი";
    const toDate = dateTo
      ? new Date(dateTo).toLocaleDateString("ka-GE")
      : "ახლა";

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>შეკვეთების ანგარიში</title>
        <style>
          body { font-family: 'Noto Sans Georgian', Arial, sans-serif; margin: 20px; line-height: 1.4; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .summary { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
          .order { border-bottom: 1px solid #ddd; padding: 10px 0; }
          .order-header { font-weight: bold; margin-bottom: 5px; }
          .order-details { font-size: 11px; color: #666; }
          .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; font-weight: bold; text-align: right; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LifeStore</h1>
          <h2>შეკვეთების ანგარიში</h2>
          <p>პერიოდი: ${fromDate} - ${toDate}</p>
          <p>ანგარიშის თარიღი: ${new Date().toLocaleDateString("ka-GE")}</p>
        </div>

        <div class="summary">
          <strong>ჯამური ინფორმაცია:</strong><br>
          შეკვეთების რაოდენობა: ${filtered.length}<br>
          სრული ღირებულება: ₾${totalAmount.toFixed(2)}
        </div>

        ${filtered
          .map(
            (order) => `
          <div class="order">
            <div class="order-header">
              ${order.orderNumber} - ${order.customerInfo.firstName} ${
              order.customerInfo.lastName
            } - ₾${order.totalAmount.toFixed(2)}
            </div>
            <div class="order-details">
              ${order.createdAt.toLocaleDateString(
                "ka-GE"
              )} ${order.createdAt.toLocaleTimeString("ka-GE", {
              hour: "2-digit",
              minute: "2-digit",
            })} |
              ${getStatusText(order.orderStatus)} |
              ${order.customerInfo.phone} |
              ${order.items.length} პროდუქტი
            </div>
          </div>
        `
          )
          .join("")}

        <div class="total">
          <div>ჯამი: ₾${totalAmount.toFixed(2)}</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["orderStatus"]
  ) => {
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
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return "მოლოდინში";
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerInfo.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.orderStatus === statusFilter;

      // Date filtering
      const orderDate = order.createdAt.toISOString().split("T")[0];
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const filteredOrders = getFilteredOrders();

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
            <h2 className="text-xl font-semibold text-gray-900">
              შეკვეთების მართვა
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              გამოიყენეთ ფილტრები შეკვეთების ძებნისთვის
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-600">სულ: </span>
              <span className="font-semibold text-gray-900">
                {filteredOrders.length} / {orders.length} შეკვეთა
              </span>
            </div>

            {/* PDF Export Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={exportFilteredOrdersPDF}
                disabled={filteredOrders.length === 0}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="ფილტრირებული შეკვეთების PDF"
              >
                <Download className="w-4 h-4" />
                <span>PDF ანგარიში</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>ხელით შეკვეთა</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
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

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="თარიღიდან"
            />
            <span className="text-gray-400 text-sm">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="თარიღამდე"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                title="თარიღების გასუფთავება"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            შეკვეთები არ მოიძებნა
          </h3>
          <p className="text-gray-600">
            შეცვალეთ ფილტრები ან შექმენით ახალი შეკვეთა
          </p>
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
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} პროდუქტი
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerInfo.firstName}{" "}
                            {order.customerInfo.lastName}
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
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as Order["orderStatus"]
                          )
                        }
                        className={`px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                          order.orderStatus
                        )}`}
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
                          {order.createdAt.toLocaleDateString("ka-GE")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            console.log(
                              "Opening order detail for:",
                              order.orderNumber
                            );
                            console.log("Setting selectedOrder to:", order);
                            setSelectedOrder(order);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                          title="დეტალების ნახვა"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportSingleOrderPDF(order)}
                          className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                          title="PDF ჩამოტვირთვა"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder &&
        (() => {
          console.log(
            "Modal is rendering! selectedOrder:",
            selectedOrder.orderNumber
          );
          return (
            <div className="fixed inset-0 z-[9999] overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
                  onClick={() => setSelectedOrder(null)}
                ></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                  &#8203;
                </span>
                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full z-[10000]">
                  {/* Header */}
                  <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            შეკვეთა #{selectedOrder.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedOrder.createdAt.toLocaleDateString(
                              "ka-GE"
                            )}{" "}
                            •
                            <span
                              className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                selectedOrder.orderStatus
                              )}`}
                            >
                              {getStatusText(selectedOrder.orderStatus)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => exportSingleOrderPDF(selectedOrder)}
                          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          მომხმარებლის ინფო
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 w-20">
                              სახელი:
                            </span>
                            <span className="text-sm text-gray-900">
                              {selectedOrder.customerInfo.firstName}{" "}
                              {selectedOrder.customerInfo.lastName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {selectedOrder.customerInfo.phone}
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-900">
                              {selectedOrder.deliveryInfo.city},{" "}
                              {selectedOrder.deliveryInfo.address}
                            </span>
                          </div>
                          {selectedOrder.deliveryInfo.comment && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-xs font-medium text-blue-700 mb-1">
                                კომენტარი:
                              </p>
                              <p className="text-sm text-blue-900">
                                "{selectedOrder.deliveryInfo.comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                          შეკვეთის შეჯამება
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">პროდუქტები:</span>
                            <span className="font-medium text-gray-900">
                              ₾{selectedOrder.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">მიწოდება:</span>
                            <span className="font-medium text-gray-900">
                              {selectedOrder.shippingCost === 0
                                ? "უფასო"
                                : `₾${selectedOrder.shippingCost.toFixed(2)}`}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-3">
                            <div className="flex justify-between text-lg font-semibold">
                              <span className="text-gray-900">სულ:</span>
                              <span className="text-green-600">
                                ₾{selectedOrder.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">გადახდა:</span>{" "}
                              {selectedOrder.paymentMethod === "cash"
                                ? "ადგილზე გადახდა"
                                : "საბანკო გადარიცხვა"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="mt-6">
                      <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                        <Package className="w-5 h-5 mr-2 text-purple-600" />
                        პროდუქტები ({selectedOrder.items.length})
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          {selectedOrder.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {item.product.images?.[0] ? (
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {item.product.name}
                                  </h5>
                                  <p className="text-sm text-gray-500">
                                    ₾{item.price.toFixed(2)} × {item.quantity}{" "}
                                    ცალი
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-semibold text-gray-900">
                                  ₾{item.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status Change Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        სტატუსის შეცვლა
                      </h4>
                      <div className="flex items-center space-x-4">
                        <select
                          value={selectedOrder.orderStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              selectedOrder.id,
                              e.target.value as Order["orderStatus"]
                            )
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">მოლოდინში</option>
                          <option value="confirmed">დადასტურებული</option>
                          <option value="delivered">მიტანილი</option>
                          <option value="cancelled">გაუქმებული</option>
                        </select>
                        <div className="text-sm text-gray-500">
                          ცვლილება მაშინვე შეინახება
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
