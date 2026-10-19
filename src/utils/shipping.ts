import { DELIVERY_CITIES } from "../config/constants";
import type { DeliveryCity } from "../config/constants";
import { getDeliveryCityKey } from "./city";

export type ShippingRates = Record<DeliveryCity, number>;

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  "თბილისი": 5,
  "რუსთავი": 5,
  "ბათუმი": 10,
  "ქუთაისი": 10,
  "სხვა": 10,
};

export const getShippingCost = (city: string | undefined, rates: ShippingRates): number =>
  rates[getDeliveryCityKey(city)];

// ერთნაირი ფასის ქალაქები ერთ ჯგუფშია; „სხვა“ თავისივე ტარიფის ქალაქებსაც მოიცავს.
export const formatShippingSummary = (rates: ShippingRates, lang: string): string => {
  const labels = {
    ka: { prefix: "მიწოდება", cities: ["თბილისი", "რუსთავი", "ბათუმი", "ქუთაისი", "სხვა"] },
    en: { prefix: "Delivery", cities: ["Tbilisi", "Rustavi", "Batumi", "Kutaisi", "other cities"] },
    ru: { prefix: "Доставка", cities: ["Тбилиси", "Рустави", "Батуми", "Кутаиси", "другие города"] },
  };
  const language = lang.split("-")[0];
  const translated = labels[language === "en" || language === "ru" ? language : "ka"];
  const groups = new Map<number, string[]>();
  DELIVERY_CITIES.slice(0, -1).forEach((city, index) => {
    const price = rates[city];
    if (price === rates["სხვა"]) return;
    const group = groups.get(price) ?? [];
    group.push(translated.cities[index]);
    groups.set(price, group);
  });
  const parts = [...groups].map(([price, cities]) => `${cities.join("/")} ${String(price)}₾`);
  parts.push(`${translated.cities[4]} ${String(rates["სხვა"])}₾`);
  return `${translated.prefix}: ${parts.join(", ")}`;
};
