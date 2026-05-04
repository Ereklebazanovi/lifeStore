// src/pages/admin/components/KpiCards.tsx
import React from "react";
import { TrendingUp, ShoppingCart, BarChart2, XCircle } from "lucide-react";
import type { Order } from "../../../types";

interface KpiCardsProps {
  orders: Order[];
}

interface KpiCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  colorClass,
  bgClass,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
    <div className={`p-2.5 rounded-lg flex-shrink-0 ${bgClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  </div>
);

const KpiCards: React.FC<KpiCardsProps> = ({ orders }) => {
  const activeOrders = orders.filter((o) => o.orderStatus !== "cancelled");
  const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled");

  const totalRevenue = activeOrders.reduce(
    (sum, o) => sum + (o.totalAmount ?? 0),
    0
  );
  const orderCount = activeOrders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
  const cancelRate =
    orders.length > 0
      ? ((cancelledOrders.length / orders.length) * 100).toFixed(1)
      : "0.0";

  const cards: KpiCardProps[] = [
    {
      label: "ჯამური შემოსავალი",
      value: `₾${totalRevenue.toLocaleString("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `${orderCount} აქტიური შეკვეთა`,
      icon: TrendingUp,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      label: "შეკვეთების რაოდენობა",
      value: String(orders.length),
      subtext: `${orderCount} აქტიური · ${cancelledOrders.length} გაუქმებული`,
      icon: ShoppingCart,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    {
      label: "საშ. შეკვეთის ღირ. (AOV)",
      value: `₾${aov.toLocaleString("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "გაუქმებულების გარეშე",
      icon: BarChart2,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
    },
    {
      label: "გაუქმებული შეკვეთები",
      value: String(cancelledOrders.length),
      subtext: `სულ შეკვეთების ${cancelRate}%`,
      icon: XCircle,
      colorClass: cancelledOrders.length > 0 ? "text-red-500" : "text-gray-400",
      bgClass: cancelledOrders.length > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default KpiCards;
