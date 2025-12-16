//OrdersManager.tsx
import React, { useState, useEffect } from 'react';
import { OrderService } from '../../../services/orderService';
import { showToast } from '../../../components/ui/Toast';
import type { Order } from '../../../types';
import jsPDF from 'jspdf';
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
} from 'lucide-react';

const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['orderStatus']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await OrderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('შეკვეთების ჩატვირთვა ვერ მოხერხდა', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      showToast('სტატუსი წარმატებით განახლდა', 'success');

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, orderStatus: newStatus, updatedAt: new Date() }
            : order
        )
      );

      // Update selected order if it's the same
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus, updatedAt: new Date() } : null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('სტატუსის განახლება ვერ მოხერხდა', 'error');
    }
  };

  // Delete order function
  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Note: This assumes OrderService.deleteOrder exists
      // You may need to implement this method in your OrderService
      await OrderService.deleteOrder(orderId);
      showToast('შეკვეთა წარმატებით წაიშალა', 'success');

      // Remove from local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));

      // Clear selected order if it was deleted
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('შეკვეთის წაშლა ვერ მოხერხდა', 'error');
    }
  };

  // PDF Generation Functions
  const generateInvoicePDF = (order: Order) => {
    const doc = new jsPDF();

    // Company info (replace with your actual company details)
    const companyName = 'LifeStore';
    const companyAddress = 'თბილისი, საქართველო';
    const companyPhone = '+995 XXX XXX XXX';
    const companyEmail = 'info@lifestore.ge';

    // Set font
    doc.setFont('helvetica');

    // Header - Company Info
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(companyAddress, 20, 35);
    doc.text(`Tel: ${companyPhone}`, 20, 42);
    doc.text(`Email: ${companyEmail}`, 20, 49);

    // Invoice title and number
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ინვოისი', 150, 25);

    doc.setFontSize(10);
    doc.text(`ნომერი: ${order.orderNumber}`, 150, 35);
    doc.text(`თარიღი: ${order.createdAt.toLocaleDateString('ka-GE')}`, 150, 42);
    doc.text(`სტატუსი: ${getStatusText(order.orderStatus)}`, 150, 49);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);

    // Customer info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('მყიდველი:', 20, 75);

    doc.setFontSize(10);
    doc.text(`${order.customerInfo.firstName} ${order.customerInfo.lastName}`, 20, 85);
    doc.text(`ტელ: ${order.customerInfo.phone}`, 20, 92);
    doc.text(`Email: ${order.customerInfo.email}`, 20, 99);
    doc.text(`მისამართი: ${order.deliveryInfo.city}, ${order.deliveryInfo.address}`, 20, 106);

    // Products table header
    let yPos = 125;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Table headers
    doc.rect(20, yPos - 8, 170, 10); // Header background
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 8, 170, 10, 'F');

    doc.text('#', 25, yPos);
    doc.text('პროდუქტი', 35, yPos);
    doc.text('ღირებულება', 110, yPos);
    doc.text('რაოდენობა', 140, yPos);
    doc.text('ჯამი', 170, yPos);

    yPos += 15;

    // Products
    order.items.forEach((item, index) => {
      doc.text((index + 1).toString(), 25, yPos);

      // Truncate long product names
      const productName = item.product.name.length > 30
        ? item.product.name.substring(0, 27) + '...'
        : item.product.name;
      doc.text(productName, 35, yPos);

      doc.text(`₾${item.price.toFixed(2)}`, 110, yPos);
      doc.text(item.quantity.toString(), 145, yPos);
      doc.text(`₾${item.total.toFixed(2)}`, 170, yPos);

      yPos += 10;
    });

    // Line separator before totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);

    // Totals
    yPos += 15;
    doc.text(`პროდუქტები: ₾${order.subtotal.toFixed(2)}`, 130, yPos);
    yPos += 8;
    doc.text(`მიწოდება: ${order.shippingCost === 0 ? 'უფასო' : `₾${order.shippingCost.toFixed(2)}`}`, 130, yPos);
    yPos += 8;

    // Total with emphasis
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`სულ: ₾${order.totalAmount.toFixed(2)}`, 130, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('მადლობთ შეკვეთისთვის!', 20, 270);
    doc.text(`დოკუმენტი გენერირებულია: ${new Date().toLocaleDateString('ka-GE')} ${new Date().toLocaleTimeString('ka-GE')}`, 20, 280);

    // Download PDF
    doc.save(`ინვოისი-${order.orderNumber}.pdf`);
  };

  const generateBulkReportPDF = () => {
    const doc = new jsPDF();

    // Company info
    const companyName = 'LifeStore';
    const reportTitle = 'შეკვეთების შემაჯამებელი რეპორტი';

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(companyName, 20, 25);

    doc.setFontSize(14);
    doc.text(reportTitle, 20, 40);

    // Date range and filters info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let infoY = 55;

    if (dateFrom || dateTo) {
      const fromText = dateFrom ? new Date(dateFrom).toLocaleDateString('ka-GE') : 'დასაწყისი';
      const toText = dateTo ? new Date(dateTo).toLocaleDateString('ka-GE') : 'ბოლო';
      doc.text(`პერიოდი: ${fromText} - ${toText}`, 20, infoY);
      infoY += 8;
    }

    if (statusFilter !== 'all') {
      doc.text(`სტატუსი: ${getStatusText(statusFilter)}`, 20, infoY);
      infoY += 8;
    }

    doc.text(`სულ შეკვეთები: ${filteredOrders.length}`, 20, infoY);
    doc.text(`ჩანაწერის თარიღი: ${new Date().toLocaleDateString('ka-GE')} ${new Date().toLocaleTimeString('ka-GE')}`, 100, infoY);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, infoY + 10, 190, infoY + 10);

    // Table header
    let yPos = infoY + 25;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 8, 170, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('თარიღი', 25, yPos);
    doc.text('ნომერი', 55, yPos);
    doc.text('კლიენტი', 85, yPos);
    doc.text('თანხა', 140, yPos);
    doc.text('სტატუსი', 165, yPos);

    yPos += 15;
    doc.setFont('helvetica', 'normal');

    // Orders data
    let totalRevenue = 0;
    filteredOrders.forEach((order) => {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 25;
      }

      doc.setFontSize(8);
      doc.text(order.createdAt.toLocaleDateString('ka-GE'), 25, yPos);
      doc.text(order.orderNumber, 55, yPos);

      const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
      const truncatedName = customerName.length > 20 ? customerName.substring(0, 17) + '...' : customerName;
      doc.text(truncatedName, 85, yPos);

      doc.text(`₾${order.totalAmount.toFixed(2)}`, 140, yPos);
      doc.text(getStatusText(order.orderStatus), 165, yPos);

      totalRevenue += order.totalAmount;
      yPos += 8;
    });

    // Total summary
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`მთლიანი შემოსავალი: ₾${totalRevenue.toFixed(2)}`, 20, yPos);

    // Download PDF
    const dateRange = dateFrom && dateTo
      ? `${new Date(dateFrom).toLocaleDateString('ka-GE')}-${new Date(dateTo).toLocaleDateString('ka-GE')}`
      : new Date().toLocaleDateString('ka-GE');

    doc.save(`შეკვეთების-რეპორტი-${dateRange}.pdf`);
  };

  // Filter orders based on search term, status, and date range
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;

    // Date filtering
    const orderDate = new Date(order.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null; // Include the whole day

    const matchesDateRange =
      (!fromDate || orderDate >= fromDate) &&
      (!toDate || orderDate <= toDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusIcon = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 'მუშავდება';
      case 'confirmed': return 'დადასტურებული';
      case 'delivered': return 'მიტანილი';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
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
        <h2 className="text-2xl font-bold text-stone-900">შეკვეთები ({orders.length})</h2>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          განახლება
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Search */}
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

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">მუშავდება</option>
            <option value="confirmed">დადასტურებული</option>
            <option value="delivered">მიტანილი</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </div>

        {/* Date From */}
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

        {/* Date To */}
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
          შემაჯამებელი რეპორტი PDF
        </button>

        {(dateFrom || dateTo || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setStatusFilter('all');
              setSearchTerm('');
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
          <h3 className="text-lg font-semibold text-stone-600 mb-2">შეკვეთები არ არის</h3>
          <p className="text-stone-500">
            {searchTerm || statusFilter !== 'all'
              ? 'მოცემული ფილტრებით შეკვეთები ვერ მოიძებნა'
              : 'ახალი შეკვეთების მოსალოდნელად'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">{order.orderNumber}</h3>
                    <p className="text-sm text-stone-500">
                      {order.createdAt.toLocaleDateString('ka-GE')} • {order.createdAt.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)}`}>
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
                  <span className="font-bold text-emerald-700">₾{order.totalAmount.toFixed(2)}</span>
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

          {/* Order Details */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 sticky top-6">
            {selectedOrder ? (
              <OrderDetails order={selectedOrder} onStatusChange={handleStatusChange} />
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-stone-600 mb-2">აირჩიეთ შეკვეთა</h3>
                <p className="text-stone-500">დეტალების სანახავად აირჩიეთ შეკვეთა ცხრილიდან</p>
              </div>
            )}
          </div>
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
              დარწმუნებული ხართ რომ გსურთ წაიშალოთ ეს შეკვეთა?
              <br />
              <strong>ეს მოქმედება ვერ შეიძლება დაბრუნება!</strong>
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
    </div>
  );
};

// Order Details Component
const OrderDetails: React.FC<{
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order['orderStatus']) => void;
}> = ({ order, onStatusChange }) => {
  const generateInvoicePDF = (order: Order) => {
    const doc = new jsPDF();

    // Company info (replace with your actual company details)
    const companyName = 'LifeStore';
    const companyAddress = 'თბილისი, საქართველო';
    const companyPhone = '+995 XXX XXX XXX';
    const companyEmail = 'info@lifestore.ge';

    // Set font
    doc.setFont('helvetica');

    // Header - Company Info
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(companyAddress, 20, 35);
    doc.text(`Tel: ${companyPhone}`, 20, 42);
    doc.text(`Email: ${companyEmail}`, 20, 49);

    // Invoice title and number
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ინვოისი', 150, 25);

    doc.setFontSize(10);
    doc.text(`ნომერი: ${order.orderNumber}`, 150, 35);
    doc.text(`თარიღი: ${order.createdAt.toLocaleDateString('ka-GE')}`, 150, 42);
    doc.text(`სტატუსი: ${getStatusText(order.orderStatus)}`, 150, 49);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);

    // Customer info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('მყიდველი:', 20, 75);

    doc.setFontSize(10);
    doc.text(`${order.customerInfo.firstName} ${order.customerInfo.lastName}`, 20, 85);
    doc.text(`ტელ: ${order.customerInfo.phone}`, 20, 92);
    doc.text(`Email: ${order.customerInfo.email}`, 20, 99);
    doc.text(`მისამართი: ${order.deliveryInfo.city}, ${order.deliveryInfo.address}`, 20, 106);

    // Products table header
    let yPos = 125;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Table headers
    doc.rect(20, yPos - 8, 170, 10); // Header background
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 8, 170, 10, 'F');

    doc.text('#', 25, yPos);
    doc.text('პროდუქტი', 35, yPos);
    doc.text('ღირებულება', 110, yPos);
    doc.text('რაოდენობა', 140, yPos);
    doc.text('ჯამი', 170, yPos);

    yPos += 15;

    // Products
    order.items.forEach((item, index) => {
      doc.text((index + 1).toString(), 25, yPos);

      // Truncate long product names
      const productName = item.product.name.length > 30
        ? item.product.name.substring(0, 27) + '...'
        : item.product.name;
      doc.text(productName, 35, yPos);

      doc.text(`₾${item.price.toFixed(2)}`, 110, yPos);
      doc.text(item.quantity.toString(), 145, yPos);
      doc.text(`₾${item.total.toFixed(2)}`, 170, yPos);

      yPos += 10;
    });

    // Line separator before totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);

    // Totals
    yPos += 15;
    doc.text(`პროდუქტები: ₾${order.subtotal.toFixed(2)}`, 130, yPos);
    yPos += 8;
    doc.text(`მიწოდება: ${order.shippingCost === 0 ? 'უფასო' : `₾${order.shippingCost.toFixed(2)}`}`, 130, yPos);
    yPos += 8;

    // Total with emphasis
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`სულ: ₾${order.totalAmount.toFixed(2)}`, 130, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('მადლობთ შეკვეთისთვის!', 20, 270);
    doc.text(`დოკუმენტი გენერირებულია: ${new Date().toLocaleDateString('ka-GE')} ${new Date().toLocaleTimeString('ka-GE')}`, 20, 280);

    // Download PDF
    doc.save(`ინვოისი-${order.orderNumber}.pdf`);
  };

  const getStatusText = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 'მუშავდება';
      case 'confirmed': return 'დადასტურებული';
      case 'delivered': return 'მიტანილი';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-stone-900">{order.orderNumber}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateInvoicePDF(order)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF ინვოისი
          </button>
          <span className="text-sm text-stone-500">
            {order.createdAt.toLocaleDateString('ka-GE')}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          მომხმარებელი
        </h4>
        <div className="space-y-2 text-sm">
          <p><strong>სახელი:</strong> {order.customerInfo.firstName} {order.customerInfo.lastName}</p>
          <p><strong>ტელეფონი:</strong> {order.customerInfo.phone}</p>
          <p><strong>ელ-ფოსტა:</strong> {order.customerInfo.email}</p>
          <p><strong>ტიპი:</strong> {order.customerInfo.isGuest ? 'სტუმარი' : 'დარეგისტრირებული'}</p>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          მიწოდება
        </h4>
        <div className="space-y-2 text-sm">
          <p><strong>ქალაქი:</strong> {order.deliveryInfo.city}</p>
          <p><strong>მისამართი:</strong> {order.deliveryInfo.address}</p>
          {order.deliveryInfo.comment && (
            <p><strong>კომენტარი:</strong> {order.deliveryInfo.comment}</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          პროდუქტები ({order.items.length})
        </h4>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
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
                <h5 className="font-medium text-stone-900 truncate">{item.product.name}</h5>
                <p className="text-sm text-stone-600">
                  {item.quantity} x ₾{item.price.toFixed(2)} = ₾{item.total.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-6 p-4 bg-stone-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>პროდუქტები:</span>
            <span>₾{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>მიწოდება:</span>
            <span>{order.shippingCost === 0 ? 'უფასო' : `₾${order.shippingCost.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-stone-200">
            <span>სულ:</span>
            <span className="text-emerald-700">₾{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div>
        <h4 className="font-semibold text-stone-900 mb-3">სტატუსის მართვა</h4>
        <div className="grid grid-cols-2 gap-2">
          {(['pending', 'confirmed', 'delivered'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(order.id, status)}
              disabled={order.orderStatus === status}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                order.orderStatus === status
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {status === 'pending' && 'მუშავდება'}
              {status === 'confirmed' && 'დადასტურება'}
              {status === 'delivered' && 'მიტანა'}
            </button>
          ))}
        </div>

        {order.orderStatus !== 'cancelled' && (
          <button
            onClick={() => onStatusChange(order.id, 'cancelled')}
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