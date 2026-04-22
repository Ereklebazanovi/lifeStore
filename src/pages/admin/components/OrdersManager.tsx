// src/pages/admin/components/OrdersManager.tsx
import React, { useState, useEffect, useRef } from "react";
import { OrderService } from "../../../services/orderService";
import { showToast } from "../../../components/ui/Toast";
import type { Order } from "../../../types";
import { getOrderItemDisplayName } from "../../../utils/displayHelpers";
import { exportSingleOrderToExcel, exportMultipleOrdersToExcel } from "../../../utils/excelExporter";
import CreateManualOrderModal from "./CreateManualOrderModal";
import { ClipboardList, Activity, Archive } from "lucide-react";
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
  FileSpreadsheet,
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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Update last updated timestamp when orders change
  useEffect(() => {
    setLastUpdated(new Date());
  }, [orders]);

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "instagram": return <Instagram className="w-4 h-4 text-pink-600" />;
      case "facebook": return <Facebook className="w-4 h-4 text-blue-600" />;
      case "phone": return <Phone className="w-4 h-4 text-green-600" />;
      case "personal": return <User className="w-4 h-4 text-gray-600" />;
      default: return <Globe className="w-4 h-4 text-blue-400" />;
    }
  };

  // Helper function to process products for label generation
  const processProductsForLabel = (items: any[]) => {
    return items.map(item => {
      let weight = item.product.weight;
      if (item.variantId && item.product.variants) {
        const variant = item.product.variants.find((v: any) => v.id === item.variantId);
        if (variant && variant.weight) {
          weight = variant.weight;
        }
      }

      const displayName = getOrderItemDisplayName(item);
      const productCode = item.product.productCode;

      return {
        name: displayName,
        productCode: productCode,
        quantity: item.quantity,
        weight: weight,
        displayText: `${productCode ? `[${productCode}] ` : ''}${displayName} x${item.quantity}`
      };
    });
  };

  // Helper function to calculate totals from products list
  const calculateTotals = (productsList: any[]) => {
    const totalWeight = productsList.reduce((sum, p) => sum + (p.weight || 0) * p.quantity, 0);
    const totalItems = productsList.reduce((sum, p) => sum + p.quantity, 0);
    return { totalWeight, totalItems };
  };

  // Helper function to get font size based on products count
  const getProductFontSize = (productCount: number, isMultiple: boolean = false) => {
    if (isMultiple) {
      return productCount > 12 ? '7px' :
             productCount > 8 ? '7.5px' :
             productCount > 5 ? '8px' : '8.5px';
    } else {
      return productCount > 12 ? '12px' :
             productCount > 8 ? '9px' :
             productCount > 5 ? '10px' : '11px';
    }
  };

  // Helper function to get common CSS styles for labels
  const getLabelCSS = () => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      @page {
        size: 76mm 92mm;
        margin: 0;
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 9px;
        line-height: 1.3;
        color: #000;
        background: white;
      }

      .label-container {
        width: 76mm;
        height: 92mm;
        border: 1px solid #333;
        padding: 2mm;
        display: flex;
        flex-direction: column;
        background: white;
        box-sizing: border-box;
      }

      .label-page {
        width: 76mm;
        height: 92mm;
        margin: 0;
        page-break-after: always;
        border: 1px solid #333;
        padding: 2mm;
        display: flex;
        flex-direction: column;
        background: white;
        box-sizing: border-box;
      }

      .label-page:last-child {
        page-break-after: auto;
      }

      .header {
        text-align: center;
        border-bottom: 1px solid #666;
        padding-bottom: 0.5mm;
        margin-bottom: 1mm;
        background: white;
        padding: 1mm;
        margin: -2mm -2mm 1mm -2mm;
        flex-shrink: 0;
      }

      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.3mm;
        gap: 1.5mm;
      }

      .logo {
        width: 8mm;
        height: 6mm;
        object-fit: contain;
      }

      .store-name {
        font-size: 9px;
        font-weight: 900;
        color: #1a3a15;
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }

      .order-info {
        font-size: 7px;
        font-weight: bold;
        margin-top: 0.2mm;
        color: #333;
        line-height: 1.2;
      }

      .order-number {
        font-size: 8px;
        font-weight: 900;
        color: #000;
        letter-spacing: 0.2px;
      }

      .section {
        margin-bottom: 0.8mm;
        flex-shrink: 0;
      }

      .section-title {
        font-size: 10px;
        font-weight: 900;
        margin-bottom: 0.6mm;
        padding-bottom: 0.4mm;
        border-bottom: 1px solid #999;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .customer-info {
        font-size: 9px;
        line-height: 1.3;
      }

      .customer-name {
        font-weight: 900;
        font-size: 11px;
        margin-bottom: 0.6mm;
        color: #000;
      }

      .info-line {
        margin-bottom: 0.6mm;
        display: flex;
        align-items: flex-start;
        gap: 0.8mm;
      }

      .info-label {
        font-size: 8px;
        color: #333;
        font-weight: 700;
        min-width: 14mm;
        flex-shrink: 0;
      }

      .info-value {
        font-size: 9px;
        color: #000;
        font-weight: 400;
        word-break: break-word;
        flex-grow: 1;
      }

      .products {
        flex-grow: 1;
        overflow: hidden;
      }

      .products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5mm;
      }

      .summary-badge {
        background-color: #4ade80;
        color: #000;
        padding: 0.5mm 1.2mm;
        border-radius: 2mm;
        font-size: 7px;
        font-weight: 700;
      }

      .products-list {
        font-size: inherit;
        overflow: hidden;
        max-height: 30mm;
      }

      .product-item {
        margin-bottom: 0.8mm;
        line-height: 1.2;
        border-bottom: 0.2mm solid #e5e7eb;
        padding-bottom: 0.4mm;
      }

      .product-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .product-name {
        font-weight: 600;
        color: #000;
        display: block;
      }

      .product-quantity {
        color: #666;
        font-weight: 500;
        font-size: 90%;
      }

      .product-code-info {
        font-size: 6px;
        color: #888;
        margin-top: 0.2mm;
      }

      .total-weight {
        margin-top: 0.8mm;
        font-size: 8px;
        color: #666;
        text-align: center;
        font-weight: 600;
      }

      .total-info {
        margin-top: auto;
        border-top: 1px solid #999;
        padding-top: 0.8mm;
        flex-shrink: 0;
      }

      .payment-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: 700;
        margin-bottom: 0.4mm;
      }

      .total-amount {
        color: #059669;
        font-size: 12px;
        font-weight: 900;
      }

      .payment-method {
        font-size: 8px;
        color: #666;
        text-align: center;
        margin-bottom: 0.2mm;
      }
    `;
  };

  // Helper function to generate label HTML for a single order
  const generateLabelHTML = (order: Order, productsList: any[], totalItems: number, totalWeight: number, productFontSize: string, isMultiple: boolean = false) => {
      const orderDate = (order.createdAt instanceof Date
        ? order.createdAt
        : new Date(order.createdAt as any)).toLocaleDateString("ka-GE");

      const cssClass = isMultiple ? 'label-page' : 'label-container';

      return `
        <div class="${cssClass}" style="font-size: ${productFontSize};">
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

          <div class="section">
            <div class="section-title">მიმღები</div>
            <div class="customer-info">
              <div class="customer-name">${(order.customerInfo.firstName + ' ' + order.customerInfo.lastName).trim() || 'სახელი მითითებული არ არის'}</div>

              <div class="info-line">
                <span class="info-label">მისამართი:</span>
                <span class="info-value">${order.deliveryInfo.city}, ${order.deliveryInfo.address}</span>
              </div>

              <div class="info-line">
                <span class="info-label">ტელეფონი:</span>
                <span class="info-value">${order.customerInfo.phone || 'არ არის მითითებული'}</span>
              </div>
            </div>
          </div>

          <div class="products">
            <div class="products-header">
              <div class="section-title">შეკვეთა</div>
              <div class="summary-badge">
                ${totalItems} ცალი
              </div>
            </div>

            <div class="products-list">
              ${productsList.map(product =>
                `<div class="product-item">
                  <span class="product-name">${product.name}</span>
                  <span class="product-quantity"> ${product.quantity} ცალი</span>
                  ${product.productCode ? `<div class="product-code-info">პროდუქტის კოდი: ${product.productCode}</div>` : ''}
                </div>`
              ).join('')}
            </div>

            ${totalWeight > 0 ? `
            <div class="total-weight">
              წონა: ${totalWeight}გრ
            </div>
            ` : ''}
          </div>

          <div class="total-info">
            <div class="payment-line">
              <span>გადახდა:</span>
              <span class="total-amount">₾${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="payment-method">
              ${order.paymentMethod === 'cash' ? 'ნაღდი ანგარიშსწორება' : 'ონლაინ გადახდა'}
            </div>
            ${order.deliveryInfo.shippingCost ? `<div class="payment-method">მიწოდება: ₾${order.deliveryInfo.shippingCost.toFixed(2)}</div>` : ''}
          </div>
        </div>
      `;
    };

  // 🏷️ კურიერებისთვის ოპტიმიზებული ლეიბლის გენერაცია (76x92მმ)
  const generateShippingLabel = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const productsList = processProductsForLabel(order.items);
    const { totalWeight, totalItems } = calculateTotals(productsList);
    const productFontSize = getProductFontSize(productsList.length, false);

    const labelContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ლეიბლი - ${order.orderNumber}</title>
        <style>
          ${getLabelCSS()}

          body {
            width: 76mm;
            height: 92mm;
            margin: 0;
            padding: 0;
          }

          .info-value {
            font-weight: 900;
            color: #000;
            flex: 1;
            word-wrap: break-word;
            font-size: 9px;
          }

          /* Products Section - Large fonts for couriers */
          .products {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .products-header {
            flex-shrink: 0;
            margin-bottom: 0.8mm;
          }

          .products-list {
            flex-grow: 1;
            overflow: visible;
            display: flex;
            flex-direction: column;
          }

          .product-item {
            margin-bottom: 0.5mm;
            line-height: 1.1;
            padding-left: 2.5mm;
            position: relative;
            word-wrap: break-word;
            font-size: ${productFontSize};
            font-weight: 700;
            display: flex;
            flex-direction: column;
          }

          .product-item:before {
            content: "▪";
            position: absolute;
            left: 0;
            font-weight: bold;
            font-size: calc(${productFontSize} + 1.5px);
            color: #2d5a27;
          }

          .product-code {
            font-weight: 900;
            color: #2d5a27;
            font-size: calc(${productFontSize} - 1px);
            background: #f0f4f0;
            padding: 0.2mm 0.4mm;
            border-radius: 0.5mm;
            margin-right: 0.8mm;
            display: inline-block;
          }

          .product-name {
            font-weight: 900;
            color: #000;
            font-size: calc(${productFontSize} + 2.5px);
            display: block;
            margin-bottom: 0.1mm;
            line-height: 1.15;
          }

          .product-quantity {
            font-weight: 600;
            color: #2d5a27;
            font-size: calc(${productFontSize} - 0.5px);
            display: block;
            margin-bottom: 0.1mm;
          }

          .product-code-info {
            font-weight: 500;
            color: #666;
            font-size: calc(${productFontSize} - 2px);
            padding-left: 0.5mm;
            border-left: none;
            margin-top: 0;
          }
            background: white;
            border: 1px solid #333;
            padding: 0.8mm 1.5mm;
            border-radius: 1mm;
            font-size: 8px;
            display: inline-block;
            margin-top: 0.8mm;
            font-weight: 700;
            color: #000;
          }

          .total-weight {
            margin-top: 0.3mm;
            padding: 0.2mm 0.5mm;
            background: white;
            border: 1px solid #999;
            border-radius: 0.5mm;
            font-size: 6px;
            font-weight: 600;
            color: #333;
            text-align: center;
            display: inline-block;
          }

          /* Footer - Large and clear */
          .total-info {
            border-top: 1px solid #666;
            padding-top: 0.8mm;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            background: white;
            margin: 0.8mm -2mm -2mm -2mm;
            padding: 1.2mm;
            flex-shrink: 0;
          }

          .payment-line {
            font-size: 11px;
            margin-bottom: 1mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1mm;
            font-weight: 900;
          }

          .total-amount {
            font-size: 14px;
            color: #1a3a15;
            font-weight: 900;
            letter-spacing: 0.4px;
          }

          .payment-method {
            font-size: 9px;
            color: #333;
            margin-top: 0.8mm;
            font-weight: 700;
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
        ${generateLabelHTML(order, productsList, totalItems, totalWeight, productFontSize, false)}
      </body>
      </html>
    `;

    printWindow.document.write(labelContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // 📊 Excel Export - Single order wrapper
  const handleExportSingleOrder = (order: Order) => {
    const success = exportSingleOrderToExcel(order);
    if (success) {
      showToast(`შეკვეთა ${order.orderNumber} ექსპორტირდა`, "success");
    } else {
      showToast("ექსპორტი ვერ მოხერხდა", "error");
    }
  };

  const handleExportMultipleOrders = () => {
    if (selectedOrderIds.length === 0) {
      showToast("მონიშნეთ შეკვეთები ექსპორტისთვის", "error");
      return;
    }

    const selectedOrders = orders.filter((order) =>
      selectedOrderIds.includes(order.id)
    );

    const success = exportMultipleOrdersToExcel(selectedOrders);
    if (success) {
      showToast(
        `${selectedOrders.length} შეკვეთა ექსპორტირდა`,
        "success"
      );
    } else {
      showToast("ექსპორტი ვერ მოხერხდა", "error");
    }
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

    const labelPages = selectedOrders.map(order => {
      const productsList = processProductsForLabel(order.items);
      const { totalWeight, totalItems } = calculateTotals(productsList);
      const productFontSize = getProductFontSize(productsList.length, true);

      return generateLabelHTML(order, productsList, totalItems, totalWeight, productFontSize, true);
    }).join('');

    const multiLabelContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ლეიბლები - ${selectedOrders.length} შეკვეთა</title>
        <style>
          ${getLabelCSS()}

          .products-header {
            flex-shrink: 0;
            margin-bottom: 0.8mm;
          }

          .products-list {
            flex-grow: 1;
            overflow: visible;
            display: flex;
            flex-direction: column;
          }

          .product-item {
            margin-bottom: 0.5mm;
            line-height: 1.1;
            padding-left: 2.5mm;
            position: relative;
            word-wrap: break-word;
            font-weight: 700;
            display: flex;
            flex-direction: column;
          }

          .product-item:before {
            content: "▪";
            position: absolute;
            left: 0;
            font-weight: bold;
            font-size: 9px;
            color: #2d5a27;
          }

          .product-name {
            font-weight: 900;
            color: #000;
            font-size: 11px;
            display: block;
            margin-bottom: 0.1mm;
            line-height: 1.15;
          }

          .product-quantity {
            font-weight: 600;
            color: #2d5a27;
            font-size: 8.5px;
            display: block;
            margin-bottom: 0.1mm;
          }

          .product-code-info {
            font-weight: 500;
            color: #666;
            font-size: 7px;
            padding-left: 0.5mm;
            border-left: none;
            margin-top: 0;
          }

          .summary-badge {
            background: white;
            border: 1px solid #333;
            padding: 0.8mm 1.5mm;
            border-radius: 1mm;
            font-size: 8px;
            display: inline-block;
            margin-top: 0.8mm;
            font-weight: 700;
            color: #000;
          }

          .total-weight {
            margin-top: 0.3mm;
            padding: 0.2mm 0.5mm;
            background: white;
            border: 1px solid #999;
            border-radius: 0.5mm;
            font-size: 6px;
            font-weight: 600;
            color: #333;
            text-align: center;
            display: inline-block;
          }

          .total-info {
            border-top: 1px solid #666;
            padding-top: 1.5mm;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            background: white;
            margin: 1.5mm -2mm -2mm -2mm;
            padding: 2mm;
            flex-shrink: 0;
          }

          .payment-line {
            font-size: 11px;
            margin-bottom: 1mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1mm;
            font-weight: 900;
          }

          .total-amount {
            font-size: 14px;
            color: #1a3a15;
            font-weight: 900;
            letter-spacing: 0.4px;
          }

          .payment-method {
            font-size: 9px;
            color: #333;
            margin-top: 0.8mm;
            font-weight: 700;
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
        ${labelPages}
      </body>
      </html>
    `;

    printWindow.document.write(multiLabelContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);

    showToast(`${selectedOrders.length} ლეიბლი მზადდება დაბეჭდვისთვის`, "success");
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["orderStatus"]
  ) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      showToast("შეკვეთის სტატუსი განახლდა", "success");

      // Update selectedOrder if it's the same order being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: newStatus
        });
      }

      onRefresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("სტატუსის განახლება ვერ მოხერხდა", "error");
    }
  };

  const canInlineEditStatus = (
    order: Order,
    currentTab: "active" | "live" | "history"
  ) => {
    if (currentTab === "active") return order.orderStatus !== "cancelled";
    // In archive we allow quick edits, but keep cancellation in its dedicated flow.
    if (currentTab === "history") return order.orderStatus !== "cancelled";
    return false;
  };

  const historyInlineStatusOptions: Order["orderStatus"][] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
  ];

  const handleHistoryInlineStatusChange = (
    order: Order,
    newStatus: Order["orderStatus"]
  ) => {
    if (newStatus === order.orderStatus) return;

    const fromText = getStandardStatusText(order.orderStatus);
    const toText = getStandardStatusText(newStatus);

    const confirmed = window.confirm(
      `შეკვეთა #${order.orderNumber}\n\nსტატუსის შეცვლა:\n${fromText} → ${toText}\n\nგსურს შეცვლა?`
    );
    if (!confirmed) return;

    void handleStatusChange(order.id, newStatus);
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
      case "confirmed":
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
      const remainingMinutes = Math.max(0, 10 - minutesAgo);

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
          const remainingMinutes = Math.max(0, 10 - minutesAgo);
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
            !["shipped", "delivered", "cancelled"].includes(order.orderStatus) &&
            (order.paymentStatus === "paid" ||
              order.paymentMethod === "cash" ||
              order.adminNotes?.includes("Manually added via Admin Panel"))
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
    // If specific status is selected, override tab filtering
    let baseOrders = statusFilter !== "all" ? orders : getTabFilteredOrders(activeTab);

    return baseOrders.filter((order) => {
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

      const orderDate = order.createdAt && !isNaN(order.createdAt.getTime())
        ? order.createdAt.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
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
      showToast("შეკვეთა გაუქმდა. მარაგი ხელით აღადგინეთ საწყობში.", "success");
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason("");
      // Auto-switch to history tab to show cancelled orders
      setActiveTab("history");
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
    <div className="space-y-4 md:space-y-6 px-2 md:px-0 pb-4 md:pb-0">
      {/* Mobile-First Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">
                შეკვეთების მართვა
              </h2>
              <p className="text-gray-600 text-xs md:text-sm mt-2 md:mt-4 hidden sm:block">
                გამოიყენეთ ფილტრები შეკვეთების ძებნისთვის
              </p>
            </div>

            {/* Stats Badge with Live Indicator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="bg-gray-100 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm w-fit">
                <span className="text-gray-600">სულ: </span>
                <span className="font-semibold text-gray-900">
                  {filteredOrders.length} / {orders.length} შეკვეთა
                </span>
              </div>

              {/* Live update indicator */}
              {activeTab === "live" && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-green-50 border border-green-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-green-700 font-medium">რეალური დრო</span>
                  {lastUpdated && (
                    <span className="text-green-600 text-xs hidden sm:inline">
                      {lastUpdated.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
              {selectedOrderIds.length > 0 && (
                <>
                  <button
                    onClick={handleExportMultipleOrders}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs md:text-sm font-medium min-h-[44px] active:scale-95"
                    title={`${selectedOrderIds.length} შეკვეთის ექსპორტი Excel-ში`}
                  >
                    <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Excel ({selectedOrderIds.length})</span>
                  </button>

                  <button
                    onClick={generateMultipleLabels}
                    className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-xs md:text-sm font-medium min-h-[44px] active:scale-95"
                    title={`${selectedOrderIds.length} შეკვეთის ლეიბლების დაბეჭდვა (76x92მმ)`}
                  >
                    <Tags className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">ლეიბლები ({selectedOrderIds.length})</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-xs md:text-sm font-medium min-h-[44px] active:scale-95"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>ხელით შეკვეთა</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 md:mb-6">
  <nav className="flex space-x-1 md:space-x-2 bg-gray-50/50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto" aria-label="Tabs">
    {(() => {
      const tabs = [
        { id: "active", name: "შესასრულებელი", icon: ClipboardList, count: getTabFilteredOrders("active").length },
        { id: "live", name: "Live რეჟიმი", icon: Activity, count: getTabFilteredOrders("live").length },
        { id: "history", name: "არქივი", icon: Archive, count: getTabFilteredOrders("history").length },
      ];

      return tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
              ${isActive
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? "text-emerald-600" : "text-gray-400"} flex-shrink-0`} />
            
            {tab.name}

            {tab.count > 0 && (
              <span
                className={`py-0.5 px-1.5 md:px-2 rounded-md text-[10px] md:text-[11px] font-bold leading-none flex-shrink-0
                  ${isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-600"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      });
    })()}
  </nav>
</div>

        {/* Mobile-Optimized Filters */}
        <div className="space-y-3 mt-3 md:mt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ძებნა ნომრით, სახელით ან ტელეფონით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 md:py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base touch-manipulation"
            />
          </div>

          {/* Compact Filters */}
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                თარიღი
              </label>
              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2 sm:px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm md:text-base w-full min-w-0 touch-manipulation"
                    placeholder="დაწყება"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2 sm:px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm md:text-base w-full min-w-0 touch-manipulation"
                    placeholder="დასასრული"
                  />
                </div>
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
                  className="px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base flex-1 touch-manipulation"
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
                    className="px-3 py-2.5 md:py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base min-h-[44px] md:min-h-[40px] active:scale-95"
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
            <div className="overflow-x-auto custom-scrollbar">
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

                          {activeTab === "history" &&
                            canInlineEditStatus(order, activeTab) && (
                            <select
                              value={order.orderStatus}
                              onChange={(e) =>
                                handleHistoryInlineStatusChange(
                                  order,
                                  e.target.value as Order["orderStatus"]
                                )
                              }
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {historyInlineStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {getStandardStatusText(status)}
                                </option>
                              ))}
                            </select>
                          )}

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
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded hover:bg-blue-50"
                            title="დეტალების ნახვა"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportSingleOrder(order)}
                            className="text-green-600 hover:text-green-700 p-2 rounded hover:bg-green-50"
                            title="ექსელში ჩამოტვირთვა"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateShippingLabel(order)}
                            className="text-purple-600 hover:text-purple-700 p-2 rounded hover:bg-purple-50"
                            title="ლეიბლის ბეჭდვა (76x92მმ)"
                          >
                            <Tags className="w-4 h-4" />
                          </button>
                          {order.orderStatus !== "cancelled" && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-orange-600 hover:text-orange-700 p-2 rounded hover:bg-orange-50"
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
          <div className="lg:hidden space-y-3 md:space-y-4">
            {filteredOrders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                <label className="flex items-center space-x-3 text-sm md:text-base font-medium text-gray-700">
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
                <div className="p-3 md:p-4 border-b border-gray-100">
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
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                            {order.orderNumber}
                          </h3>
                          {order.orderStatus === "cancelled" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              გაუქმ.
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">
                          {order.items.length} პროდუქტი
                        </p>
                        {order.orderStatus === "cancelled" &&
                          (order.cancelReason || order.cancellationReason) && (
                            <p className="text-xs text-red-600 mt-1 truncate">
                              მიზეზი: {order.cancelReason || order.cancellationReason}
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

                      {activeTab === "history" &&
                        canInlineEditStatus(order, activeTab) && (
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleHistoryInlineStatusChange(
                              order,
                              e.target.value as Order["orderStatus"]
                            )
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          {historyInlineStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {getStandardStatusText(status)}
                            </option>
                          ))}
                        </select>
                      )}

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
                          <option value="confirmed">{getStandardStatusText("confirmed")}</option>
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

                <div className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm md:text-base text-gray-600">
                        {order.createdAt.toLocaleDateString("ka-GE")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-lg md:text-xl font-semibold text-gray-900">
                        ₾{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-center sm:space-x-3 sm:grid-cols-none">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] active:scale-95"
                      title="დეტალების ნახვა"
                    >
                      <Eye className="w-4 h-4 flex-shrink-0" />
                      <span>ნახვა</span>
                    </button>
                    <button
                      onClick={() => handleExportSingleOrder(order)}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px] active:scale-95"
                      title="ექსელში ჩამოტვირთვა"
                    >
                      <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={() => generateShippingLabel(order)}
                      className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium min-h-[44px] active:scale-95"
                      title="ლეიბლის ბეჭდვა (76x92მმ)"
                    >
                      <Tags className="w-4 h-4 flex-shrink-0" />
                      <span>ლეიბლი</span>
                    </button>
                    {order.orderStatus !== "cancelled" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-3 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium min-h-[44px] active:scale-95 col-span-2 sm:col-span-1"
                        title="შეკვეთის გაუქმება"
                      >
                        <XCircle className="w-4 h-4 flex-shrink-0" />
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-end sm:items-center justify-center min-h-screen pt-4 px-2 sm:px-4 pb-4 sm:pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
              onClick={() => setSelectedOrder(null)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="relative inline-block align-bottom bg-white rounded-t-xl sm:rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full w-full max-h-[95vh] z-[10000] flex flex-col">
              <div className="bg-white px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
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
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:space-x-2">
                    <button
                      onClick={() => generateShippingLabel(selectedOrder)}
                      className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium min-h-[44px] sm:min-h-[40px] w-full sm:w-auto"
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
                        className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium min-h-[44px] sm:min-h-[40px] w-full sm:w-auto"
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
                      className="flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-2.5 sm:py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium min-h-[44px] sm:min-h-[40px] w-full sm:w-auto"
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

              <div className="bg-white px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
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
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-sm font-medium text-gray-700">
                            კომენტარი:
                          </span>
                          <p className="text-sm text-gray-900 mt-1 bg-blue-50 p-2 rounded border border-blue-100">
                            {selectedOrder.deliveryInfo.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
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
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {selectedOrder.items.map((item, index) => {
                        // Weight Extraction Logic
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
                        {(selectedOrder.cancelReason || selectedOrder.cancellationReason) && (
                          <div>
                            <span className="text-sm font-medium text-red-700">
                              მიზეზი:
                            </span>
                            <p className="text-sm text-red-900 mt-1 bg-red-100 p-3 rounded-lg border border-red-200">
                              {selectedOrder.cancelReason || selectedOrder.cancellationReason}
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

      {/* Cancel Order Modal */}
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

      {/* Delete Confirmation Modal */}
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
