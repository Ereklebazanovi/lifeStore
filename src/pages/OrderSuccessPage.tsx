import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, ArrowLeft, Copy, Check, Download, Phone, Mail } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { showToast } from '../components/ui/Toast';
import type { Order } from '../types';

const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderData = await OrderService.getOrderById(orderId);
        if (!orderData) {
          showToast('შეკვეთა არ მოიძებნა', 'error');
          navigate('/');
          return;
        }
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        showToast('მონაცემების ჩატვირთვა ვერ მოხერხდა', 'error');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      showToast('შეკვეთის ნომერი დაკოპირებულია', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'მიღებულია';
      case 'confirmed': return 'დადასტურებულია';
      case 'shipped': return 'გზაშია';
      case 'delivered': return 'ჩაბარებულია';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 lg:py-12 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- Success Header (ცენტრალური ნაწილი) --- */}
        <div className="text-center mb-10 print:hidden">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce-slow shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            მადლობა! შეკვეთა მიღებულია
          </h1>
          <p className="text-stone-600 max-w-lg mx-auto mb-8 text-lg">
            თქვენი შეკვეთა წარმატებით გაფორმდა და გადაეცა დასამუშავებლად. საჭიროების შემთხვევაში, დაგიკავშირდებით მითითებულ ნომერზე.
          </p>

          {/* 🔥 PDF DOWNLOAD BUTTON (დიდი და გამოსაჩენი) */}
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-3 bg-white border-2 border-emerald-100 text-emerald-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group"
          >
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-white transition-colors">
                <Download className="w-6 h-6" />
            </div>
            <span>ინვოისის შენახვა (PDF)</span>
          </button>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-stone-900">LifeStore ინვოისი</h1>
            <p className="text-stone-500">გმადლობთ შენაძენისთვის</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* --- MAIN CONTENT (LEFT) --- */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Info Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 print:shadow-none print:border-none print:p-0">
              <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4 print:border-none">
                <h2 className="text-xl font-bold text-stone-900">შეკვეთის დეტალები</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                  {getStatusText(order.orderStatus)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">შეკვეთის ნომერი</p>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900 text-xl tracking-wider">{order.orderNumber}</span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-2 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors print:hidden text-stone-500 hover:text-emerald-600"
                      title="ნომრის კოპირება"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">თარიღი</p>
                  <p className="font-medium text-stone-900 text-lg">
                    {order.createdAt.toLocaleDateString('ka-GE', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                    <span className="text-sm text-stone-400 ml-2">
                        {order.createdAt.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">გადახდის მეთოდი</p>
                  <p className="font-medium text-stone-900 flex items-center gap-2">
                    {order.paymentMethod === 'cash' ? (
                        <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            ადგილზე გადახდა
                        </>
                    ) : 'საბანკო გადარიცხვა'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">სრული ღირებულება</p>
                  <p className="font-bold text-emerald-700 text-2xl">₾{order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 print:shadow-none print:border-t print:border-b-0 print:border-x-0 print:rounded-none">
              <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 print:text-stone-900" />
                საკონტაქტო ინფორმაცია
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-stone-500 text-sm mb-1">მიმღები</p>
                  <p className="font-bold text-stone-900 text-lg">
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-stone-500 text-sm mb-1">ტელეფონი</p>
                  <p className="font-bold text-stone-900 text-lg">{order.customerInfo.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-stone-500 text-sm mb-1">მისამართი</p>
                  <p className="font-medium text-stone-900 text-lg">
                    {order.deliveryInfo.city}, {order.deliveryInfo.address}
                  </p>
                </div>
                {order.deliveryInfo.comment && (
                  <div className="md:col-span-2 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <p className="text-stone-500 text-xs mb-1 font-bold uppercase">კომენტარი კურიერისთვის</p>
                    <p className="text-stone-800">"{order.deliveryInfo.comment}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 print:shadow-none print:border-t print:border-b-0 print:border-x-0 print:rounded-none">
              <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600 print:text-stone-900" />
                პროდუქტები
              </h3>
              <div className="space-y-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start border-b border-stone-100 pb-6 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-stone-100 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-100 print:w-12 print:h-12">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-4 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-lg line-clamp-2">{item.product.name}</h4>
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-stone-500 font-medium">
                          {item.quantity} ცალი x ₾{item.price.toFixed(2)}
                        </div>
                        <span className="font-bold text-stone-900 text-lg">
                          ₾{item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Calculations */}
              <div className="border-t border-stone-100 mt-6 pt-6 space-y-3 bg-stone-50/50 p-6 rounded-2xl print:bg-transparent">
                <div className="flex justify-between text-stone-600">
                  <span>პროდუქტების ღირებულება</span>
                  <span className="font-medium">₾{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>მიწოდება</span>
                  <span className={`font-medium ${order.shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {order.shippingCost === 0 ? 'უფასო' : `₾${order.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-stone-900 pt-4 border-t border-stone-200 mt-2">
                  <span>სულ გადასახდელი</span>
                  <span className="text-emerald-700">₾{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- SIDEBAR (RIGHT) --- */}
          <div className="space-y-6 print:hidden">

            {/* Contact Info (Timeline Removed) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">დახმარება გჭირდებათ?</h3>
              <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                თუ შეკვეთასთან დაკავშირებით რაიმე კითხვა გაქვთ, ჩვენი გუნდი მზადაა დაგეხმაროთ:
              </p>
              <div className="space-y-3">
                <a href="tel:+995555123456" className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group border border-transparent hover:border-emerald-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">დაგვირეკეთ</span>
                        <span className="font-bold text-stone-800 text-lg group-hover:text-emerald-700">+995 555 123 456</span>
                    </div>
                </a>
                <a href="mailto:info@lifestore.ge" className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group border border-transparent hover:border-emerald-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">მოგვწერეთ</span>
                        <span className="font-bold text-stone-800 group-hover:text-emerald-700">info@lifestore.ge</span>
                    </div>
                </a>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                to="/"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                მთავარზე დაბრუნება
              </Link>
              <Link
                to="/products"
                className="w-full bg-white border-2 border-stone-100 hover:border-emerald-500 text-stone-700 hover:text-emerald-700 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Package className="w-5 h-5" />
                შოპინგის გაგრძელება
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;