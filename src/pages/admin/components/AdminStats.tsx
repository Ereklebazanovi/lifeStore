// src/pages/admin/components/AdminStats.tsx
import React from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import type { Product } from "../../../types";

interface AdminStatsProps {
  products: Product[];
}

const AdminStats: React.FC<AdminStatsProps> = ({ products }) => {
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const inactiveProducts = products.filter((p) => !p.isActive).length;
  const lowStockProducts = products.filter((p) => p.stock < 5).length;
  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  const stats = [
    {
      label: "სულ პროდუქტები",
      value: totalProducts,
      icon: Package,
      color: "blue",
      change: "+12%",
      isPositive: true,
    },
    {
      label: "აქტიური პროდუქტები",
      value: activeProducts,
      icon: CheckCircle,
      color: "emerald",
      change: "+8%",
      isPositive: true,
    },
    {
      label: "მარაგის ღირებულება",
      value: `₾${totalValue.toFixed(0)}`,
      // icon: DollarSign,
      color: "indigo",
      change: "+15%",
      isPositive: true,
    },
    {
      label: "დაბალი მარაგი",
      value: lowStockProducts,
      icon: AlertTriangle,
      color: "red",
      change: lowStockProducts > 0 ? "მოითხოვს ყურადღებას" : "ოპტიმალური",
      isPositive: lowStockProducts === 0,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        icon: "bg-blue-600 text-blue-100",
        border: "border-blue-600/20",
        hover: "hover:bg-slate-700/50 hover:border-blue-600/40"
      },
      emerald: {
        icon: "bg-emerald-600 text-emerald-100",
        border: "border-emerald-600/20",
        hover: "hover:bg-slate-700/50 hover:border-emerald-600/40"
      },
      red: {
        icon: "bg-red-600 text-red-100",
        border: "border-red-600/20",
        hover: "hover:bg-slate-700/50 hover:border-red-600/40"
      },
      indigo: {
        icon: "bg-indigo-600 text-indigo-100",
        border: "border-indigo-600/20",
        hover: "hover:bg-slate-700/50 hover:border-indigo-600/40"
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'emerald' ? 'bg-emerald-100' :
                stat.color === 'indigo' ? 'bg-indigo-100' :
                'bg-red-100'
              }`}>
                <Icon className={`w-4 h-4 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'emerald' ? 'text-emerald-600' :
                  stat.color === 'indigo' ? 'text-indigo-600' :
                  'text-red-600'
                }`} />
              </div>
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${stat.isPositive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                }
              `}>
                {stat.change}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;
