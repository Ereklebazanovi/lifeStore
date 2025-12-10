//cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartState, CartItem, Product } from '../types';

interface CartActions {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (product: Product, quantity = 1) => {
        const state = get();
        const existingItem = state.items.find(item => item.productId === product.id);

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: state.items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          // Add new item
          set({
            items: [...state.items, { productId: product.id, product, quantity }]
          });
        }

        // Update totals
        const updatedState = get();
        set({
          totalItems: updatedState.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedState.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        });
      },

      removeItem: (productId: string) => {
        const state = get();
        set({
          items: state.items.filter(item => item.productId !== productId)
        });

        // Update totals
        const updatedState = get();
        set({
          totalItems: updatedState.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedState.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const state = get();
        set({
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        });

        // Update totals
        const updatedState = get();
        set({
          totalItems: updatedState.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedState.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0
        });
      },

      getCartTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      },

      getCartItemsCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage', // Local storage key
    }
  )
);