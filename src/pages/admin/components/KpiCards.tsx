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
  secondaryText?: string; // მეორე სტრიქონი — optional
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  secondaryText,
  icon: Icon,
  colorClass,
  bgClass,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
    <div className={`p-2.5 rounded-lg shrink-0 ${bgClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-emerald-600 font-medium mt-1">{subtext}</p>
      {secondaryText && (
        <p className="text-xs text-amber-500 font-medium mt-0.5">{secondaryText}</p>
      )}
    </div>
  </div>
);

const fmt = (n: number) =>
  `₾${n.toLocaleString("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCards: React.FC<KpiCardsProps> = ({ orders }) => {
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");
  const inProgressOrders = orders.filter((o) =>
    ["pending", "confirmed", "shipped"].includes(o.orderStatus)
  );
  const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled");
  const activeOrders = orders.filter((o) => o.orderStatus !== "cancelled");

  const confirmedRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const pendingRevenue = inProgressOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const activeCount = activeOrders.length;
  const aov = activeCount > 0
    ? activeOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) / activeCount
    : 0;

  const cancelRate = orders.length > 0
    ? ((cancelledOrders.length / orders.length) * 100).toFixed(1)
    : "0.0";

  const cards: KpiCardProps[] = [
    {
      label: "სულ გაყიდვები",
      value: fmt(confirmedRevenue + pendingRevenue),
      subtext: `აქედან ${fmt(confirmedRevenue)} მიტანილია`,
      secondaryText: pendingRevenue > 0
        ? `${fmt(pendingRevenue)} გზაშია / მუშავდება`
        : undefined,
      icon: TrendingUp,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      label: "შეკვეთების რაოდენობა",
      value: String(orders.length),
      subtext: `${activeCount} აქტიური · ${cancelledOrders.length} გაუქმებული`,
      icon: ShoppingCart,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    {
      label: "საშ. შეკვეთის ღირ. (AOV)",
      value: fmt(aov),
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
