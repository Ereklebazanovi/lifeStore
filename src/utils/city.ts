import { DELIVERY_CITIES } from "../config/constants";
import type { DeliveryCity } from "../config/constants";

/** ქალაქის სახელის ნორმალიზაცია — სხვადასხვა აკრეფა ერთ ჯგუფში მოვა */
export const normalizeCity = (raw?: string): string => {
  const c = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!c) return "უცნობი";
  const lower = c.toLowerCase();
  // ხშირი ვარიანტები — თბილისი
  if (["tbilisi", "tbilis", "თბილისი", "тбилиси"].includes(lower)) return "თბილისი";
  return c;
};

// უცნობი ან ცარიელი ქალაქი მიწოდების ფილტრში „სხვა“-ში ხვდება.
export const getDeliveryCityKey = (raw?: string): DeliveryCity => {
  const normalized = normalizeCity(raw);
  return DELIVERY_CITIES.find((city) => city === normalized) ?? "სხვა";
};

export const matchesCityFilter = (city: string | undefined, selected: string[]): boolean =>
  selected.length === 0 || selected.includes(getDeliveryCityKey(city));
