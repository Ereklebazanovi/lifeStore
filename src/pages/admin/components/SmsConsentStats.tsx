// src/pages/admin/components/SmsConsentStats.tsx
// SMS თანხმობის ტესტი: არჩეულ პერიოდში რამდენს ჰკითხეს და რა უპასუხეს (მხოლოდ ადმინი).
import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { Order } from "../../../types";
import { listSmsConsents } from "../../../services/smsConsentService";
import type { SmsConsent } from "../../../services/smsConsentService";

interface SmsConsentStatsProps {
  /** პერიოდის შეკვეთები (ანალიტიკის ფილტრით) */
  orders: Order[];
  /** null = სულ */
  dateRange: [Date, Date] | null;
}

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

const SmsConsentStats: React.FC<SmsConsentStatsProps> = ({ orders, dateRange }) => {
  const [consents, setConsents] = useState<SmsConsent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    listSmsConsents()
      .then((list) => active && setConsents(list))
      .catch((error) => {
        console.error("SMS თანხმობების წაკითხვა ვერ მოხერხდა", error);
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!consents) return null;
    // პერიოდი ითვლება პირველი კითხვის დღით
    const inPeriod = consents.filter((c) => {
      if (!dateRange) return true;
      return !!c.askedAt && c.askedAt >= dateRange[0] && c.askedAt <= dateRange[1];
    });
    const count = (status: SmsConsent["status"]) => inPeriod.filter((c) => c.status === status).length;

    // ხელით გატარებული = ყველა წყარო საიტის გარდა (ძველ საიტის შეკვეთებს source შეიძლება არ ჰქონდეს)
    const manualPhones = new Set(
      orders
        .filter((o) => o.source && o.source !== "website")
        .map((o) => o.customerInfo?.phone)
        .filter(Boolean)
    );
    const askedPhones = new Set(consents.map((c) => c.phone));
    const manualAsked = [...manualPhones].filter((phone) => askedPhones.has(phone)).length;

    return {
      total: inPeriod.length,
      yes: count("yes"),
      no: count("no"),
      asked: count("asked"),
      manualTotal: manualPhones.size,
      manualAsked,
    };
  }, [consents, orders, dateRange]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="sms-consent-stats">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        SMS თანხმობა
      </h3>
      {failed ? (
        <p className="text-sm text-gray-500">მონაცემები ვერ ჩაიტვირთა</p>
      ) : !stats ? (
        <p className="text-sm text-gray-400">იტვირთება…</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "ჰკითხეს", value: stats.total, note: "" },
              { label: "კი", value: stats.yes, note: `${percent(stats.yes, stats.total)}%` },
              { label: "არა", value: stats.no, note: `${percent(stats.no, stats.total)}%` },
              { label: "პასუხი არ არის", value: stats.asked, note: `${percent(stats.asked, stats.total)}%` },
            ].map((item) => (
              <div key={item.label} className="border border-gray-100 rounded-lg p-3">
                <dt className="text-xs text-gray-500">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {item.value}
                  {item.note && stats.total > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{item.note}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-gray-700">
            ჰკითხეს <strong>{stats.manualAsked}</strong> / ხელით გატარებულიდან{" "}
            <strong>{stats.manualTotal}</strong>
            {stats.manualTotal > 0 && (
              <span className="text-gray-400"> ({percent(stats.manualAsked, stats.manualTotal)}%)</span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ერთი ნომერი = ერთი მყიდველი. ზედა ციფრები პირველი კითხვის დღით ითვლება.
          </p>
        </>
      )}
    </div>
  );
};

export default SmsConsentStats;
