// src/pages/admin/components/OrdersManager.tsx
import React, { useState } from "react";
import { OrderService } from "../../../services/orderService";
import { showToast } from "../../../components/ui/Toast";
import type { Order } from "../../../types";
import { getOrderItemDisplayName } from "../../../utils/displayHelpers";
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
  Trash2,
  XCircle,
  Instagram,
  Facebook,
  Globe,
  Tags,
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
  const [activeTab, setActiveTab] = useState<"active" | "live" | "history">(
    "active"
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "instagram": return <Instagram className="w-4 h-4 text-pink-600" />;
      case "facebook": return <Facebook className="w-4 h-4 text-blue-600" />;
      case "phone": return <Phone className="w-4 h-4 text-green-600" />;
      case "personal": return <User className="w-4 h-4 text-gray-600" />;
      default: return <Globe className="w-4 h-4 text-blue-400" />;
    }
  };

  // 📄 განახლებული PDF ფუნქცია - ლამაზი წონით
  const exportSingleOrderPDF = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>შეკვეთა ${order.orderNumber}</title>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 20px; line-height: 1.4; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
          .products { margin-top: 20px; border-top: 1px solid #ddd; }
          .product-item { border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center; }
          .product-info { display: flex; flex-direction: column; }
          .product-meta { font-size: 11px; color: #666; margin-top: 2px; }
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
            order.orderStatus,
            order.paymentStatus,
            order.createdAt,
            order.paymentMethod
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
            .map((item) => {
              // წონის ლოგიკა PDF-ისთვის
              let weight = item.product.weight;
              if (item.variantId && item.product.variants) {
                 const variant = item.product.variants.find(v => v.id === item.variantId);
                 if (variant && variant.weight) {
                     weight = variant.weight;
                 }
              }


              return `
              <div class="product-item">
                <div class="product-info">
                  <strong>${getOrderItemDisplayName(item)}</strong>
                  <span class="product-meta">
                    ${item.quantity} ცალი × ₾${item.price.toFixed(2)}
                    ${weight ? ` | წონა: ${weight} გრ` : ''}
                  </span>
                </div>
                <span>₾${item.total.toFixed(2)}</span>
              </div>
              `;
            })
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

  // 🏷️ ლეიბლის გენერაცია (76x92მმ ზომა თერმალური პრინტერისთვის)
  const generateShippingLabel = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Format date
    const orderDate = (order.createdAt instanceof Date
      ? order.createdAt
      : new Date(order.createdAt as any)).toLocaleDateString("ka-GE");

    // Calculate total items and weight
    let totalWeight = 0;
    let itemsCount = 0;
    const productsList = order.items.map(item => {
      // Weight calculation
      let weight = item.product.weight;
      if (item.variantId && item.product.variants) {
        const variant = item.product.variants.find((v: any) => v.id === item.variantId);
        if (variant && variant.weight) {
          weight = variant.weight;
        }
      }

      if (weight) {
        totalWeight += weight * item.quantity;
      }
      itemsCount += item.quantity;

      const displayName = getOrderItemDisplayName(item);
      return `${displayName} x${item.quantity}${weight ? ` (${weight}გრ)` : ''}`;
    }).slice(0, 3); // მაქსიმუმ 3 პროდუქტი ვაჩვენოთ სივრცის დასაზღვევად

    const moreItems = order.items.length > 3 ? `...და კიდევ ${order.items.length - 3}` : '';

    const labelContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ლეიბლი - ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          @page {
            size: 76mm 92mm;
            margin: 2mm;
          }

          body {
            font-family: 'Arial', 'Georgia', sans-serif;
            font-size: 7px;
            line-height: 1.2;
            color: #000;
            width: 72mm;
            height: 88mm;
            padding: 1.5mm;
            background: white;
          }

          .label-container {
            width: 100%;
            height: 100%;
            border: 2px solid #000;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            background: white;
          }

          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1.5mm;
            background: #f8f9fa;
            padding: 1mm;
            margin: -2mm -2mm 1.5mm -2mm;
          }

          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5mm;
          }

          .logo {
            width: 8mm;
            height: 6mm;
            margin-right: 1.5mm;
            object-fit: contain;
          }

          .store-name {
            font-size: 8px;
            font-weight: bold;
            color: #2d5a27;
            letter-spacing: 0.3px;
          }

          .order-info {
            font-size: 6px;
            font-weight: bold;
            margin-top: 0.5mm;
            color: #333;
          }

          .order-number {
            font-size: 7px;
            font-weight: bold;
            color: #000;
          }

          .section {
            margin-bottom: 1.5mm;
            flex-shrink: 0;
          }

          .section-title {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 1mm;
            padding-bottom: 0.5mm;
            border-bottom: 1px solid #333;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .customer-info {
            font-size: 7px;
            line-height: 1.3;
          }

          .customer-name {
            font-weight: bold;
            font-size: 8px;
            margin-bottom: 0.5mm;
          }

          .address {
            font-weight: bold;
            margin: 0.5mm 0;
          }

          .phone {
            color: #555;
          }

          .products {
            font-size: 6px;
            flex-grow: 1;
          }

          .product-item {
            margin-bottom: 0.8mm;
            line-height: 1.2;
            padding-left: 2mm;
            position: relative;
          }

          .product-item:before {
            content: "•";
            position: absolute;
            left: 0;
            font-weight: bold;
          }

          .weight-badge {
            background: #e9ecef;
            border: 1px solid #dee2e6;
            padding: 0.8mm 1.5mm;
            border-radius: 2mm;
            font-size: 6px;
            display: inline-block;
            margin-top: 1mm;
            font-weight: bold;
          }

          .total-info {
            border-top: 2px solid #000;
            padding-top: 1.5mm;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            background: #f8f9fa;
            margin: 1mm -2mm -2mm -2mm;
            padding: 2mm;
          }

          .total-amount {
            font-size: 10px;
            color: #2d5a27;
          }

          .payment-method {
            font-size: 7px;
            color: #666;
            margin-top: 0.5mm;
          }

          .info-label {
            font-size: 5px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-top: 0.8mm;
            margin-bottom: 0.2mm;
            font-weight: normal;
          }

          .delivery-comment {
            font-size: 6px;
            font-style: italic;
            color: #555;
            margin-bottom: 0.5mm;
          }

          .products-summary {
            margin-bottom: 1mm;
            padding: 0.5mm;
            background: #f8f9fa;
            border-radius: 1mm;
          }

          .summary-line {
            font-size: 6px;
            margin-bottom: 0.3mm;
          }

          .products-list {
            margin-bottom: 0.8mm;
          }

          .additional-items {
            font-style: italic;
            color: #666;
          }

          .weight-info {
            margin-top: 0.8mm;
          }

          .payment-details {
            font-size: 6px;
          }

          .payment-line {
            margin-bottom: 0.5mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .payment-status {
            margin-top: 1mm;
            padding: 0.5mm;
            border-radius: 1mm;
            text-align: center;
            font-weight: bold;
          }

          .payment-status.paid {
            background: #d4edda;
            color: #155724;
          }

          .payment-status.pending {
            background: #fff3cd;
            color: #856404;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <img src="./Screenshot 2025-12-10 151703.png" alt="LifeStore" class="logo">
              <div class="store-name">LifeStore</div>
            </div>
            <div class="order-info">
              <div class="order-number">${order.orderNumber}</div>
              <div>${orderDate}</div>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="section">
            <div class="section-title">✉ მისამართი და მიმღები</div>
            <div class="customer-info">
              <div class="info-label">სრული სახელი:</div>
              <div class="customer-name">${(order.customerInfo.firstName + ' ' + order.customerInfo.lastName).trim() || 'სახელი მითითებული არ არის'}</div>

              <div class="info-label">მიტანის მისამართი:</div>
              <div class="address">${order.deliveryInfo.city}, ${order.deliveryInfo.address}</div>

              <div class="info-label">საკონტაქტო ნომერი:</div>
              <div class="phone">${order.customerInfo.phone || 'ტელეფონი მითითებული არ არის'}</div>

              ${order.deliveryInfo.comment ? `
              <div class="info-label">კომენტარი:</div>
              <div class="delivery-comment">${order.deliveryInfo.comment}</div>
              ` : ''}
            </div>
          </div>

          <!-- Products -->
          <div class="section products">
            <div class="section-title">📦 შეკვეთის შინაარსი</div>
            <div class="products-summary">
              <div class="summary-line">სულ ნივთები: <strong>${itemsCount} ცალი</strong></div>
              ${order.items.length > 1 ? `<div class="summary-line">ნივთების სახეობა: <strong>${order.items.length} ტიპი</strong></div>` : ''}
            </div>

            <div class="products-list">
              ${productsList.map(product =>
                `<div class="product-item">${product}</div>`
              ).join('')}
              ${moreItems ? `<div class="product-item additional-items">${moreItems}</div>` : ''}
            </div>

            ${totalWeight > 0 ? `
            <div class="weight-info">
              <div class="weight-badge">⚖ პროდუქტის წონა: ${totalWeight}გრ</div>
            </div>
            ` : ''}
          </div>

          <!-- Payment & Total -->
          <div class="section">
            <div class="section-title">💰 გადახდის ინფორმაცია</div>
            <div class="payment-details">
              <div class="payment-line">შეკვეთის ღირებულება: <span class="total-amount">₾${order.totalAmount.toFixed(2)}</span></div>
              <div class="payment-line">გადახდის მეთოდი: <strong>${order.paymentMethod === 'cash' ? 'ნაღდი ანგარიშსწორება' : 'ონლაინ გადახდა'}</strong></div>
              ${order.deliveryInfo.shippingCost ? `<div class="payment-line">მიტანის ღირებულება: ₾${order.deliveryInfo.shippingCost.toFixed(2)}</div>` : ''}
              <div class="payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}">
                სტატუსი: ${order.paymentStatus === 'paid' ? '✓ გადახდილი' : '⏳ მოლოდინში'}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(labelContent);
    printWindow.document.close();

    // Auto-print after a small delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
              ${getStatusText(
                order.orderStatus,
                order.paymentStatus,
                order.createdAt,
                order.paymentMethod
              )} |
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
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStandardStatusText = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending":
        return "📋 მოლოდინში";
      case "confirmed": // დროებით თავსებადობისთვის
        return "💳 გადახდილი";
      case "shipped":
        return "📦 გაგზავნილი";
      case "delivered":
        return "🎉 მიტანილი";
      case "cancelled":
        return "❌ გაუქმებული";
      default:
        return status;
    }
  };

  const getSmartStatusText = (
    order: Order,
    currentTab: "active" | "live" | "history"
  ) => {
    if (currentTab === "active") {
      if (order.adminNotes?.includes("Manually added via Admin Panel")) {
        return `📋 ხელით დამატებული (${getStandardStatusText(
          order.orderStatus
        )})`;
      } else {
        return getStandardStatusText(order.orderStatus);
      }
    }

    if (currentTab === "live") {
      if (order.paymentMethod === "cash") {
        return "💰 ნაღდი ფული - ადგილზე გადახდა";
      }

      const minutesAgo = Math.floor(
        (new Date().getTime() - order.createdAt.getTime()) / (1000 * 60)
      );
      const remainingMinutes = Math.max(0, 15 - minutesAgo);

      if (remainingMinutes > 0) {
        return `⏳ იხდის... (${remainingMinutes} წთ დარჩა)`;
      } else {
        return "❌ ვადაგასული";
      }
    }

    if (currentTab === "history") {
      return getStandardStatusText(order.orderStatus);
    }

    return getStandardStatusText(order.orderStatus);
  };

  const getStatusText = (
    status: Order["orderStatus"],
    paymentStatus?: string,
    createdAt?: Date,
    paymentMethod?: string
  ) => {
    switch (status) {
      case "pending":
        if (paymentStatus === "pending" && createdAt) {
          if (paymentMethod === "cash") {
            return "💰 ნაღდი ფული - ადგილზე გადახდა";
          }
          const minutesAgo = Math.floor(
            (new Date().getTime() - createdAt.getTime()) / (1000 * 60)
          );
          const remainingMinutes = Math.max(0, 15 - minutesAgo);
          return remainingMinutes > 0
            ? `მოლოდინში (${remainingMinutes} წთ დარჩა)`
            : "მოლოდინში (გადახდა ვადაგასული)";
        }
        return "მოლოდინში";
      case "shipped":
        return "გაგზავნილი";
      case "delivered":
        return "მიტანილი";
      case "cancelled":
        return "გაუქმებული";
      default:
        return status;
    }
  };

  const getTabFilteredOrders = (tab: "active" | "live" | "history") => {
    return orders.filter((order) => {
      switch (tab) {
        case "active":
          return (
            (order.paymentStatus === "paid" &&
              !["shipped", "delivered", "cancelled"].includes(
                order.orderStatus
              )) ||
            (order.orderStatus === "confirmed" &&
              !["shipped", "delivered", "cancelled"].includes(
                order.orderStatus
              )) ||
            (order.adminNotes?.includes("Manually added via Admin Panel") &&
              !["cancelled"].includes(order.orderStatus)) ||
            (order.paymentMethod === "cash" &&
              order.orderStatus === "pending" &&
              !order.adminNotes?.includes("Manually added via Admin Panel"))
          );

        case "live":
          return (
            order.paymentStatus === "pending" &&
            order.paymentMethod !== "cash" &&
            !order.adminNotes?.includes("Manually added via Admin Panel")
          );

        case "history":
          return ["shipped", "delivered", "cancelled"].includes(
            order.orderStatus
          );

        default:
          return true;
      }
    });
  };

  const getFilteredOrders = () => {
    let filteredByTab = getTabFilteredOrders(activeTab);

    return filteredByTab.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerInfo.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerInfo.phone
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const orderDate = order.createdAt.toISOString().split("T")[0];
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      const matchesStatus =
        statusFilter === "all" || order.orderStatus === statusFilter;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
    });
  };

  const filteredOrders = getFilteredOrders();

  const handleCreateOrderSuccess = () => {
    setShowCreateModal(false);
    onRefresh();
    showToast("შეკვეთა წარმატებით შეიქმნა", "success");
  };

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrderIds(filteredOrders.map((order) => order.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleDeleteSingle = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSelected = () => {
    if (selectedOrderIds.length === 0) {
      showToast("მონიშნეთ შეკვეთები წასაშლელად", "error");
      return;
    }
    setOrderToDelete("selected");
    setShowDeleteConfirm(true);
  };

  // 🏷️ მონიშნული შეკვეთების ლეიბლების დაბეჭდვა
  const generateMultipleLabels = () => {
    if (selectedOrderIds.length === 0) {
      showToast("მონიშნეთ შეკვეთები ლეიბლის დასაბეჭდად", "error");
      return;
    }

    const selectedOrders = orders.filter(order => selectedOrderIds.includes(order.id));

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Create multiple labels in one document
    const multiLabelContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ლეიბლები - ${selectedOrders.length} შეკვეთა</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          @page {
            size: 76mm auto;
            margin: 2mm;
          }

          body {
            font-family: 'Arial', 'Georgia', sans-serif;
            font-size: 7px;
            line-height: 1.2;
            color: #000;
            background: white;
          }

          .label-page {
            width: 72mm;
            min-height: 88mm;
            margin-bottom: 4mm;
            page-break-after: always;
            border: 2px solid #000;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            background: white;
          }

          .label-page:last-child {
            page-break-after: auto;
            margin-bottom: 0;
          }

          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1.5mm;
            background: #f8f9fa;
            padding: 1mm;
            margin: -2mm -2mm 1.5mm -2mm;
            flex-shrink: 0;
          }

          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5mm;
          }

          .logo {
            width: 8mm;
            height: 6mm;
            margin-right: 1.5mm;
            object-fit: contain;
          }

          .store-name {
            font-size: 8px;
            font-weight: bold;
            color: #2d5a27;
            letter-spacing: 0.3px;
          }

          .order-info {
            font-size: 6px;
            font-weight: bold;
            margin-top: 0.5mm;
            color: #333;
          }

          .order-number {
            font-size: 7px;
            font-weight: bold;
            color: #000;
          }

          .section {
            margin-bottom: 1.5mm;
            flex-shrink: 0;
          }

          .section-title {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 1mm;
            padding-bottom: 0.5mm;
            border-bottom: 1px solid #333;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .customer-info {
            font-size: 7px;
            line-height: 1.3;
          }

          .customer-name {
            font-weight: bold;
            font-size: 8px;
            margin-bottom: 0.5mm;
          }

          .address {
            font-weight: bold;
            margin: 0.5mm 0;
          }

          .phone {
            color: #555;
          }

          .products {
            font-size: 6px;
            flex-grow: 1;
          }

          .product-item {
            margin-bottom: 0.8mm;
            line-height: 1.2;
            padding-left: 2mm;
            position: relative;
          }

          .product-item:before {
            content: "•";
            position: absolute;
            left: 0;
            font-weight: bold;
          }

          .total-info {
            border-top: 2px solid #000;
            padding-top: 1.5mm;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            background: #f8f9fa;
            margin: 1mm -2mm -2mm -2mm;
            padding: 2mm;
            flex-shrink: 0;
          }

          .total-amount {
            font-size: 10px;
            color: #2d5a27;
          }

          .payment-method {
            font-size: 7px;
            color: #666;
            margin-top: 0.5mm;
          }

          .weight-badge {
            background: #e9ecef;
            border: 1px solid #dee2e6;
            padding: 0.8mm 1.5mm;
            border-radius: 2mm;
            font-size: 6px;
            display: inline-block;
            margin-top: 1mm;
            font-weight: bold;
          }

          .info-label {
            font-size: 5px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-top: 0.8mm;
            margin-bottom: 0.2mm;
            font-weight: normal;
          }

          .delivery-comment {
            font-size: 6px;
            font-style: italic;
            color: #555;
            margin-bottom: 0.5mm;
          }

          .products-summary {
            margin-bottom: 1mm;
            padding: 0.5mm;
            background: #f8f9fa;
            border-radius: 1mm;
          }

          .summary-line {
            font-size: 6px;
            margin-bottom: 0.3mm;
          }

          .products-list {
            margin-bottom: 0.8mm;
          }

          .additional-items {
            font-style: italic;
            color: #666;
          }

          .weight-info {
            margin-top: 0.8mm;
          }

          .payment-details {
            font-size: 6px;
          }

          .payment-line {
            margin-bottom: 0.5mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .payment-status {
            margin-top: 1mm;
            padding: 0.5mm;
            border-radius: 1mm;
            text-align: center;
            font-weight: bold;
          }

          .payment-status.paid {
            background: #d4edda;
            color: #155724;
          }

          .payment-status.pending {
            background: #fff3cd;
            color: #856404;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${selectedOrders.map(order => {
          // Calculate order details for each label
          const orderDate = (order.createdAt instanceof Date
            ? order.createdAt
            : (order.createdAt as any).toDate()).toLocaleDateString("ka-GE");
          let totalWeight = 0;
          let itemsCount = 0;

          const productsList = order.items.map(item => {
            let weight = item.product.weight;
            if (item.variantId && item.product.variants) {
              const variant = item.product.variants.find((v: any) => v.id === item.variantId);
              if (variant && variant.weight) {
                weight = variant.weight;
              }
            }

            if (weight) {
              totalWeight += weight * item.quantity;
            }
            itemsCount += item.quantity;

            const displayName = getOrderItemDisplayName(item);
            return `${displayName} x${item.quantity}${weight ? ` (${weight}გრ)` : ''}`;
          }).slice(0, 3);

          const moreItems = order.items.length > 3 ? `...და კიდევ ${order.items.length - 3}` : '';

          return `
            <div class="label-page">
              <!-- Header -->
              <div class="header">
                <div class="logo-section">
                  <img src="./Screenshot 2025-12-10 151703.png" alt="LifeStore" class="logo">
                  <div class="store-name">LifeStore</div>
                </div>
                <div class="order-info">
                  <div class="order-number">${order.orderNumber}</div>
                  <div>${orderDate}</div>
                </div>
              </div>

              <!-- Customer Info -->
              <div class="section">
                <div class="section-title">✉ მისამართი და მიმღები</div>
                <div class="customer-info">
                  <div class="info-label">სრული სახელი:</div>
                  <div class="customer-name">${(order.customerInfo.firstName + ' ' + order.customerInfo.lastName).trim() || 'სახელი მითითებული არ არის'}</div>

                  <div class="info-label">მიტანის მისამართი:</div>
                  <div class="address">${order.deliveryInfo.city}, ${order.deliveryInfo.address}</div>

                  <div class="info-label">საკონტაქტო ნომერი:</div>
                  <div class="phone">${order.customerInfo.phone || 'ტელეფონი მითითებული არ არის'}</div>

                  ${order.deliveryInfo.comment ? `
                  <div class="info-label">კომენტარი:</div>
                  <div class="delivery-comment">${order.deliveryInfo.comment}</div>
                  ` : ''}
                </div>
              </div>

              <!-- Products -->
              <div class="section products">
                <div class="section-title">📦 შეკვეთის შინაარსი</div>
                <div class="products-summary">
                  <div class="summary-line">სულ ნივთები: <strong>${itemsCount} ცალი</strong></div>
                  ${order.items.length > 1 ? `<div class="summary-line">ნივთების სახეობა: <strong>${order.items.length} ტიპი</strong></div>` : ''}
                </div>

                <div class="products-list">
                  ${productsList.map(product =>
                    `<div class="product-item">${product}</div>`
                  ).join('')}
                  ${moreItems ? `<div class="product-item additional-items">${moreItems}</div>` : ''}
                </div>

                ${totalWeight > 0 ? `
                <div class="weight-info">
                  <div class="weight-badge">⚖ პროდუქტის წონა: ${totalWeight}გრ</div>
                </div>
                ` : ''}
              </div>

              <!-- Payment & Total -->
              <div class="section">
                <div class="section-title">💰 გადახდის ინფორმაცია</div>
                <div class="payment-details">
                  <div class="payment-line">შეკვეთის ღირებულება: <span class="total-amount">₾${order.totalAmount.toFixed(2)}</span></div>
                  <div class="payment-line">გადახდის მეთოდი: <strong>${order.paymentMethod === 'cash' ? 'ნაღდი ანგარიშსწორება' : 'ონლაინ გადახდა'}</strong></div>
                  ${order.deliveryInfo.shippingCost ? `<div class="payment-line">მიტანის ღირებულება: ₾${order.deliveryInfo.shippingCost.toFixed(2)}</div>` : ''}
                  <div class="payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}">
                    სტატუსი: ${order.paymentStatus === 'paid' ? '✓ გადახდილი' : '⏳ მოლოდინში'}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(multiLabelContent);
    printWindow.document.close();

    // Auto-print after a small delay
    setTimeout(() => {
      printWindow.print();
    }, 500);

    showToast(`${selectedOrders.length} ლეიბლი მზადდება დაბეჭდვისთვის`, "success");
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      showToast("გაუქმების მიზეზი სავალდებულოა", "error");
      return;
    }

    try {
      await OrderService.cancelOrder(orderToCancel, cancelReason);
      showToast("შეკვეთა გაუქმდა და პროდუქტები დაბრუნდა", "success");
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason("");
      onRefresh();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("შეკვეთის გაუქმება ვერ მოხერხდა", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      if (orderToDelete === "selected") {
        await Promise.all(
          selectedOrderIds.map((id) => OrderService.deleteOrder(id))
        );
        showToast(`${selectedOrderIds.length} შეკვეთა წაიშალა`, "success");
        setSelectedOrderIds([]);
      } else if (orderToDelete) {
        await OrderService.deleteOrder(orderToDelete);
        showToast("შეკვეთა წაიშალა", "success");
      }
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting orders:", error);
      showToast("შეკვეთის წაშლა ვერ მოხერხდა", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile-First Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                შეკვეთების მართვა
              </h2>
              <p className="text-gray-600 text-xs md:text-sm mt-4 hidden sm:block">
                გამოიყენეთ ფილტრები შეკვეთების ძებნისთვის
              </p>
            </div>

            {/* Stats Badge */}
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs md:text-sm w-fit">
              <span className="text-gray-600">სულ: </span>
              <span className="font-semibold text-gray-900">
                {filteredOrders.length} / {orders.length} შეკვეთა
              </span>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={exportFilteredOrdersPDF}
                disabled={filteredOrders.length === 0}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="ფილტრირებული შეკვეთების PDF"
              >
                <Download className="w-4 h-4" />
                <span>PDF ანგარიში</span>
              </button>

              {selectedOrderIds.length > 0 && (
                <button
                  onClick={generateMultipleLabels}
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                  title={`${selectedOrderIds.length} შეკვეთის ლეიბლების დაბეჭდვა (76x92მმ)`}
                >
                  <Tags className="w-4 h-4" />
                  <span>ლეიბლები ({selectedOrderIds.length})</span>
                </button>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>ხელით შეკვეთა</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              {
                id: "active",
                name: "🟢 შესასრულებელი",
                count: getTabFilteredOrders("active").length,
              },
              {
                id: "live",
                name: "🟡 ლაივ რეჟიმი",
                count: getTabFilteredOrders("live").length,
              },
              {
                id: "history",
                name: "🔵 ისტორია",
                count: getTabFilteredOrders("history").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile-Optimized Filters */}
        <div className="space-y-3 mt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ძებნა ნომრით, სახელით ან ტელეფონით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Compact Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                თარიღი
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1"
                />
              </div>
            </div>

            {/* Status & Clear */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                სტატუსი
              </label>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1"
                >
                  <option value="all">ყველა სტატუსი</option>
                  <option value="pending">📋 მოლოდინში</option>
                  <option value="confirmed">💳 გადახდილი</option>
                  <option value="shipped">📦 გაგზავნილი</option>
                  <option value="delivered">🎉 მიტანილი</option>
                  <option value="cancelled">❌ გაუქმებული</option>
                </select>
                {(dateFrom || dateTo || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setStatusFilter("all");
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    title="ფილტრების გასუფთავება"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
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
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrderIds.length === filteredOrders.length &&
                          filteredOrders.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
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
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) =>
                            handleSelectOrder(order.id, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                          {order.orderStatus === "cancelled" && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              გაუქმებული
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} პროდუქტი
                          {order.orderStatus === "cancelled" &&
                            order.cancelReason && (
                              <div className="text-xs text-red-600 mt-1 truncate max-w-xs">
                                მიზეზი: {order.cancelReason}
                              </div>
                            )}
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
                          <span className="text-sm font-semibold text-gray-900">
                            ₾{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                              activeTab === "active"
                                ? "bg-green-100 text-green-800"
                                : activeTab === "live"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getSmartStatusText(order, activeTab)}
                          </span>

                          {activeTab === "active" && (
                            <select
                              value={order.orderStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value as Order["orderStatus"]
                                )
                              }
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">📋 მოლოდინში</option>
                              <option value="confirmed">💳 გადახდილი</option>
                              <option value="shipped">📦 გაგზავნე</option>
                              <option value="delivered">🎉 მიტანილი</option>
                            </select>
                          )}
                        </div>
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
                            onClick={() => setSelectedOrder(order)}
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
                          <button
                            onClick={() => generateShippingLabel(order)}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                            title="ლეიბლის ბეჭდვა (76x92მმ)"
                          >
                            <Tags className="w-4 h-4" />
                          </button>
                          {order.orderStatus !== "cancelled" && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-orange-600 hover:text-orange-700 p-1 rounded hover:bg-orange-50"
                              title="შეკვეთის გაუქმება"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label className="flex items-center space-x-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrderIds.length === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {selectedOrderIds.length === filteredOrders.length &&
                    filteredOrders.length > 0
                      ? "ყველას მონიშვნის გაუქმება"
                      : "ყველას მონიშვნა"}
                    {selectedOrderIds.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        ({selectedOrderIds.length} მონიშნული)
                      </span>
                    )}
                  </span>
                </label>
              </div>
            )}

            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(e) =>
                          handleSelectOrder(order.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {order.orderNumber}
                          </h3>
                          {order.orderStatus === "cancelled" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              გაუქმ.
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.items.length} პროდუქტი
                        </p>
                        {order.orderStatus === "cancelled" &&
                          order.cancelReason && (
                            <p className="text-xs text-red-600 mt-1 truncate">
                              მიზეზი: {order.cancelReason}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full text-center ${
                          activeTab === "active"
                            ? "bg-green-100 text-green-800"
                            : activeTab === "live"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getSmartStatusText(order, activeTab)}
                      </span>

                      {activeTab === "active" && (
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as Order["orderStatus"]
                            )
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">მზადებაში</option>
                          <option value="shipped">📦 გაგზავნე</option>
                          <option value="delivered">✅ მიტანილი</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.customerInfo.firstName}{" "}
                        {order.customerInfo.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.customerInfo.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {order.createdAt.toLocaleDateString("ka-GE")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        ₾{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      title="დეტალების ნახვა"
                    >
                      <Eye className="w-4 h-4" />
                      <span>ნახვა</span>
                    </button>
                    <button
                      onClick={() => exportSingleOrderPDF(order)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      title="PDF ჩამოტვირთვა"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => generateShippingLabel(order)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      title="ლეიბლის ბეჭდვა (76x92მმ)"
                    >
                      <Tags className="w-4 h-4" />
                      <span>ლეიბლი</span>
                    </button>
                    {order.orderStatus !== "cancelled" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        title="შეკვეთის გაუქმება"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>გაუქმება</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedOrder && (
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
              <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        შეკვეთა #{selectedOrder.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedOrder.createdAt.toLocaleDateString("ka-GE")} •
                        <span
                          className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            selectedOrder.orderStatus
                          )}`}
                        >
                          {getStatusText(
                            selectedOrder.orderStatus,
                            selectedOrder.paymentStatus,
                            selectedOrder.createdAt,
                            selectedOrder.paymentMethod
                          )}
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
                      onClick={() => generateShippingLabel(selectedOrder)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      title="ლეიბლის ბეჭდვა (76x92მმ)"
                    >
                      <Tags className="w-4 h-4" />
                      <span>ლეიბლი</span>
                    </button>
                    {selectedOrder.orderStatus !== "cancelled" && (
                      <button
                        onClick={() => {
                          handleCancelOrder(selectedOrder.id);
                          setSelectedOrder(null);
                        }}
                        className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>გაუქმება</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDeleteSingle(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                      title="სრული წაშლა (შეუქცევადი)"
                    >
                      <Trash2 className="w-4 h-4" />
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

              <div className="bg-white px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                      ₾ შეკვეთის შეჯამება
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
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">გადახდა:</span>{" "}
                          {selectedOrder.paymentMethod === "cash"
                            ? "ადგილზე გადახდა"
                            : "საბანკო გადარიცხვა"}
                        </p>
                        {selectedOrder.source && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">წყარო:</span>
                            {getSourceIcon(selectedOrder.source)}
                            <span className="capitalize">{selectedOrder.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL PRODUCTS LIST */}
                <div className="mt-6">
                  <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    პროდუქტები ({selectedOrder.items.length})
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {selectedOrder.items.map((item, index) => {
                        // 1. Weight Extraction Logic
                        let weight = item.product.weight;
                        if (item.variantId && item.product.variants) {
                           const variant = item.product.variants.find(v => v.id === item.variantId);
                           if (variant && variant.weight) {
                               weight = variant.weight;
                           }
                        }


                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                {item.product.images?.[0] ? (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>

                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {getOrderItemDisplayName(item)}
                                </h5>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  ₾{item.price.toFixed(2)} × {item.quantity} ცალი
                                </p>
                                {weight ? (
                                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                     <span className="text-stone-400">წონა:</span> {weight} გრ
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-900">
                                ₾{item.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {selectedOrder.orderStatus === "cancelled" && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="flex items-center text-lg font-semibold text-red-800 mb-3">
                        <XCircle className="w-5 h-5 mr-2" />
                        გაუქმების ინფორმაცია
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.cancelReason && (
                          <div>
                            <span className="text-sm font-medium text-red-700">
                              მიზეზი:
                            </span>
                            <p className="text-sm text-red-900 mt-1 bg-red-100 p-3 rounded-lg border border-red-200">
                              {selectedOrder.cancelReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                      <option value="pending">📋 მოლოდინში</option>
                      <option value="confirmed">💳 გადახდილი</option>
                      <option value="shipped">📦 გაგზავნილი</option>
                      <option value="delivered">🎉 მიტანილი</option>
                      <option value="cancelled">❌ გაუქმებული</option>
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
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={() => setShowCancelModal(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                    <XCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      შეკვეთის გაუქმება
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        მიუთითეთ გაუქმების მიზეზი.
                      </p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="მიზეზი..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={confirmCancel}
                  disabled={!cancelReason.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  უკან
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            ></div>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      ⚠️ შეკვეთის სამუდამოდ წაშლა
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-red-600 font-medium mb-2">
                        ყურადღება: ეს მოქმედება შეუქცევადია!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                >
                  წაშლა
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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