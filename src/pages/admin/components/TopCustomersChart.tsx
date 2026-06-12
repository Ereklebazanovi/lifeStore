// src/pages/admin/components/TopCustomersChart.tsx
import React, { useState, useMemo } from "react";
import { Users, ChevronDown, ChevronUp, Globe, Phone, User, MoreHorizontal, HelpCircle } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import type { Order } from "../../../types";

interface TopCustomersChartProps {
  orders: Order[];
}

const TOP_N = 8;

const fmt = (n: number) => `₾${Math.round(n).toLocaleString("ka-GE")}`;

type SourceMeta = { label: string; color: string; Icon: React.ComponentType<any> };

// რეალური ბრენდ-აიქონები სოციალურებზე, ნეიტრალური ნაცრისფერი დანარჩენზე
const SOURCE_META: Record<string, SourceMeta> = {
  instagram: { label: "Instagram", color: "#E1306C", Icon: SiInstagram },
  facebook: { label: "Facebook", color: "#1877F2", Icon: SiFacebook },
  tiktok: { label: "TikTok", color: "#111827", Icon: SiTiktok },
  website: { label: "ვებსაიტი", color: "#6B7280", Icon: Globe },
  phone: { label: "ტელეფონი", color: "#6B7280", Icon: Phone },
  personal: { label: "პირადად", color: "#6B7280", Icon: User },
  other: { label: "სხვა", color: "#9CA3AF", Icon: MoreHorizontal },
  unknown: { label: "უცნობი", color: "#CBD5E1", Icon: HelpCircle },
};

const TopCustomersChart: React.FC<TopCustomersChartProps> = ({ orders }) => {
  const [showAll, setShowAll] = useState(false);

  const { customers, repeatCount } = useMemo(() => {
    // ტელეფონით ვაჯგუფებთ — ერთი ადამიანი ერთ ჩანაწერად
    const map = new Map<
      string,
      { name: string; orders: number; total: number; sources: Record<string, number> }
    >();

    orders
      .filter((o) => o.orderStatus !== "cancelled")
      .forEach((o) => {
        const phone = (o.customerInfo?.phone ?? "").replace(/\D/g, "");
        if (!phone) return; // ტელეფონის გარეშე ვერ ვაიდენტიფიცირებთ
        const name =
          `${o.customerInfo?.firstName ?? ""} ${o.customerInfo?.lastName ?? ""}`.trim() || phone;
        const src = o.source ?? "unknown";
        const ex = map.get(phone);
        if (ex) {
          ex.orders += 1;
          ex.total += o.totalAmount ?? 0;
          ex.sources[src] = (ex.sources[src] ?? 0) + 1;
        } else {
          map.set(phone, { name, orders: 1, total: o.totalAmount ?? 0, sources: { [src]: 1 } });
        }
      });

    // ყველაზე ხშირი წყარო თითო კლიენტზე
    const list = Array.from(map.values())
      .map((c) => {
        const topSource = Object.entries(c.sources).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
        return { name: c.name, orders: c.orders, total: c.total, source: topSource };
      })
      .sort((a, b) => b.total - a.total);

    return {
      customers: list,
      repeatCount: list.filter((c) => c.orders > 1).length,
    };
  }, [orders]);

  const maxTotal = customers[0]?.total ?? 1;
  const displayed = showAll ? customers : customers.slice(0, TOP_N);

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-72 text-gray-400 text-sm">
        მონაცემი არ არის
      </div>
    );
  }

  const rankColor = (i: number) => {
    if (i === 0) return "bg-rose-500";
    if (i === 1) return "bg-rose-400";
    if (i === 2) return "bg-rose-300";
    return "bg-gray-200";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          TOP კლიენტები
        </h3>
        {repeatCount > 0 && (
          <span className="text-xs text-gray-400">
            {repeatCount} მუდმივი (2+ ყიდვა)
          </span>
        )}
      </div>

      {/* Ranked list */}
      <div className="space-y-2.5">
        {displayed.map((c, i) => {
          const src = SOURCE_META[c.source] ?? SOURCE_META.unknown;
          const SrcIcon = src.Icon;
          return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1.5 min-w-0 pr-2">
                  {/* წყაროს რეალური ბრენდ-აიქონი */}
                  <SrcIcon size={13} color={src.color} title={src.label} className="shrink-0" />
                  <span className="text-xs text-gray-700 truncate">{c.name}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{c.orders} ყიდვა</span>
                  <span className="text-xs font-semibold text-gray-800 w-16 text-right">
                    {fmt(c.total)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rankColor(i)}`}
                  style={{ width: `${(c.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Show all / collapse */}
      {customers.length > TOP_N && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> დახურვა</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> ყველას ნახვა ({customers.length})</>
          )}
        </button>
      )}
    </div>
  );
};

export default TopCustomersChart;
