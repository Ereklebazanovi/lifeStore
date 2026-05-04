// src/pages/admin/components/SourcePieChart.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Order, OrderSource } from "../../../types";

interface SourcePieChartProps {
  orders: Order[];
}

const SOURCE_CONFIG: Record<OrderSource | "unknown", { label: string; color: string }> = {
  instagram:  { label: "Instagram",  color: "#E1306C" },
  facebook:   { label: "Facebook",   color: "#1877F2" },
  website:    { label: "ვებსაიტი",   color: "#6366F1" },
  tiktok:     { label: "TikTok",     color: "#010101" },
  phone:      { label: "ტელეფონი",   color: "#F59E0B" },
  personal:   { label: "პირადად",    color: "#10B981" },
  other:      { label: "სხვა",       color: "#94A3B8" },
  unknown:    { label: "უცნობი",     color: "#CBD5E1" },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-500">{value} შეკვეთა · {inner.percent}%</p>
    </div>
  );
};

const SourcePieChart: React.FC<SourcePieChartProps> = ({ orders }) => {
  // Group by source
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    const key = o.source ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const total = orders.length;

  const data = Object.entries(counts)
    .map(([key, value]) => {
      const cfg = SOURCE_CONFIG[key as keyof typeof SOURCE_CONFIG] ?? SOURCE_CONFIG.unknown;
      return {
        name: cfg.label,
        value,
        color: cfg.color,
        percent: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      };
    })
    .sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-72 text-gray-400 text-sm">
        მონაცემები არ არის არჩეულ პერიოდში
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">შეკვეთების წყაროები</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary rows */}
      <div className="mt-3 space-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-800">{entry.value} შეკვ.</span>
              <span className="text-gray-400 w-10 text-right">{entry.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcePieChart;
