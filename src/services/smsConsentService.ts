// src/services/smsConsentService.ts
// SMS-ით სარეკლამო შეტყობინებების თანხმობა. ინახება ნომრით (smsConsents/{5XXXXXXXX}), არა შეკვეთაზე.
// ყოველი ცვლილება ცალკე ჩანაწერია history-ში სერვერის დროით (პერსონალურ მონაცემთა დაცვის კანონი, მუხლი 12).
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { OrderActor } from "../types";

const COLLECTION = "smsConsents";

/** asked = ჰკითხა, პასუხი არ არის. ჩანაწერი რომ არ არსებობს = ჯერ არ უკითხავს. */
export type SmsConsentStatus = "asked" | "yes" | "no";

export interface SmsConsent {
  phone: string;
  status: SmsConsentStatus;
  name: string;
  orderNumber: string;
  askedAt: Date | null;
  updatedAt: Date | null;
  updatedBy?: OrderActor;
}

export const SMS_CONSENT_TEMPLATE =
  "მადლობა შეკვეთისთვის! გსურთ, ფასდაკლებები და თქვენს შენაძენებზე მორგებული შეთავაზებები SMS-ით მიიღოთ? თუ კი, მოგვწერეთ „კი“. გაუქმება ნებისმიერ დროს შეგეძლებათ, უფასოდ.";

export const SMS_CONSENT_LABELS: Record<SmsConsentStatus, string> = {
  yes: "კი",
  no: "არა",
  asked: "პასუხი არ არის",
};

/** მიმდინარე სტატუსის აღწერა (ბაზაში რა წერია). */
export const SMS_CONSENT_STATUS_TEXT: Record<SmsConsentStatus, string> = {
  yes: "თანახმაა",
  no: "უარი თქვა",
  asked: "ჰკითხეს, პასუხი არ არის",
};

export const isSmsConsentPhone = (phone: string): boolean => /^5\d{8}$/.test(phone);

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  return null;
};

const parse = (phone: string, data: Record<string, unknown>): SmsConsent => ({
  phone,
  status: data.status as SmsConsentStatus,
  name: (data.name as string) || "",
  orderNumber: (data.orderNumber as string) || "",
  askedAt: toDate(data.askedAt),
  updatedAt: toDate(data.updatedAt),
  updatedBy: data.updatedBy as OrderActor | undefined,
});

/** ვინ მონიშნა: შესული ანგარიში (წესები ამოწმებს, რომ uid ემთხვეოდეს). */
const currentActor = (name?: string): OrderActor => {
  const user = auth.currentUser;
  if (!user) throw new Error("ავტორიზაცია საჭიროა");
  return {
    uid: user.uid,
    email: user.email || "",
    ...(name ? { name } : {}),
  };
};

export const getSmsConsent = async (phone: string): Promise<SmsConsent | null> => {
  if (!isSmsConsentPhone(phone)) return null;
  const snap = await getDoc(doc(db, COLLECTION, phone));
  return snap.exists() ? parse(phone, snap.data()) : null;
};

/**
 * სტატუსის ჩაწერა. "asked" მხოლოდ ახალ ნომერზე იწერება: უკვე გაცემულ "კი"/"არა"-ს არ გადაფარავს.
 * იგივე სტატუსი თავიდან არ იწერება. აბრუნებს მიმდინარე მდგომარეობას.
 */
export const setSmsConsent = async (
  phone: string,
  status: SmsConsentStatus,
  options: { name?: string; orderNumber?: string; actorName?: string } = {}
): Promise<SmsConsent> => {
  if (!isSmsConsentPhone(phone)) throw new Error("ნომერი არასწორია");
  const actor = currentActor(options.actorName);
  const ref = doc(db, COLLECTION, phone);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const prev = snap.exists() ? snap.data() : null;
    if (prev && (prev.status === status || status === "asked")) return parse(phone, prev);

    const count = (Number(prev?.historyCount) || 0) + 1;
    const name = options.name?.trim() || (prev?.name as string) || "";
    const orderNumber = options.orderNumber || (prev?.orderNumber as string) || "";

    transaction.set(ref, {
      phone,
      status,
      source: "chat",
      name,
      orderNumber,
      askedAt: prev ? prev.askedAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actor,
      historyCount: count,
    });
    transaction.set(doc(ref, "history", String(count)), {
      status,
      source: "chat",
      orderNumber,
      at: serverTimestamp(),
      by: actor,
    });

    return {
      phone,
      status,
      name,
      orderNumber,
      askedAt: prev ? toDate(prev.askedAt) : new Date(),
      updatedAt: new Date(),
      updatedBy: actor,
    };
  });
};

/** სტატისტიკისთვის (მხოლოდ ადმინი). */
export const listSmsConsents = async (): Promise<SmsConsent[]> => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => parse(d.id, d.data()));
};

/** მაგ. "ბაზაში: თანახმაა (14.11.2026, ნინი)" */
export const describeSmsConsent = (consent: SmsConsent): string => {
  const who = consent.updatedBy?.name || consent.updatedBy?.email || "";
  const when = consent.updatedAt ? consent.updatedAt.toLocaleDateString("ka-GE") : "";
  const meta = [when, who].filter(Boolean).join(", ");
  return `ბაზაში: ${SMS_CONSENT_STATUS_TEXT[consent.status]}${meta ? ` (${meta})` : ""}`;
};
