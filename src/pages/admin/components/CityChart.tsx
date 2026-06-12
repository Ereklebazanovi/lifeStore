// src/pages/admin/components/CityChart.tsx
import React, { useState, useMemo } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "../../../types";
import type { SortBy } from "./AnalyticsDashboard";

interface CityChartProps {
  orders: Order[];
  sortBy: SortBy;
}

const TOP_N = 8;

/** ქალაქის სახელის ნორმალიზაცია — სხვადასხვა აკრეფა ერთ ჯგუფში მოვა */
const normalizeCity = (raw?: string): string => {
  const c = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!c) return "უცნობი";
  const lower = c.toLowerCase();
  // ხშირი ვარიანტები — თბილისი
  if (["tbilisi", "tbilis", "თბილისი", "тбилиси"].includes(lower)) return "თბილისი";
  return c;
};

const CityChart: React.FC<CityChartProps> = ({ orders, sortBy }) => {
  const [showAll, setShowAll] = useState(false);

  const cities = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();

    orders
      .filter((o) => o.orderStatus !== "cancelled")
      .forEach((o) => {
        const key = normalizeCity(o.deliveryInfo?.city);
        const existing = map.get(key);
        if (existing) {
          existing.revenue += o.totalAmount ?? 0;
          existing.count += 1;
        } else {
          map.set(key, { revenue: o.totalAmount ?? 0, count: 1 });
        }
      });

    // ქალაქებზე "რაოდენობა" = შეკვეთების რაოდენობა
    const metric = (c: { revenue: number; count: number }) =>
      sortBy === "revenue" ? c.revenue : c.count;

    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => metric(b) - metric(a));
  }, [orders, sortBy]);

  const metricOf = (c: { revenue: number; count: number }) =>
    sortBy === "revenue" ? c.revenue : c.count;
  const totalMetric = cities.reduce((s, c) => s + metricOf(c), 0);
  const maxMetric = cities[0] ? metricOf(cities[0]) : 1;
  const displayed = showAll ? cities : cities.slice(0, TOP_N);

  if (cities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-72 text-gray-400 text-sm">
        მონაცემები არ არის არჩეულ პერიოდში
      </div>
    );
  }

  const rankColor = (i: number) => {
    if (i === 0) return "bg-teal-500";
    if (i === 1) return "bg-teal-400";
    if (i === 2) return "bg-teal-300";
    return "bg-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-500" />
          გაყიდვები ქალაქების მიხედვით
          <span className="ml-1 text-xs font-normal text-gray-400">
            {showAll ? `სულ ${cities.length}` : `Top ${Math.min(TOP_N, cities.length)}`}
          </span>
        </h3>
        <span className="text-xs text-gray-400">შეკვ. · ₾</span>
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
                    {/* აქტიური საზომი ხაზგასმულია */}
                    <span className={sortBy === "quantity" ? "text-xs font-semibold text-gray-800" : "text-xs text-gray-400"}>
                      {c.count} შეკვ.
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
      {cities.length > TOP_N && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> დახურვა</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> ყველას ნახვა ({cities.length})</>
          )}
        </button>
      )}
    </div>
  );
};

export default CityChart;
