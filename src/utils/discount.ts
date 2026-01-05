// src/utils/discount.ts

import type { Product } from '../types';

/**
 * შეამოწმებს არის თუ არა პროდუქტი ფასდაკლებული
 */
export const hasDiscount = (product: Product): boolean => {
  if (product.hasVariants && product.variants) {
    // Check if any variant has sale price
    return product.variants.some(variant =>
      variant.isActive && variant.salePrice && variant.salePrice < variant.price
    );
  }

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
  if (product.hasVariants && product.variants) {
    // For variants, show the highest discount percentage
    let maxDiscount = 0;
    product.variants.forEach(variant => {
      if (variant.isActive && variant.salePrice && variant.salePrice < variant.price) {
        const discount = Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
        maxDiscount = Math.max(maxDiscount, discount);
      }
    });
    return maxDiscount > 0 ? `-${maxDiscount}%` : '';
  }

  const percentage = calculateDiscountPercentage(product);
  return percentage > 0 ? `-${percentage}%` : '';
};