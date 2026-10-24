// src/utils/promo.ts
// პრომო კოდის საერთო ლოგიკა — ერთი და იგივე ფუნქციები გამოიყენება checkout-ში (ეკრანი + Flitt)
// და createOrder-ში (შეკვეთის totalAmount), რომ სამივე თანხა ერთნაირი იყოს.

export interface PromoCode {
  code: string; // ნორმალიზებული (დიდი ასოები), ემთხვევა დოკუმენტის ID-ს
  percent: number; // 1–90, მთელი რიცხვი
  active: boolean;
  expiresAt?: Date | null; // ბოლო დღე ჩათვლით (23:59:59 ადგილობრივი დროით)
  // რომელ პროდუქტებზე მოქმედებს; ცარიელი ან არ არის = ყველა პროდუქტზე
  productIds?: string[];
}

// კოდი ამ პროდუქტზე მოქმედებს? (ვარიანტიან პროდუქტზე — ყველა ვარიანტზე)
export const promoAppliesToProduct = (
  promo: Pick<PromoCode, "productIds">,
  productId: string,
): boolean => !promo.productIds?.length || promo.productIds.includes(productId);

export const PROMO_MAX_PERCENT = 90; // 100% არ შეიძლება — 0₾-იან შეკვეთას ბაზა არ იღებს

// "web10 " → "WEB10"; ცარიელი სტრიქონი = კოდი არ არის
export const normalizePromoCode = (raw: string | undefined | null): string =>
  (raw ?? "").trim().replace(/\s+/g, "").toUpperCase();

// ლათინური ასოები, ციფრები, - და _ ; 2–30 სიმბოლო (Firestore დოკუმენტის ID-ად უსაფრთხოა)
export const isPromoCodeFormatValid = (code: string): boolean =>
  /^[A-Z0-9_-]{2,30}$/.test(code);

export const isPromoPercentValid = (percent: unknown): percent is number =>
  typeof percent === "number" &&
  Number.isInteger(percent) &&
  percent >= 1 &&
  percent <= PROMO_MAX_PERCENT;

export type PromoState = "active" | "inactive" | "expired";

export const getPromoState = (promo: PromoCode, now = new Date()): PromoState => {
  if (!promo.active) return "inactive";
  if (promo.expiresAt && now.getTime() > promo.expiresAt.getTime()) return "expired";
  return "active";
};

// ადმინში არჩეული "YYYY-MM-DD" → იმ დღის ბოლო წამი (ადგილობრივი დროით)
export const promoExpiryFromInput = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

// უკვე ფასდაკლებულ პროდუქტზე კოდი არ მოქმედებს (ორმაგი ფასდაკლება არ გამოდის).
// ფასდაკლებულად ითვლება იგივე, რაც საიტზე ფასდაკლების ნიშნით ჩანს.
export const isPromoExcluded = (
  product: {
    price?: number;
    salePrice?: number;
    originalPrice?: number;
    variants?: { id: string; price: number; salePrice?: number }[];
  },
  variantId?: string,
): boolean => {
  if (variantId && product.variants) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return !!(variant.salePrice && variant.salePrice < variant.price);
  }
  const price = product.price ?? 0;
  return !!(
    (product.salePrice && product.salePrice < price) ||
    (product.originalPrice && product.originalPrice > price)
  );
};

export interface PromoLine {
  unitPrice: number;
  quantity: number;
  excluded: boolean; // კოდი ამ ხაზზე არ მოქმედებს (ფასდაკლებულია ან კოდში არ არის)
}

// კალათის/შეკვეთის ხაზები ფასდაკლების გამოსათვლელად — ერთი წესი checkout-სა და createOrder-ში
export const buildPromoLines = (
  promo: Pick<PromoCode, "productIds">,
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    product: Parameters<typeof isPromoExcluded>[0];
  }[],
): PromoLine[] =>
  items.map((item) => ({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    excluded:
      isPromoExcluded(item.product, item.variantId) ||
      !promoAppliesToProduct(promo, item.productId),
  }));

// ფასდაკლება მხოლოდ სრულფასიან პროდუქტებზე; მიტანაზე არ ვრცელდება
export const computePromoDiscount = (
  lines: PromoLine[],
  percent: number,
): { eligibleSubtotal: number; discount: number; excludedLines: number } => {
  const eligibleSubtotal = lines
    .filter((line) => !line.excluded)
    .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discount = isPromoPercentValid(percent) ? round2((eligibleSubtotal * percent) / 100) : 0;
  return {
    eligibleSubtotal,
    discount,
    excludedLines: lines.filter((line) => line.excluded).length,
  };
};
