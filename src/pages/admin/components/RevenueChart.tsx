// src/pages/admin/components/RevenueChart.tsx
import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import type { Order } from "../../../types";

interface RevenueChartProps {
  orders: Order[];
  dateRange: [Date, Date] | null; // null = "სულ"
}

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "seconds" in val)
    return new Date((val as { seconds: number }).seconds * 1000);
  return new Date(val as string | number);
};

type Granularity = "hour" | "day" | "month";

const getGranularity = (range: [Date, Date] | null): Granularity => {
  if (!range) return "month"; // "სულ" → ყოველთვის თვიური
  const diffDays = (range[1].getTime() - range[0].getTime()) / 86400000;
  if (diffDays <= 1) return "hour";
  if (diffDays <= 90) return "day";
  return "month";
};

const getBucketKey = (date: Date, g: Granularity): string => {
  if (g === "hour") {
    const h = date.getHours();
    return `${h}:00`;
  }
  if (g === "day") {
    const months = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
  // month
  const months = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Build all bucket keys in range so empty days still show
const buildAllBuckets = (range: [Date, Date] | null, g: Granularity): string[] => {
  if (!range) return [];
  const [start, end] = range;
  const keys: string[] = [];

  if (g === "hour") {
    for (let h = 0; h <= 23; h++) keys.push(`${h}:00`);
    return keys;
  }
  if (g === "day") {
    const months = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    while (cur <= end) {
      keys.push(`${cur.getDate()} ${months[cur.getMonth()]}`);
      cur.setDate(cur.getDate() + 1);
    }
    return keys;
  }
  // month
  const months = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    keys.push(`${months[cur.getMonth()]} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-blue-600 font-bold text-sm">₾{payload[0]?.value?.toFixed(2)}</p>
      <p className="text-gray-400 mt-0.5">{payload[0]?.payload?.count} შეკვ. (გაუქმებ. გარდა)</p>
    </div>
  );
};

const CustomDot = (props: any) => {
  const { cx, cy, value } = props;
  if (!value) return null;
  return (
    <circle cx={cx} cy={cy} r={4} fill="#2563EB" stroke="#fff" strokeWidth={2} />
  );
};

const RevenueChart: React.FC<RevenueChartProps> = ({ orders, dateRange }) => {
  const granularity = getGranularity(dateRange);

  const chartData = useMemo(() => {
    const activeOrders = orders.filter((o) => o.orderStatus !== "cancelled");

    // Aggregate
    const map = new Map<string, { revenue: number; count: number }>();
    activeOrders.forEach((o) => {
      const d = toDate(o.createdAt);
      const key = getBucketKey(d, granularity);
      const existing = map.get(key);
      if (existing) {
        existing.revenue += o.totalAmount ?? 0;
        existing.count += 1;
      } else {
        map.set(key, { revenue: o.totalAmount ?? 0, count: 1 });
      }
    });

    // "სულ"-ისთვის რეალური range გამოვიანგარიშოთ
    let effectiveDateRange = dateRange;
    if (!dateRange && activeOrders.length > 0) {
      const dates = activeOrders.map((o) => toDate(o.createdAt).getTime());
      effectiveDateRange = [new Date(Math.min(...dates)), new Date(Math.max(...dates))];
    }

    // Fill in empty buckets
    const allKeys = buildAllBuckets(effectiveDateRange, granularity);
    if (allKeys.length > 0) {
      return allKeys.map((key) => ({
        label: key,
        revenue: parseFloat((map.get(key)?.revenue ?? 0).toFixed(2)),
        count: map.get(key)?.count ?? 0,
      }));
    }

    // "სულ" — no empty fill, just what we have sorted
    return Array.from(map.entries())
      .map(([label, v]) => ({
        label,
        revenue: parseFloat(v.revenue.toFixed(2)),
        count: v.count,
      }));
  }, [orders, dateRange, granularity]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalCount = chartData.reduce((s, d) => s + d.count, 0);

  const granularityLabel =
    granularity === "hour" ? "საათობრივი" :
    granularity === "day" ? "დღიური" : "თვიური";

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-64 text-gray-400 text-sm">
        მონაცემები არ არის არჩეულ პერიოდში
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            გაყიდვების დინამიკა
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{granularityLabel}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">ყველა სტატუსი · გაუქმებულების გარეშე</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-500">
              სულ: <span className="font-semibold text-gray-800">₾{totalRevenue.toFixed(2)}</span>
            </span>
            <span className="text-xs text-gray-500">
              შეკვეთა: <span className="font-semibold text-gray-800">{totalCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        {granularity === "month" ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₾${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#EFF6FF" }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === chartData.length - 1 ? "#2563EB" : "#93C5FD"} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₾${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#DBEAFE", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
