// src/utils/discount.ts

import type { Product } from '../types';

/**
 * შეამოწმებს არის თუ არა პროდუქტი ფასდაკლებული
 */
export const hasDiscount = (product: Product): boolean => {
  return !!(product.originalPrice && product.originalPrice > product.price);
};

/**
 * გამოთვლის ფასდაკლების პროცენტს
 */
export const calculateDiscountPercentage = (product: Product): number => {
  if (!hasDiscount(product)) return 0;

  const discount = product.originalPrice! - product.price;
  return Math.round((discount / product.originalPrice!) * 100);
};

/**
 * გამოთვლის ფასდაკლების თანხას
 */
export const calculateDiscountAmount = (product: Product): number => {
  if (!hasDiscount(product)) return 0;

  return product.originalPrice! - product.price;
};

/**
 * ფორმატირებული ფასდაკლების ტექსტი
 */
export const getDiscountText = (product: Product): string => {
  const percentage = calculateDiscountPercentage(product);
  return percentage > 0 ? `-${percentage}%` : '';
};