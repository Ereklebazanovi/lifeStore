// src/utils/priority.ts-ახალი ფაილი

import type { Product } from "../types";

/**
 * პრიორიტეტის დონეები
 */
export const PRIORITY_LEVELS = {
  STANDARD: 0, // სტანდარტული
  POPULAR: 10, // პოპულარული
  TOP: 100, // TOP პროდუქტი
  SUPER_TOP: 1000, // სუპერ TOP (special occasions)
  URGENT: 9999, // ტემპორარული აქციები
} as const;

export type PriorityLevel =
  (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS];

/**
 * პრიორიტეტის preset-ების კონფიგურაცია
 */
export const PRIORITY_PRESETS = [
  {
    value: PRIORITY_LEVELS.STANDARD,
    label: "სტანდარტული",
    emoji: "🔘",
    description: "თარიღის მიხედვით", // ✅ აქ შევცვალეთ ტექსტი
  },
  {
    value: PRIORITY_LEVELS.POPULAR,
    label: "პოპულარული",
    emoji: "🔥",
    description: "რეკომენდირებული პროდუქტი",
  },
  {
    value: PRIORITY_LEVELS.TOP,
    label: "TOP",
    emoji: "🚀",
    description: "ყველაზე მნიშვნელოვანი",
  },
];

/**
 * შეამოწმებს არის თუ არა პროდუქტი პრიორიტეტული
 */
export const isPrioritized = (product: Product): boolean => {
  return (product.priority || 0) > 0;
};

/**
 * პრიორიტეტის label-ის მიღება
 */
export const getPriorityLabel = (priority: number): string => {
  const preset = PRIORITY_PRESETS.find((p) => p.value === priority);
  if (preset) return preset.label;

  if (priority === 0) return "სტანდარტული";
  if (priority > 0 && priority < 10) return `დაბალი (${priority})`;
  if (priority >= 10 && priority < 100) return `საშუალო (${priority})`;
  if (priority >= 100) return `მაღალი (${priority})`;

  return `Custom (${priority})`;
};

/**
 * პრიორიტეტის emoji-ის მიღება
 */
export const getPriorityEmoji = (priority: number): string => {
  const preset = PRIORITY_PRESETS.find((p) => p.value === priority);
  if (preset) return preset.emoji;

  if (priority === 0) return "🔘";
  if (priority > 0 && priority < 10) return "📌";
  if (priority >= 10 && priority < 100) return "🔥";
  if (priority >= 100) return "🚀";

  return "📌";
};

/**
 * პროდუქტების სორტირება პრიორიტეტისა და თარიღის მიხედვით
 */
export const sortProductsByPriority = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => {
    // Out of stock goes to bottom (unless high priority)
    const aPriority = a.priority || 0;
    const bPriority = b.priority || 0;

    // High priority products (>= 100) stay on top even if out of stock
    const aIsHighPriority = aPriority >= PRIORITY_LEVELS.TOP;
    const bIsHighPriority = bPriority >= PRIORITY_LEVELS.TOP;

    if (!aIsHighPriority && a.stock === 0 && b.stock > 0) return 1;
    if (!bIsHighPriority && b.stock === 0 && a.stock > 0) return -1;

    // Sort by priority (high to low)
    if (bPriority !== aPriority) {
      return bPriority - aPriority;
    }

    // If priority is same, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * პრიორიტეტის ვალიდაცია
 */
export const validatePriority = (priority: number): boolean => {
  return Number.isInteger(priority) && priority >= 0 && priority <= 9999;
};
