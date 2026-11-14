// src/pages/admin/components/SmsConsentControls.tsx
// SMS თანხმობის ღილაკები (შეკვეთის ფორმა) და ბლოკი შეკვეთის ბარათისთვის.
import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { showToast } from "../../../components/ui/Toast";
import {
  describeSmsConsent,
  getSmsConsent,
  isSmsConsentPhone,
  setSmsConsent,
  SMS_CONSENT_LABELS,
} from "../../../services/smsConsentService";
import type { SmsConsent, SmsConsentStatus } from "../../../services/smsConsentService";

const OPTIONS: SmsConsentStatus[] = ["yes", "no", "asked"];

const ACTIVE_STYLE: Record<SmsConsentStatus, string> = {
  yes: "bg-emerald-600 border-emerald-600 text-white",
  no: "bg-red-600 border-red-600 text-white",
  asked: "bg-amber-500 border-amber-500 text-white",
};

interface SmsConsentButtonsProps {
  labelId: string;
  value: SmsConsentStatus | null;
  stored: SmsConsent | null;
  disabled?: boolean;
  onSelect: (value: SmsConsentStatus) => void;
}

/** კი / არა / პასუხი არ არის. "პასუხი არ არის" ბლოკდება, თუ ბაზაში უკვე კი ან არა წერია. */
export const SmsConsentButtons: React.FC<SmsConsentButtonsProps> = ({
  labelId,
  value,
  stored,
  disabled,
  onSelect,
}) => (
  <div role="group" aria-labelledby={labelId} className="grid grid-cols-3 gap-2">
    {OPTIONS.map((option) => {
      const active = value === option;
      const locked = option === "asked" && (stored?.status === "yes" || stored?.status === "no");
      return (
        <button
          key={option}
          type="button"
          aria-pressed={active}
          disabled={disabled || locked}
          onClick={() => onSelect(option)}
          className={`min-h-10 px-2 py-2 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            active ? ACTIVE_STYLE[option] : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
          }`}
        >
          {SMS_CONSENT_LABELS[option]}
        </button>
      );
    })}
  </div>
);

interface SmsConsentCardProps {
  phone: string;
  name: string;
  orderNumber: string;
}

/** შეკვეთის ბარათი: სტატუსის ნახვა და შეცვლა, თუ მყიდველმა მოგვიანებით უპასუხა. */
const SmsConsentCard: React.FC<SmsConsentCardProps> = ({ phone, name, orderNumber }) => {
  const { user } = useAuthStore();
  const [stored, setStored] = useState<SmsConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const valid = isSmsConsentPhone(phone);

  useEffect(() => {
    setStored(null);
    if (!valid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getSmsConsent(phone)
      .then((found) => active && setStored(found))
      .catch((error) => console.error("SMS თანხმობის წაკითხვა ვერ მოხერხდა", error))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [phone, valid]);

  const handleSelect = async (value: SmsConsentStatus) => {
    if (saving || stored?.status === value) return;
    setSaving(true);
    try {
      const saved = await setSmsConsent(phone, value, {
        name,
        orderNumber,
        actorName: user?.displayName || undefined,
      });
      setStored(saved);
      showToast("SMS თანხმობა შეინახა", "success");
    } catch (error) {
      console.error(error);
      showToast("SMS თანხმობა ვერ შეინახა", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200" data-testid="sms-consent-card">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span id={`sms-consent-card-${orderNumber}`} className="text-sm font-medium text-gray-700">
          SMS თანხმობა
        </span>
      </div>
      {!valid ? (
        <p className="text-xs text-gray-500">ნომერი 5-ით დაწყებული 9 ციფრი არ არის, თანხმობა ვერ ჩაიწერება.</p>
      ) : (
        <>
          <SmsConsentButtons
            labelId={`sms-consent-card-${orderNumber}`}
            value={stored?.status ?? null}
            stored={stored}
            disabled={loading || saving}
            onSelect={handleSelect}
          />
          <p className="mt-2 text-xs text-gray-500">
            {loading ? "ვამოწმებ…" : stored ? describeSmsConsent(stored) : "ჯერ არ უკითხავს"}
          </p>
        </>
      )}
    </div>
  );
};

export default SmsConsentCard;
