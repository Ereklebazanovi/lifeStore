// src/services/cartValidationService.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { CartItem, Product } from "../types";
import { showToast } from "../components/ui/Toast";

export interface CartValidationResult {
  validItems: CartItem[];
  removedItems: CartItem[];
  updatedItems: { item: CartItem; oldQuantity: number; newQuantity: number }[];
  hasChanges: boolean;
}

export class CartValidationService {
  /**
   * Validate cart items against current database state
   * Removes deleted products/variants and adjusts quantities for insufficient stock
   */
  static async validateCart(
    cartItems: CartItem[]
  ): Promise<CartValidationResult> {
    const validItems: CartItem[] = [];
    const removedItems: CartItem[] = [];
    const updatedItems: {
      item: CartItem;
      oldQuantity: number;
      newQuantity: number;
    }[] = [];

    console.log("🔍 Validating cart with", cartItems.length, "items...");

    for (const cartItem of cartItems) {
      try {
        // Skip manual entries (they don't exist in products collection)
        if (
          cartItem.productId?.startsWith("manual_") ||
          cartItem.productId === "manual_entry"
        ) {
          validItems.push(cartItem);
          continue;
        }

        // 1. Check if product exists
        const productDoc = await getDoc(
          doc(db, "products", cartItem.productId)
        );

        if (!productDoc.exists()) {
          console.warn("❌ Product not found:", cartItem.productId);
          removedItems.push(cartItem);
          continue;
        }

        const productData = productDoc.data() as Product;

        // 2. Check if product is active
        if (!productData.isActive) {
          console.warn("❌ Product deactivated:", cartItem.productId);
          removedItems.push(cartItem);
          continue;
        }

        // 3. For variant products, check variant existence and stock
        if (cartItem.variantId) {
          if (!productData.hasVariants || !productData.variants) {
            console.warn(
              "❌ Product no longer has variants:",
              cartItem.productId
            );
            removedItems.push(cartItem);
            continue;
          }

          const variant = productData.variants.find(
            (v) => v.id === cartItem.variantId
          );

          if (!variant || !variant.isActive) {
            console.warn(
              "❌ Variant not found or inactive:",
              cartItem.variantId
            );
            removedItems.push(cartItem);
            continue;
          }

          // Check variant stock
          const availableStock = variant.stock || 0;

          if (availableStock === 0) {
            console.warn("❌ Variant out of stock:", cartItem.variantId);
            removedItems.push(cartItem);
            continue;
          }

          // Adjust quantity if insufficient stock
          if (cartItem.quantity > availableStock) {
            const oldQuantity = cartItem.quantity;
            const adjustedItem = {
              ...cartItem,
              quantity: availableStock,
            };

            updatedItems.push({
              item: adjustedItem,
              oldQuantity,
              newQuantity: availableStock,
            });
            validItems.push(adjustedItem);

            console.warn(
              "⚠️ Variant quantity adjusted:",
              cartItem.variantId,
              "from",
              oldQuantity,
              "to",
              availableStock
            );
            continue;
          }

          // Update product data in cart item to latest version
          const updatedCartItem = {
            ...cartItem,
            product: {
              ...productData,
              price: variant.price, // Use variant price
              stock: variant.stock, // Use variant stock for display
            },
          };

          validItems.push(updatedCartItem);
        }
        // 4. For simple products, check stock
        else {
          const availableStock = productData.stock || 0;

          if (availableStock === 0) {
            console.warn("❌ Product out of stock:", cartItem.productId);
            removedItems.push(cartItem);
            continue;
          }

          // Adjust quantity if insufficient stock
          if (cartItem.quantity > availableStock) {
            const oldQuantity = cartItem.quantity;
            const adjustedItem = {
              ...cartItem,
              quantity: availableStock,
              product: productData, // Update to latest product data
            };

            updatedItems.push({
              item: adjustedItem,
              oldQuantity,
              newQuantity: availableStock,
            });
            validItems.push(adjustedItem);

            console.warn(
              "⚠️ Product quantity adjusted:",
              cartItem.productId,
              "from",
              oldQuantity,
              "to",
              availableStock
            );
            continue;
          }

          // Update product data in cart item to latest version
          const updatedCartItem = {
            ...cartItem,
            product: productData,
          };

          validItems.push(updatedCartItem);
        }
      } catch (error) {
        console.error(
          "❌ Error validating cart item:",
          cartItem.productId,
          error
        );
        // If there's an error checking the item, remove it to be safe
        removedItems.push(cartItem);
      }
    }

    const hasChanges = removedItems.length > 0 || updatedItems.length > 0;

    console.log("✅ Cart validation completed:", {
      original: cartItems.length,
      valid: validItems.length,
      removed: removedItems.length,
      updated: updatedItems.length,
      hasChanges,
    });

    return {
      validItems,
      removedItems,
      updatedItems,
      hasChanges,
    };
  }

  /**
   * Show user-friendly notifications about cart changes
   */
  static showCartChangeNotifications(result: CartValidationResult): void {
    if (!result.hasChanges) return;

    const { removedItems, updatedItems } = result;

    // Show notification for removed items
    if (removedItems.length > 0) {
      const removedNames = removedItems
        .map((item) => {
          if (item.variantId && item.product.variants) {
            const variant = item.product.variants.find(
              (v) => v.id === item.variantId
            );
            return variant
              ? `${item.product.name} (${variant.name})`
              : item.product.name;
          }
          return item.product.name;
        })
        .slice(0, 2); // Show max 2 names

      const message =
        removedItems.length === 1
          ? `"${removedNames[0]}" ამოღებულია კალათიდან (აღარ არის ხელმისაწვდომი)`
          : removedItems.length === 2
          ? `"${removedNames.join('" და "')}" ამოღებულია კალათიდან`
          : `${removedItems.length} ნივთი ამოღებულია კალათიდან (აღარ არის ხელმისაწვდომი)`;

      showToast(message, "error");
    }

    // Show notification for quantity adjustments
    if (updatedItems.length > 0) {
      const firstUpdated = updatedItems[0];
      let productName = firstUpdated.item.product.name;

      if (firstUpdated.item.variantId && firstUpdated.item.product.variants) {
        const variant = firstUpdated.item.product.variants.find(
          (v) => v.id === firstUpdated.item.variantId
        );
        if (variant) {
          productName = `${productName} (${variant.name})`;
        }
      }

      const message =
        updatedItems.length === 1
          ? `"${productName}" რაოდენობა შეიცვალა ${firstUpdated.newQuantity} ცალამდე (მარაგის შეზღუდვის გამო)`
          : `${updatedItems.length} ნივთის რაოდენობა შეიცვალა მარაგის გამო`;

      showToast(message, "info");
    }
  }

  /**
   * Quick check if cart validation is needed
   * Called before expensive full validation
   */
  static shouldValidateCart(cartItems: CartItem[]): boolean {
    // Always validate if cart is not empty
    // In a more sophisticated implementation, you could check:
    // - Last validation timestamp
    // - Cart items last updated time
    // - etc.
    return cartItems.length > 0;
  }
}
