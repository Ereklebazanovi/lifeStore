import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Zap, Eye, DollarSign } from 'lucide-react';
import type { Product } from '../../../types';

interface AdminStatsProps {
  products: Product[];
}

const AdminStats: React.FC<AdminStatsProps> = ({ products }) => {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.filter(p => !p.isActive).length;
  const lowStockProducts = products.filter(p => p.stock < 5).length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

  const stats = [
    {
      label: 'სულ პროდუქტები',
      value: totalProducts,
      icon: Package,
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      label: 'აქტიური პროდუქტები',
      value: activeProducts,
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      label: 'მარაგის ღირებულება',
      value: `₾${totalValue.toFixed(0)}`,
      icon: DollarSign,
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive'
    },
    {
      label: 'დაბალი მარაგი',
      value: lowStockProducts,
      icon: AlertTriangle,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      change: '-3%',
      changeType: 'negative'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-xl shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                stat.changeType === 'positive'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>

            {/* Mini chart placeholder */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-1">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${stat.bgColor} opacity-60`}
                    style={{
                      height: `${Math.random() * 16 + 8}px`,
                      animation: `fadeIn 0.5s ease-in-out ${i * 0.1}s both`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;