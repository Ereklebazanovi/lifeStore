// src/services/promoService.ts
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { OrderActor } from "../types";
import {
  isPromoCodeFormatValid,
  isPromoPercentValid,
  normalizePromoCode,
  PROMO_MAX_PERCENT,
} from "../utils/promo";
import type { PromoCode } from "../utils/promo";

const COLLECTION = "promoCodes";

export interface PromoCodeRecord extends PromoCode {
  createdAt?: Date;
  createdBy?: OrderActor;
  updatedAt?: Date;
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  return null;
};

const parse = (code: string, data: Record<string, unknown>): PromoCodeRecord => ({
  code,
  percent: Number(data.percent),
  active: data.active === true,
  expiresAt: toDate(data.expiresAt),
  createdAt: toDate(data.createdAt) ?? undefined,
  createdBy: data.createdBy as OrderActor | undefined,
  updatedAt: toDate(data.updatedAt) ?? undefined,
});

export type PromoLookup =
  | { status: "ok"; promo: PromoCode }
  | { status: "not_found" }
  | { status: "error" };

// checkout: მხოლოდ ზუსტად ჩაწერილი კოდი მოწმდება (rules-ით კოდების სია საჯაროდ არ იკითხება)
export const lookupPromoCode = async (raw: string): Promise<PromoLookup> => {
  const code = normalizePromoCode(raw);
  if (!isPromoCodeFormatValid(code)) return { status: "not_found" };
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, code));
    if (!snapshot.exists()) return { status: "not_found" };
    const promo = parse(code, snapshot.data());
    if (!isPromoPercentValid(promo.percent)) return { status: "not_found" };
    return { status: "ok", promo };
  } catch (error) {
    console.error("Promo code lookup failed:", error);
    return { status: "error" };
  }
};

// ადმინი: ყველა კოდი real-time-ში (rules-ით სიის წაკითხვა მხოლოდ ადმინს შეუძლია)
export const subscribePromoCodes = (
  next: (codes: PromoCodeRecord[]) => void,
  onError: (error: Error) => void,
): (() => void) =>
  onSnapshot(
    collection(db, COLLECTION),
    (snapshot) =>
      next(
        snapshot.docs
          .map((item) => parse(item.id, item.data()))
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)),
      ),
    onError,
  );

const validate = (code: string, percent: number) => {
  if (!isPromoCodeFormatValid(code))
    throw new Error("კოდი: 2–30 სიმბოლო, მხოლოდ ლათინური ასოები, ციფრები, - ან _");
  if (!isPromoPercentValid(percent))
    throw new Error(`ფასდაკლება: მთელი რიცხვი 1-დან ${PROMO_MAX_PERCENT}%-მდე`);
};

export const createPromoCode = async (
  input: { code: string; percent: number; expiresAt: Date | null },
  actor: OrderActor,
): Promise<string> => {
  const code = normalizePromoCode(input.code);
  validate(code, input.percent);
  const ref = doc(db, COLLECTION, code);
  await runTransaction(db, async (tx) => {
    if ((await tx.get(ref)).exists()) throw new Error("ასეთი კოდი უკვე არსებობს");
    tx.set(ref, {
      code,
      percent: input.percent,
      active: true,
      expiresAt: input.expiresAt,
      createdAt: serverTimestamp(),
      createdBy: actor,
    });
  });
  return code;
};

export const updatePromoCode = async (
  code: string,
  changes: { percent?: number; expiresAt?: Date | null; active?: boolean },
  actor: OrderActor,
): Promise<void> => {
  if (changes.percent !== undefined) validate(code, changes.percent);
  await updateDoc(doc(db, COLLECTION, code), {
    ...changes,
    updatedAt: serverTimestamp(),
    updatedBy: actor,
  });
};

// წაშლა შეკვეთებს არ ეხება — მათზე კოდი და ფასდაკლება ისევ ჩანს
export const deletePromoCode = async (code: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, code));
};
