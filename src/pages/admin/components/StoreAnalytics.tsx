import React, { useEffect, useMemo, useState } from "react";
import { Store } from "lucide-react";
import { StoreTransferService } from "../../../services/storeTransferService";
import { filterStoreTransfersByDate, summarizeStoreTransfers } from "../../../utils/storeReporting";
import type { StoreTransfer } from "../../../types/storeTransfer";
import { formatStoreMoney } from "./storeTransferUi";
import StoreTransferExportButton from "./StoreTransferExportButton";

const StoreAnalytics: React.FC<{ dateRange: [Date, Date] | null }> = ({
  dateRange,
}) => {
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(
    () =>
      StoreTransferService.subscribe(
        (items) => {
          setTransfers(items);
          setLoading(false);
          setError("");
        },
        (failure) => {
          setError(failure.message);
          setLoading(false);
        },
      ),
    [retry],
  );
  const filtered = useMemo(
    () => filterStoreTransfersByDate(transfers, dateRange),
    [transfers, dateRange],
  );
  const summary = useMemo(() => summarizeStoreTransfers(filtered, null), [filtered]);
  return (
    <section
      aria-label="მაღაზიის ანალიტიკა"
      className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Store className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">საქონლის მოძრაობა</h3>
          <p className="text-xs text-gray-500 mt-1">
            ცინცაძის 2 · არჩეული პერიოდი
          </p>
        </div>
        <StoreTransferExportButton transfers={filtered} disabled={loading || !!error} />
      </div>
      {error ? (
        <div role="alert" className="text-sm text-red-700">
          მაღაზიის მონაცემები ვერ ჩაიტვირთა.
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((value) => value + 1);
            }}
            className="ml-2 underline"
          >
            ხელახლა ცდა
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-500">იტვირთება…</p>
      ) : (
        <>
          <p role="group" aria-label="გადატანის ჩანაწერები" className="text-xs text-gray-500">
            {summary.outCount} გადატანა · {summary.returnCount} დაბრუნება
          </p>
          <div className="grid grid-cols-3 gap-3 border-b border-gray-100 pb-6">
            {[
              { label: "გადატანილია · ცალი", caption: "გადატანა · ცალი", value: summary.outQuantity, amount: summary.outValue },
              { label: "დაბრუნებულია · ცალი", caption: "დაბრუნება · ცალი", value: summary.returnQuantity, amount: summary.returnValue },
              { label: "გადატანილი − დაბრუნებული · ცალი", caption: "სხვაობა · ცალი", value: summary.netQuantity, amount: summary.netValue },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0"
                role="group"
                aria-label={item.label}
              >
                <p className="text-xs text-gray-500">{item.caption || item.label}</p>
                <p className="font-semibold text-2xl sm:text-3xl text-gray-900 mt-2 tabular-nums">
                  {item.value}
                </p>
                <p className="text-sm sm:text-base font-medium text-emerald-800 mt-2 tabular-nums break-words">
                  {formatStoreMoney(item.amount)}
                </p>
              </div>
            ))}
          </div>
          {!summary.products.length ? (
            <p className="text-sm text-gray-500">
              ამ პერიოდში გადატანა ან დაბრუნება არ არის.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                      <th className="text-left py-3 font-medium">პროდუქტი</th>
                      <th className="text-right px-3 font-medium">გადატანა · ცალი / ₾</th>
                      <th className="text-right px-3 font-medium">დაბრუნება · ცალი / ₾</th>
                      <th className="text-right pl-3 font-medium">სხვაობა · ცალი / ₾</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.products.map((item) => (
                      <tr
                        key={JSON.stringify([item.productId, item.variantId])}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 pr-3">{item.name}</td>
                        {[
                          [item.outQuantity, item.outValue],
                          [item.returnQuantity, item.returnValue],
                          [item.netQuantity, item.netValue],
                        ].map(([quantity, amount], index) => (
                          <td key={index} className={`text-right tabular-nums py-3 ${index === 2 ? "pl-3 font-semibold" : "px-3"}`}>
                            <p>{quantity}</p>
                            <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{formatStoreMoney(amount)}</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-gray-100">
                {summary.products.map((item) => (
                  <div key={JSON.stringify([item.productId, item.variantId])} className="py-4 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-gray-900 break-words">{item.name}</p>
                    <dl className="grid grid-cols-3 gap-3 mt-3 text-sm">
                      {[
                        { label: "გადატანა", value: item.outQuantity, amount: item.outValue },
                        { label: "დაბრუნება", value: item.returnQuantity, amount: item.returnValue },
                        { label: "სხვაობა", value: item.netQuantity, amount: item.netValue },
                      ].map((value) => (
                        <div key={value.label}>
                          <dt className="text-xs text-gray-500">{value.label}</dt>
                          <dd className="mt-1 tabular-nums text-gray-900">{value.value}</dd>
                          <dd className="mt-1 text-xs tabular-nums text-gray-500 break-words">{formatStoreMoney(value.amount)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-xs text-gray-500">
            სხვაობა = გადატანილი − დაბრუნებული. ეს მაღაზიის მიმდინარე ნაშთი არ არის.
          </p>
          <p className="text-xs text-gray-500">
            თანხები დათვლილია ჩანაწერში შენახული გასაყიდი ფასებით (იმდროინდელი ფასდაკლების ჩათვლით).
            პერიოდი საქონლის მოძრაობის თარიღით იფილტრება.
          </p>
        </>
      )}
    </section>
  );
};
export default StoreAnalytics;
