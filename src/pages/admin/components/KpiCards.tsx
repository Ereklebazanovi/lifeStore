// src/pages/admin/components/KpiCards.tsx
import React from "react";
import { TrendingUp, ShoppingCart, BarChart2, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import type { Order } from "../../../types";

interface KpiCardsProps {
  orders: Order[];
  /** წინა თანაბარი პერიოდის შეკვეთები — Growth %-ის გამოსათვლელად. undefined = "სულ" (შედარება არ ჩანს) */
  previousOrders?: Order[];
  /** წინა პერიოდის თარიღების წარწერა (მაგ. "1 მაი – 12 მაი") */
  comparisonLabel?: string;
  /** კონტექსტური წინსიტყვა (მაგ. "გასულ თვეს", "გუშინ") */
  comparisonPrefix?: string;
}

interface Delta {
  pct: number | null; // null = წინა პერიოდი ცარიელი იყო (ახალი)
  positiveIsGood: boolean; // false → ზრდა ცუდია (გაუქმებები)
}

interface KpiCardProps {
  label: string;
  value: string;
  subtext: string;
  secondaryText?: string; // მეორე სტრიქონი — optional
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  delta?: Delta;
  /** ღია შედარება — წინა პერიოდის მნიშვნელობა + თარიღი, თვალწინ (მაგ. "₾5,725 · 1–12 მაი") */
  comparison?: string;
}

const DeltaBadge: React.FC<{ delta: Delta }> = ({ delta }) => {
  const { pct, positiveIsGood } = delta;

  if (pct === null) {
    // წინა პერიოდი ცარიელი იყო, ახლა არის — "ახალი"
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
        ახალი
      </span>
    );
  }

  if (pct === 0) {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
        0%
      </span>
    );
  }

  const isUp = pct > 0;
  const good = isUp === positiveIsGood; // ზრდა კარგია? თუ კლება კარგია?
  const colors = good
    ? "text-emerald-600 bg-emerald-50"
    : "text-red-500 bg-red-50";
  const Arrow = isUp ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${colors}`}>
      <Arrow className="w-3 h-3" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  secondaryText,
  icon: Icon,
  colorClass,
  bgClass,
  delta,
  comparison,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
    <div className={`p-2.5 rounded-lg shrink-0 ${bgClass}`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {delta && <DeltaBadge delta={delta} />}
      </div>
      <p className="text-xs text-emerald-600 font-medium mt-1">{subtext}</p>
      {secondaryText && (
        <p className="text-xs text-amber-500 font-medium mt-0.5">{secondaryText}</p>
      )}
      {comparison && (
        <p className="text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100">
          {comparison}
        </p>
      )}
    </div>
  </div>
);

const fmt = (n: number) =>
  `₾${n.toLocaleString("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** ერთი პერიოდის ძირითადი მეტრიკები — კოდი ითვლის, არა AI */
const computeMetrics = (orders: Order[]) => {
  const delivered = orders.filter((o) => o.orderStatus === "delivered");
  const inProgress = orders.filter((o) =>
    ["pending", "confirmed", "shipped"].includes(o.orderStatus)
  );
  const cancelled = orders.filter((o) => o.orderStatus === "cancelled");
  const active = orders.filter((o) => o.orderStatus !== "cancelled");

  const confirmedRevenue = delivered.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const pendingRevenue = inProgress.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const totalSales = confirmedRevenue + pendingRevenue;

  const aov = active.length > 0
    ? active.reduce((s, o) => s + (o.totalAmount ?? 0), 0) / active.length
    : 0;

  return {
    totalSales,
    confirmedRevenue,
    pendingRevenue,
    orderCount: orders.length,
    activeCount: active.length,
    cancelledCount: cancelled.length,
    aov,
  };
};

/** პროცენტული ცვლილება მიმდინარე vs წინა */
const computeDelta = (current: number, previous: number, positiveIsGood = true): Delta => {
  if (previous === 0) {
    return { pct: current > 0 ? null : 0, positiveIsGood };
  }
  return { pct: ((current - previous) / previous) * 100, positiveIsGood };
};

const KpiCards: React.FC<KpiCardsProps> = ({ orders, previousOrders, comparisonLabel, comparisonPrefix }) => {
  const cur = computeMetrics(orders);
  const prev = previousOrders ? computeMetrics(previousOrders) : null;

  const cancelRate = cur.orderCount > 0
    ? ((cur.cancelledCount / cur.orderCount) * 100).toFixed(1)
    : "0.0";

  // ღია შედარება — ზუსტად რა მნიშვნელობას და რა პერიოდს ადარებს, თვალწინ
  // მაგ. "გასულ თვეს: ₾5,725.00 · 1–12 მაი"
  const cmp = (prevValue: string) => {
    if (!prev || !comparisonLabel) return undefined;
    const prefix = comparisonPrefix ?? "წინა პერიოდი";
    return `${prefix}: ${prevValue} · ${comparisonLabel}`;
  };

  const cards: KpiCardProps[] = [
    {
      label: "სულ გაყიდვები",
      value: fmt(cur.totalSales),
      subtext: `აქედან ${fmt(cur.confirmedRevenue)} მიტანილია`,
      secondaryText: cur.pendingRevenue > 0
        ? `${fmt(cur.pendingRevenue)} გზაშია / მუშავდება`
        : undefined,
      icon: TrendingUp,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      delta: prev ? computeDelta(cur.totalSales, prev.totalSales) : undefined,
      comparison: prev ? cmp(fmt(prev.totalSales)) : undefined,
    },
    {
      label: "შეკვეთების რაოდენობა",
      value: String(cur.orderCount),
      subtext: `${cur.activeCount} აქტიური · ${cur.cancelledCount} გაუქმებული`,
      icon: ShoppingCart,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
      delta: prev ? computeDelta(cur.orderCount, prev.orderCount) : undefined,
      comparison: prev ? cmp(`${prev.orderCount} შეკვ.`) : undefined,
    },
    {
      label: "საშ. შეკვეთის ღირ. (AOV)",
      value: fmt(cur.aov),
      subtext: "გაუქმებულების გარეშე",
      icon: BarChart2,
      colorClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
      delta: prev ? computeDelta(cur.aov, prev.aov) : undefined,
      comparison: prev ? cmp(fmt(prev.aov)) : undefined,
    },
    {
      label: "გაუქმებული შეკვეთები",
      value: String(cur.cancelledCount),
      subtext: `სულ შეკვეთების ${cancelRate}%`,
      icon: XCircle,
      colorClass: cur.cancelledCount > 0 ? "text-red-500" : "text-gray-400",
      bgClass: cur.cancelledCount > 0 ? "bg-red-50" : "bg-gray-50",
      // გაუქმებების ზრდა ცუდია → positiveIsGood = false
      delta: prev ? computeDelta(cur.cancelledCount, prev.cancelledCount, false) : undefined,
      comparison: prev ? cmp(`${prev.cancelledCount} გაუქმ.`) : undefined,
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
