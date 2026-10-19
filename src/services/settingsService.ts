import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { DELIVERY_CITIES } from "../config/constants";
import { DEFAULT_SHIPPING_RATES } from "../utils/shipping";
import type { ShippingRates } from "../utils/shipping";
import type { OrderActor } from "../types";

interface ShippingSettings {
  rates: ShippingRates;
  exists: boolean | null;
}

let cached: ShippingSettings | null = null;
let pending: Promise<ShippingSettings> | null = null;
let revision = 0;

const fallback = (exists: boolean | null): ShippingSettings => ({ rates: { ...DEFAULT_SHIPPING_RATES }, exists });

// პარამეტრების გვერდსაც იგივე კითხვა აქვს; exists=null კავშირის ჩავარდნას ნიშნავს.
export const getShippingSettings = (): Promise<ShippingSettings> => {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  const readRevision = revision;
  let timer: ReturnType<typeof setTimeout>;
  const read = Promise.resolve().then(() => getDoc(doc(db, "settings", "shipping"))).then((snapshot): ShippingSettings => {
    if (!snapshot.exists()) return fallback(false);
    const values = snapshot.data().rates;
    const rates = { ...DEFAULT_SHIPPING_RATES };
    for (const city of DELIVERY_CITIES) {
      const value = values?.[city];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) rates[city] = value;
    }
    return { rates, exists: true };
  });
  const request = Promise.race([
    read,
    new Promise<ShippingSettings>((resolve) => { timer = setTimeout(() => resolve(fallback(null)), 3500); }),
  ]).catch(() => fallback(null)).then((settings) => {
    // შენახვის შემდეგ ძველი, დაგვიანებული კითხვა ახალ cache-ს ვერ გადაწერს.
    if (revision !== readRevision && cached) return cached;
    if (settings.exists === true) cached = settings;
    return settings;
  }).finally(() => {
    clearTimeout(timer);
    if (pending === request) pending = null;
  });
  pending = request;
  return request;
};

export const getShippingRates = async (): Promise<ShippingRates> =>
  (await getShippingSettings()).rates;

export const saveShippingRates = async (rates: ShippingRates, actor: OrderActor): Promise<void> => {
  for (const city of DELIVERY_CITIES) {
    const value = rates[city];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      throw new Error("ტარიფი უნდა იყოს არაუარყოფითი რიცხვი, მაქსიმუმ 2 ათწილადით");
    }
  }
  const updatedBy = { uid: actor.uid, email: actor.email, ...(actor.name ? { name: actor.name } : {}) };
  const savedRates = { ...rates };
  await setDoc(doc(db, "settings", "shipping"), { rates: savedRates, updatedAt: serverTimestamp(), updatedBy });
  revision++;
  cached = { rates: savedRates, exists: true };
};
