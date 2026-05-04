// src/pages/admin/components/TopProductsChart.tsx
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Order } from "../../../types";

interface TopProductsChartProps {
  orders: Order[];
}

const TOP_N = 10;

const TopProductsChart: React.FC<TopProductsChartProps> = ({ orders }) => {
  const [search, setSearch] = useState("");

  const allProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; image?: string }>();

    orders
      .filter((o) => o.orderStatus !== "cancelled")
      .forEach((o) => {
        o.items.forEach((item) => {
          const key = item.variantId
            ? `${item.productId}_${item.variantId}`
            : item.productId;

          const displayName =
            item.variantId && item.variant
              ? `${item.product.name} · ${item.variant.name}`
              : item.product.name;

          const existing = map.get(key);
          if (existing) {
            existing.qty += item.quantity;
            existing.revenue += item.total ?? item.price * item.quantity;
          } else {
            map.set(key, {
              name: displayName,
              qty: item.quantity,
              revenue: item.total ?? item.price * item.quantity,
              image: item.product.images?.[0],
            });
          }
        });
      });

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [orders]);

  const topProducts = allProducts.slice(0, TOP_N);
  const maxQty = topProducts[0]?.qty ?? 1;

  const searchResults = search.trim()
    ? allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (allProducts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-72 text-gray-400 text-sm">
        მონაცემები არ არის არჩეულ პერიოდში
      </div>
    );
  }

  const rankColor = (i: number) => {
    if (i === 0) return "bg-indigo-500";
    if (i === 1) return "bg-indigo-400";
    if (i === 2) return "bg-indigo-300";
    return "bg-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          TOP პროდუქტები
          <span className="ml-2 text-xs font-normal text-gray-400">
            Top {topProducts.length}
          </span>
        </h3>
        <span className="text-xs text-gray-400">ცალი · ₾</span>
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {topProducts.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3">
            {/* Rank badge */}
            <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">
              {i + 1}
            </span>

            {/* Thumbnail */}
            {p.image ? (
              <img
                src={p.image}
                alt={p.name}
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
            )}

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-700 truncate pr-2">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-gray-800">{p.qty} ც.</span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    ₾{p.revenue.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rankColor(i)}`}
                  style={{ width: `${(p.qty / maxQty) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="border-t border-gray-100 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="მოძებნე ნებისმიერი პროდუქტი..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {search.trim() && (
          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">ვერ მოიძებნა</p>
            ) : (
              searchResults.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50"
                >
                  <span className="text-gray-700 truncate flex-1 mr-3">{p.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-gray-800">{p.qty} ცალი</span>
                    <span className="text-gray-400">₾{p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProductsChart;
