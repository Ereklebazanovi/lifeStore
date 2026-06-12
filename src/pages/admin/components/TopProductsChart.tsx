// src/pages/admin/components/TopProductsChart.tsx
import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, PackageX } from "lucide-react";
import type { Order, Product } from "../../../types";
import type { SortBy } from "./AnalyticsDashboard";
import { useProductStore } from "../../../store/productStore";

interface TopProductsChartProps {
  orders: Order[];
  sortBy: SortBy;
}

const TOP_N = 10;

/** პროდუქტის ჯამური მარაგი — ვარიანტებიანი თუ მარტივი */
const totalStockOf = (p: Product): number => {
  if (p.hasVariants && p.variants?.length) {
    return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  }
  return p.totalStock ?? p.stock ?? 0;
};

const TopProductsChart: React.FC<TopProductsChartProps> = ({ orders, sortBy }) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showNotSold, setShowNotSold] = useState(false);

  const allCatalogProducts = useProductStore((s) => s.products);

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

    const metric = (p: { qty: number; revenue: number }) =>
      sortBy === "revenue" ? p.revenue : p.qty;

    return Array.from(map.values()).sort((a, b) => metric(b) - metric(a));
  }, [orders, sortBy]);

  const metricOf = (p: { qty: number; revenue: number }) =>
    sortBy === "revenue" ? p.revenue : p.qty;

  const displayedProducts = showAll ? allProducts : allProducts.slice(0, TOP_N);
  const topProducts = displayedProducts;
  const maxMetric = allProducts[0] ? metricOf(allProducts[0]) : 1;

  // ამ პერიოდში არ გაყიდული პროდუქტები (კატალოგი − გაყიდული). მაღალი მარაგი ზევით.
  const notSoldProducts = useMemo(() => {
    const soldIds = new Set<string>();
    orders
      .filter((o) => o.orderStatus !== "cancelled")
      .forEach((o) => o.items.forEach((it) => it.productId && soldIds.add(it.productId)));

    return allCatalogProducts
      .filter((p) => p.isActive !== false && !soldIds.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, stock: totalStockOf(p), image: p.images?.[0] }))
      .sort((a, b) => b.stock - a.stock);
  }, [orders, allCatalogProducts]);

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
            {showAll ? `სულ ${allProducts.length}` : `Top ${Math.min(TOP_N, allProducts.length)}`}
          </span>
        </h3>
        <span className="text-xs text-gray-400">ცალი · ₾</span>
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {topProducts.map((p, i) => (
          <div key={i} className="relative flex items-center gap-3 group">
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover:flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 min-w-max pointer-events-none">
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                />
              )}
              <div>
                <p className="text-xs font-semibold text-gray-800 max-w-xs">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.qty} ც. · ₾{p.revenue.toFixed(0)}</p>
              </div>
            </div>

            {/* Rank badge */}
            <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">
              {i + 1}
            </span>

            {/* Thumbnail */}
            {p.image ? (
              <img
                src={p.image}
                alt=""
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
            )}

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-700 truncate pr-2">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {/* აქტიური საზომი ხაზგასმულია */}
                  <span className={sortBy === "quantity" ? "text-xs font-semibold text-gray-800" : "text-xs text-gray-400"}>
                    {p.qty} ც.
                  </span>
                  <span className={sortBy === "revenue" ? "text-xs font-semibold text-gray-800 w-16 text-right" : "text-xs text-gray-400 w-16 text-right"}>
                    ₾{p.revenue.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rankColor(i)}`}
                  style={{ width: `${(metricOf(p) / maxMetric) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show all / collapse */}
      {allProducts.length > TOP_N && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> დახურვა</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> ყველას ნახვა ({allProducts.length})</>
          )}
        </button>
      )}

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
              searchResults.map((p, i) => (
                <div
                  key={i}
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

      {/* არ გაყიდული პროდუქტები ამ პერიოდში */}
      {notSoldProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setShowNotSold((v) => !v)}
            className="flex items-center justify-between w-full text-xs"
          >
            <span className="flex items-center gap-1.5 font-medium text-gray-600">
              <PackageX className="w-3.5 h-3.5 text-gray-400" />
              ამ პერიოდში არ გაყიდულა
              <span className="text-gray-400">({notSoldProducts.length})</span>
            </span>
            {showNotSold ? (
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          {showNotSold && (
            <div className="mt-2 space-y-1 max-h-44 overflow-y-auto">
              {notSoldProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-gray-50"
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-200 shrink-0" />
                  )}
                  <span className="text-gray-700 truncate flex-1">{p.name}</span>
                  <span
                    className={`shrink-0 ${p.stock > 0 ? "text-gray-500" : "text-gray-300"}`}
                  >
                    მარაგი: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
