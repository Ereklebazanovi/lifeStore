//displayHelpers.ts
import type { CartItem, Product, OrderItem } from "../types";

/**
 * Get the display name for a cart item, including variant information if present
 */
export function getCartItemDisplayName(item: CartItem): string {
  const baseName = item.product.name;

  // Check if the item has variant information
  if (item.variantId && item.product.variants) {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    if (variant && variant.name) {
      return `${baseName} (${variant.name})`;
    }
  }

  return baseName;
}

/**
 * Get the display name for any product with variant, fallback to product name
 */
export function getProductDisplayName(
  product: Product,
  variantId?: string
): string {
  if (variantId && product.variants) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant && variant.name) {
      return `${product.name} (${variant.name})`;
    }
  }

  return product.name;
}

/**
 * Get just the variant name if it exists
 */
export function getVariantDisplayName(item: CartItem): string | null {
  if (item.variantId && item.product.variants) {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    return variant?.name || null;
  }

  return null;
}

/**
 * Get the display name for an order item, including variant information if present
 */
export function getOrderItemDisplayName(item: OrderItem): string {
  const baseName = item.product.name;

  // Check if the item has variant information
  if (item.variantId && item.product.variants) {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    if (variant && variant.name) {
      return `${baseName} (${variant.name})`;
    }
  }

  return baseName;
}
