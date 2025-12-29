import type { Product } from "../types";

/**
 * Utility functions to help with the transition to variant system
 * These provide safe defaults for price and stock until all products are migrated
 */

export function getProductPrice(product: Product): number {
  if (product.hasVariants) {
    return product.minPrice || 0;
  }
  return product.price || 0;
}

export function getProductStock(product: Product): number {
  if (product.hasVariants && product.variants) {
    // Calculate real-time total stock from all active variants
    return product.variants
      .filter(variant => variant.isActive)
      .reduce((total, variant) => total + (variant.stock || 0), 0);
  }
  return product.stock || 0;
}

export function getProductDisplayPrice(product: Product): string {
  if (product.hasVariants) {
    if (product.minPrice === product.maxPrice) {
      return `₾${product.minPrice?.toFixed(2) || "0.00"}`;
    }
    return `₾${product.minPrice?.toFixed(2) || "0.00"} - ₾${
      product.maxPrice?.toFixed(2) || "0.00"
    }`;
  }
  return `₾${(product.price || 0).toFixed(2)}`;
}

export function getProductOriginalDisplayPrice(
  product: Product
): string | null {
  if (product.hasVariants) {
    // For variants, we don't show original price ranges - too complex
    return null;
  }

  if (product.originalPrice && product.originalPrice > (product.price || 0)) {
    return `₾${product.originalPrice.toFixed(2)}`;
  }

  return null;
}

export function isProductAvailable(product: Product): boolean {
  return getProductStock(product) > 0;
}

export function isProductLowStock(product: Product): boolean {
  const stock = getProductStock(product);
  return stock > 0 && stock <= 10;
}

export function isProductOutOfStock(product: Product): boolean {
  return getProductStock(product) <= 0;
}

export function hasDiscount(product: Product): boolean {
  if (product.hasVariants) {
    return false; // Variants don't support original price discount system
  }

  return !!(
    product.originalPrice && product.originalPrice > (product.price || 0)
  );
}
