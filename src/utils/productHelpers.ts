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
  if (product.hasVariants && product.variants) {
    // Calculate price ranges considering sale prices
    const activeVariants = product.variants.filter(v => v.isActive);
    const prices = activeVariants.map(v =>
      v.salePrice && v.salePrice < v.price ? v.salePrice : v.price
    );

    if (prices.length === 0) {
      return "₾0.00";
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `₾${minPrice.toFixed(2)}`;
    }
    return `₾${minPrice.toFixed(2)} - ₾${maxPrice.toFixed(2)}`;
  }

  // For simple products, use sale price if available
  const effectivePrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price;

  return `₾${(effectivePrice || 0).toFixed(2)}`;
}

export function getProductOriginalDisplayPrice(
  product: Product
): string | null {
  if (product.hasVariants) {
    // For variants, we don't show original price ranges - too complex
    return null;
  }

  // Check for sale price first, then legacy originalPrice
  if (product.salePrice && product.salePrice < product.price) {
    return `₾${product.price.toFixed(2)}`;
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
  if (product.hasVariants && product.variants) {
    // Check if any variant has sale price
    return product.variants.some(variant =>
      variant.isActive && variant.salePrice && variant.salePrice < variant.price
    );
  }

  // For simple products, check both salePrice and legacy originalPrice
  return !!(
    (product.salePrice && product.salePrice < product.price) ||
    (product.originalPrice && product.originalPrice > (product.price || 0))
  );
}
