// src/pages/admin/components/AnalyticsDashboard.tsx
import React, { useState, useMemo } from "react";
import { DatePicker } from "antd";
import { Banknote, Hash } from "lucide-react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { Order } from "../../../types";
import KpiCards from "./KpiCards";
import SourcePieChart from "./SourcePieChart";
import TopProductsChart from "./TopProductsChart";
import RevenueChart from "./RevenueChart";
import TopCustomersChart from "./TopCustomersChart";
import CityChart from "./CityChart";
import CategoryChart from "./CategoryChart";

const { RangePicker } = DatePicker;

type PresetKey = "today" | "week" | "month" | "all";

/** ranked ჩარტების საერთო დახარისხება — თანხა (₾) თუ რაოდენობა */
export type SortBy = "revenue" | "quantity";

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

const GEO_MONTHS_SHORT = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

/** წინა პერიოდის ადამიანურად წასაკითხი ჩაწერა tooltip-ისთვის. pe — ექსკლუზიური ბოლო. */
const formatRange = (ps: Date, pe: Date): string => {
  // ბოლო ჩვენებადი დღე = ექსკლუზიური ბოლოს დღე (ან წინა, თუ ზუსტად შუაღამეა)
  const endDay = new Date(pe.getTime() - 1);
  const s = `${ps.getDate()} ${GEO_MONTHS_SHORT[ps.getMonth()]}`;
  const e = `${endDay.getDate()} ${GEO_MONTHS_SHORT[endDay.getMonth()]}`;
  return s === e ? s : `${s} – ${e}`;
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
  // ranked ჩარტების საერთო დახარისხება (პროდუქტები / კატეგორიები / ქალაქები)
  const [sortBy, setSortBy] = useState<SortBy>("revenue");

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

  // წინა პერიოდი — Growth %-ის შესადარებლად.
  //  • პრესეტებზე (დღეს/კვირა/თვე) → გადახტება ზუსტად ერთი ციკლი უკან,
  //    ანუ "ამ თვეში 1–12" ედარება "გასულ თვის 1–12"-ს (კალენდარულად).
  //  • custom range-ზე → იმავე სიგრძის უშუალოდ წინა ფანჯარა.
  //  • "სულ"-ზე (dateRange === null) → შედარება არ კეთდება.
  const comparison = useMemo(() => {
    if (!dateRange) return null;
    const [start, end] = dateRange;
    const now = dayjs();
    const startD = dayjs(start);
    const endD = dayjs(end);
    // მიმდინარე ფანჯარა მხოლოდ ახლანდელ მომენტამდე ითვლება (პარტიალური თვე და ა.შ.)
    const effEnd = endD.isAfter(now) ? now : endD;
    if (!effEnd.isAfter(startD)) return null;

    let prevStart: Dayjs;
    let prevEnd: Dayjs;

    // კონტექსტური წარწერა — ფილტრის მიხედვით ბუნებრივი სიტყვა
    let prefix = "წინა პერიოდი";

    if (!customRange && (preset === "today" || preset === "week" || preset === "month")) {
      const unit = preset === "today" ? "day" : preset; // "week" | "month"
      prevStart = startD.subtract(1, unit);
      // ბოლო დღეს სრულად ვითვლით — ემთხვევა ხელით თარიღით გაფილტვრას (სრული დღეები)
      prevEnd = effEnd.subtract(1, unit).endOf("day");
      prefix = preset === "today" ? "გუშინ" : preset === "week" ? "გასულ კვირას" : "გასულ თვეს";
    } else {
      // custom range — უშუალოდ წინა თანაბარი ფანჯარა
      const durationMs = effEnd.valueOf() - startD.valueOf();
      prevStart = dayjs(startD.valueOf() - durationMs);
      prevEnd = startD;
    }

    const ps = prevStart.toDate();
    const pe = prevEnd.toDate();
    const previousOrders = orders.filter((o) => {
      const d = toDate(o.createdAt);
      return d >= ps && d < pe;
    });

    return { previousOrders, label: formatRange(ps, pe), prefix };
  }, [orders, dateRange, preset, customRange]);

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
      <KpiCards
        orders={filteredOrders}
        previousOrders={comparison?.previousOrders}
        comparisonLabel={comparison?.label}
        comparisonPrefix={comparison?.prefix}
      />

      {/* Revenue Bar Chart — full width */}
      <RevenueChart orders={filteredOrders} dateRange={dateRange} />

      {/* Shared sort toggle — controls Products / Categories / Cities */}
      <div className="flex items-center justify-end gap-2.5 mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          დახარისხება
        </span>
        <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
          {([
            { key: "revenue", label: "თანხა", Icon: Banknote },
            { key: "quantity", label: "რაოდენობა", Icon: Hash },
          ] as const).map(({ key, label, Icon }) => {
            const active = sortBy === key;
            return (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-md transition-all ${
                  active
                    ? "bg-white text-indigo-600 font-semibold shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-200/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-indigo-500" : "text-gray-400"}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source + City + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SourcePieChart orders={filteredOrders} />
        <CityChart orders={filteredOrders} sortBy={sortBy} />
        <CategoryChart orders={filteredOrders} sortBy={sortBy} />
      </div>

      {/* Products + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProductsChart orders={filteredOrders} sortBy={sortBy} />
        <TopCustomersChart orders={filteredOrders} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
