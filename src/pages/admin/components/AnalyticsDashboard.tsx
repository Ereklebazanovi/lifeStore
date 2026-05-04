// src/pages/admin/components/AnalyticsDashboard.tsx
import React, { useState, useMemo } from "react";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { Order } from "../../../types";
import KpiCards from "./KpiCards";

const { RangePicker } = DatePicker;

type PresetKey = "today" | "week" | "month" | "all";

interface AnalyticsDashboardProps {
  orders: Order[];
}

/** Firebase Timestamp ან Date — ორივე გვარდება */
const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "seconds" in val) {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  return new Date(val as string | number);
};

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "დღეს" },
  { key: "week", label: "ამ კვირაში" },
  { key: "month", label: "ამ თვეში" },
  { key: "all", label: "სულ" },
];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ orders }) => {
  const [preset, setPreset] = useState<PresetKey>("month");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const dateRange = useMemo((): [Date, Date] | null => {
    if (preset !== "all" && customRange === null) {
      const now = dayjs();
      if (preset === "today") return [now.startOf("day").toDate(), now.endOf("day").toDate()];
      if (preset === "week") return [now.startOf("week").toDate(), now.endOf("week").toDate()];
      if (preset === "month") return [now.startOf("month").toDate(), now.endOf("month").toDate()];
    }
    if (customRange) return [customRange[0].startOf("day").toDate(), customRange[1].endOf("day").toDate()];
    return null; // "სულ"
  }, [preset, customRange]);

  const filteredOrders = useMemo(() => {
    if (!dateRange) return orders;
    const [start, end] = dateRange;
    return orders.filter((o) => {
      const d = toDate(o.createdAt);
      return d >= start && d <= end;
    });
  }, [orders, dateRange]);

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    setCustomRange(null);
  };

  const handleCustomRange = (
    values: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (values && values[0] && values[1]) {
      setCustomRange([values[0], values[1]]);
      setPreset("all"); // reset preset highlight
    } else {
      setCustomRange(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ანალიტიკა</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredOrders.length} შეკვეთა არჩეულ პერიოდში
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Preset buttons */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PRESETS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    preset === key && !customRange
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom range picker */}
            <RangePicker
              size="small"
              value={customRange}
              onChange={handleCustomRange}
              allowClear
              placeholder={["დაწყება", "დასასრული"]}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards orders={filteredOrders} />

      {/* Placeholder for future charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-48 text-gray-400 text-sm">
          წყაროების ანალიტიკა — მომდევნო ეტაპი
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center h-48 text-gray-400 text-sm">
          პროდუქტების პერფორმანსი — მომდევნო ეტაპი
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
