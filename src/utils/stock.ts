// src/utils/stock.ts

import type { Product } from '../types';

/**
 * მარაგის სტატუსის განსაზღვრა
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * მარაგის რაოდენობის გამოთვლა (variant support)
 */
export const getTotalStock = (product: Product): number => {
  if (product.hasVariants && product.variants) {
    return product.variants
      .filter(variant => variant.isActive)
      .reduce((total, variant) => total + (variant.stock || 0), 0);
  }
  return product.stock || 0;
};

/**
 * მარაგის სტატუსის გამოთვლა
 */
export const getStockStatus = (product: Product): StockStatus => {
  const totalStock = getTotalStock(product);
  if (totalStock === 0) return 'out_of_stock';
  if (totalStock <= 5) return 'low_stock';
  return 'in_stock';
};

/**
 * მარაგის ტექსტის გენერაცია (variant-aware)
 */
export const getStockText = (product: Product): string => {
  const status = getStockStatus(product);
  const totalStock = getTotalStock(product);

  switch (status) {
    case 'out_of_stock':
      return 'მარაგში არ არის';
    case 'low_stock':
      return `სულ: ${totalStock} ცალი`;
    case 'in_stock':
      return totalStock > 20 ? 'მარაგშია' : `სულ: ${totalStock} ცალი`;
  }
};

/**
 * მარაგის ღირ-ს კლასები (Tailwind)
 */
export const getStockColorClasses = (product: Product): string => {
  const status = getStockStatus(product);

  switch (status) {
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'low_stock':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'in_stock':
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

/**
 * მარაგის მინიმალური ღირ-ს კლასები (compact version)
 */
export const getStockColorClassesCompact = (product: Product): string => {
  const status = getStockStatus(product);

  switch (status) {
    case 'out_of_stock':
      return 'text-red-600';
    case 'low_stock':
      return 'text-orange-600';
    case 'in_stock':
      return 'text-green-600';
  }
};

/**
 * შეამოწმებს შეუძლია თუ არა მომხმარებელს კონკრეტული რაოდენობის დამატება
 */
export const canAddToCart = (product: Product, requestedQuantity: number, currentCartQuantity: number = 0): boolean => {
  const totalQuantity = currentCartQuantity + requestedQuantity;
  return product.stock >= totalQuantity;
};

/**
 * მაქსიმალური რაოდენობა რაც შეიძლება დაემატოს კალათში
 */
export const getMaxAddableQuantity = (product: Product, currentCartQuantity: number = 0): number => {
  return Math.max(0, product.stock - currentCartQuantity);
};

/**
 * მარაგის შესახებ შეტყობინება
 */
export const getStockMessage = (product: Product, requestedQuantity: number, currentCartQuantity: number = 0): string | null => {
  if (!canAddToCart(product, requestedQuantity, currentCartQuantity)) {
    if (product.stock === 0) {
      return 'ეს პროდუქტი ამოწურულია';
    }

    const maxAvailable = getMaxAddableQuantity(product, currentCartQuantity);
    if (maxAvailable === 0) {
      return 'თქვენ უკვე გაქვთ ყველა ხელმისაწვდომი ერთეული';
    }

    return `მხოლოდ ${maxAvailable} ცალი დარჩა მარაგში`;
  }

  return null;
};