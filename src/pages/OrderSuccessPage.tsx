import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Clock, ArrowLeft, Copy, Check } from 'lucide-react';
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
        showToast('შეკვეთის მონაცემების ჩატვირთვა ვერ მოხერხდა', 'error');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">შეკვეთა არ მოიძებნა</h1>
          <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'მუშავდება';
      case 'confirmed': return 'დადასტურებული';
      case 'shipped': return 'გზაშია';
      case 'delivered': return 'მიტანილი';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            შეკვეთა წარმატებით გაფორმდა!
          </h1>
          <p className="text-stone-600 max-w-md mx-auto">
            თქვენი შეკვეთა მიღებულია და მალე დაიწყება დამუშავება. ანგარიშის დეტალები ქვემოთაა მოცემული.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Info Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-900">შეკვეთის ინფორმაცია</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                  {getStatusText(order.orderStatus)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">შეკვეთის ნომერი</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-lg">{order.orderNumber}</span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1 hover:bg-stone-100 rounded transition-colors"
                      title="ნომრის კოპირება"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">შეკვეთის თარიღი</p>
                  <p className="font-medium text-stone-900">
                    {order.createdAt.toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">სრული თანხა</p>
                  <p className="font-bold text-emerald-700 text-lg">₾{order.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">გადახდის მეთოდი</p>
                  <p className="font-medium text-stone-900">
                    {order.paymentMethod === 'cash' ? 'ადგილზე გადახდა' : 'ბანკი'}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                მიწოდების ინფორმაცია
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 mb-1">მიღება</p>
                  <p className="font-medium text-stone-900">
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">ტელეფონი</p>
                  <p className="font-medium text-stone-900">{order.customerInfo.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">ქალაქი</p>
                  <p className="font-medium text-stone-900">{order.deliveryInfo.city}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-1">მისამართი</p>
                  <p className="font-medium text-stone-900">{order.deliveryInfo.address}</p>
                </div>
                {order.deliveryInfo.comment && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-stone-500 mb-1">კომენტარი</p>
                    <p className="font-medium text-stone-900">{order.deliveryInfo.comment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                შეკვეთილი პროდუქტები
              </h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-full h-full p-4 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-stone-900">{item.product.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-stone-500">
                          {item.quantity} x ₾{item.price.toFixed(2)}
                        </span>
                        <span className="font-bold text-stone-900">
                          ₾{item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-stone-100 mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>პროდუქტები:</span>
                  <span>₾{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>მიწოდება:</span>
                  <span>{order.shippingCost === 0 ? 'უფასო' : `₾${order.shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-100">
                  <span>სულ:</span>
                  <span className="text-emerald-700">₾{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Next Steps */}
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                შემდეგი ნაბიჯები
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-emerald-800">დადასტურება</p>
                    <p className="text-emerald-700">მენეჯერი დაგიტანთ 1-2 საათში</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-emerald-800">მომზადება</p>
                    <p className="text-emerald-700">პროდუქტების შეკვრა</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-stone-300 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-emerald-800">მიწოდება</p>
                    <p className="text-emerald-700">თბილისში - იგივე დღეს</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">კითხვები?</h3>
              <div className="space-y-3 text-sm">
                <p className="text-stone-600">
                  შეკვეთასთან დაკავშირებული კითხვების შემთხვევაში დაგვიკავშირდით:
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-stone-900">📞 +995 555 123 456</p>
                  <p className="font-medium text-stone-900">📧 info@lifestore.ge</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                მთავარ გვერდზე დაბრუნება
              </Link>
              <Link
                to="/products"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Package className="w-5 h-5" />
                პროდუქტების ნახვა
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;