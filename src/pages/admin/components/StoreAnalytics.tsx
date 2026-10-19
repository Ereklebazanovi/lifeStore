import React, { useEffect, useMemo, useState } from "react";
import { Store } from "lucide-react";
import { StoreTransferService } from "../../../services/storeTransferService";
import { summarizeStoreTransfers } from "../../../utils/storeReporting";
import type { StoreTransfer } from "../../../types/storeTransfer";

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
  const summary = useMemo(
    () => summarizeStoreTransfers(transfers, dateRange),
    [transfers, dateRange],
  );
  return (
    <section
      aria-label="მაღაზიის ანალიტიკა"
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-5"
    >
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-emerald-600" />
        <div>
          <h3 className="font-semibold text-gray-900">მაღაზია</h3>
          <p className="text-xs text-gray-500 mt-1">
            ცინცაძის 2 · საქონლის მოძრაობა არჩეულ პერიოდში
          </p>
        </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "გატანების რაოდენობა", value: summary.outCount },
              { label: "გატანილია · ცალი", value: summary.outQuantity },
              { label: "დაბრუნებულია · ცალი", value: summary.returnQuantity },
              { label: "წმინდა გატანა · ცალი", value: summary.netQuantity },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-gray-50 p-3 sm:p-4"
                role="group"
                aria-label={item.label}
              >
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-bold text-xl text-gray-900 mt-2">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {!summary.products.length ? (
            <p className="text-sm text-gray-500">
              ამ პერიოდში მაღაზიის მოძრაობა არ არის.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left py-3 font-medium">პროდუქტი</th>
                    <th className="text-right px-3 font-medium">გატანა</th>
                    <th className="text-right px-3 font-medium">დაბრუნება</th>
                    <th className="text-right pl-3 font-medium">წმინდა</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.products.map((item) => (
                    <tr
                      key={JSON.stringify([item.productId, item.variantId])}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 pr-3">{item.name}</td>
                      <td className="text-right px-3">{item.outQuantity}</td>
                      <td className="text-right px-3">{item.returnQuantity}</td>
                      <td className="text-right pl-3 font-semibold">
                        {item.netQuantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-500">
            წმინდა გატანა = გატანილი − დაბრუნებული. მაღაზიის გატარებები
            გაყიდვების შემოსავალში არ შედის.
          </p>
        </>
      )}
    </section>
  );
};
export default StoreAnalytics;
