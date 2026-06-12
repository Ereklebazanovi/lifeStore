// src/pages/admin/components/CategoryChart.tsx
import React, { useState, useMemo } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "../../../types";
import type { SortBy } from "./AnalyticsDashboard";

interface CategoryChartProps {
  orders: Order[];
  sortBy: SortBy;
}

const TOP_N = 8;

const CategoryChart: React.FC<CategoryChartProps> = ({ orders, sortBy }) => {
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, { revenue: number; qty: number }>();

    orders
      .filter((o) => o.orderStatus !== "cancelled")
      .forEach((o) => {
        o.items.forEach((item) => {
          const key = (item.product?.category ?? "").trim() || "უკატეგორიო";
          const revenue = item.total ?? item.price * item.quantity;
          const existing = map.get(key);
          if (existing) {
            existing.revenue += revenue;
            existing.qty += item.quantity;
          } else {
            map.set(key, { revenue, qty: item.quantity });
          }
        });
      });

    const metric = (c: { revenue: number; qty: number }) =>
      sortBy === "revenue" ? c.revenue : c.qty;

    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => metric(b) - metric(a));
  }, [orders, sortBy]);

  const metricOf = (c: { revenue: number; qty: number }) =>
    sortBy === "revenue" ? c.revenue : c.qty;
  const totalMetric = categories.reduce((s, c) => s + metricOf(c), 0);
  const maxMetric = categories[0] ? metricOf(categories[0]) : 1;
  const displayed = showAll ? categories : categories.slice(0, TOP_N);

  if (categories.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-72 text-gray-400 text-sm">
        მონაცემები არ არის არჩეულ პერიოდში
      </div>
    );
  }

  const rankColor = (i: number) => {
    if (i === 0) return "bg-violet-500";
    if (i === 1) return "bg-violet-400";
    if (i === 2) return "bg-violet-300";
    return "bg-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" />
          კატეგორიების მიხედვით
          <span className="ml-1 text-xs font-normal text-gray-400">
            {showAll ? `სულ ${categories.length}` : `Top ${Math.min(TOP_N, categories.length)}`}
          </span>
        </h3>
        <span className="text-xs text-gray-400">ცალი · ₾</span>
      </div>

      {/* Ranked list */}
      <div className="space-y-2.5">
        {displayed.map((c, i) => {
          const metric = metricOf(c);
          const pct = totalMetric > 0 ? ((metric / totalMetric) * 100).toFixed(0) : "0";
          return (
            <div key={c.name} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-700 truncate pr-2">{c.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* აქტიური საზომი ხაზგასმულია, მეორე ნაცრისფერი */}
                    <span className={sortBy === "quantity" ? "text-xs font-semibold text-gray-800" : "text-xs text-gray-400"}>
                      {c.qty} ც.
                    </span>
                    <span className={sortBy === "revenue" ? "text-xs font-semibold text-gray-800 w-16 text-right" : "text-xs text-gray-400 w-16 text-right"}>
                      ₾{c.revenue.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rankColor(i)}`}
                    style={{ width: `${(metric / maxMetric) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all / collapse */}
      {categories.length > TOP_N && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> დახურვა</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> ყველას ნახვა ({categories.length})</>
          )}
        </button>
      )}
    </div>
  );
};

export default CategoryChart;
