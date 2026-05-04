// src/pages/admin/components/InsightsPanel.tsx
import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import type { Order } from "../../../types";

interface InsightsPanelProps {
  orders: Order[];
}

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "seconds" in val)
    return new Date((val as { seconds: number }).seconds * 1000);
  return new Date(val as string | number);
};

const GEO_DAYS = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const GEO_MONTHS = ["იანვ","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

const InsightsPanel: React.FC<InsightsPanelProps> = ({ orders }) => {
  const insights = useMemo(() => {
    const activeOrders = orders.filter((o) => o.orderStatus !== "cancelled");
    if (activeOrders.length === 0) return null;

    // Best & worst day by revenue
    const dayMap = new Map<string, { revenue: number; date: Date }>();
    activeOrders.forEach((o) => {
      const d = toDate(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = dayMap.get(key);
      if (existing) {
        existing.revenue += o.totalAmount ?? 0;
      } else {
        dayMap.set(key, { revenue: o.totalAmount ?? 0, date: new Date(d) });
      }
    });

    const days = Array.from(dayMap.values()).sort((a, b) => b.revenue - a.revenue);
    const bestDay = days[0] ?? null;
    const worstDay = days[days.length - 1] ?? null;

    // Top product by quantity
    const productMap = new Map<string, { name: string; qty: number; image?: string }>();
    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.variantId
          ? `${item.productId}_${item.variantId}`
          : item.productId;
        const name = item.variantId && item.variant
          ? `${item.product.name} · ${item.variant.name}`
          : item.product.name;
        const image = item.product.images?.[0];
        const existing = productMap.get(key);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          productMap.set(key, { name, qty: item.quantity, image });
        }
      });
    });

    const topProduct = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty)[0] ?? null;

    return { bestDay, worstDay, topProduct };
  }, [orders]);

  if (!insights) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-full min-h-48 text-gray-400 text-sm">
        მონაცემები არ არის
      </div>
    );
  }

  const formatDay = (d: Date) =>
    `${GEO_DAYS[d.getDay()]}, ${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`;

  const { bestDay, worstDay, topProduct } = insights;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-800">მნიშვნელოვანი</h3>

      {/* Best day */}
      {bestDay && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-500 font-medium">ყველაზე აქტიური დღე</p>
            <p className="text-sm font-bold text-gray-800">{formatDay(bestDay.date)}</p>
          </div>
          <p className="text-sm font-bold text-blue-600 shrink-0">
            ₾{bestDay.revenue.toFixed(0)}
          </p>
        </div>
      )}

      {/* Worst day */}
      {worstDay && worstDay.date.getTime() !== bestDay?.date.getTime() && (
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
          <div className="p-2 bg-red-100 rounded-lg shrink-0">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 font-medium">ყველაზე სუსტი დღე</p>
            <p className="text-sm font-bold text-gray-800">{formatDay(worstDay.date)}</p>
          </div>
          <p className="text-sm font-bold text-red-500 shrink-0">
            ₾{worstDay.revenue.toFixed(0)}
          </p>
        </div>
      )}

      {/* Top product */}
      {topProduct && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
          <div className="shrink-0">
            {topProduct.image ? (
              <img
                src={topProduct.image}
                alt={topProduct.name}
                className="w-10 h-10 rounded-lg object-cover border border-amber-100"
              />
            ) : (
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-500 font-medium">ყველაზე გაყიდვადი</p>
            <p className="text-sm font-bold text-gray-800 truncate">{topProduct.name}</p>
          </div>
          <p className="text-xs font-semibold text-amber-600 shrink-0">
            {topProduct.qty} ც.
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
