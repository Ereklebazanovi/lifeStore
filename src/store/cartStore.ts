//cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState, Product } from "../types";
import { CartService } from "../services/cartService";
import { showToast } from "../components/ui/Toast";

const loadGuestCartOnInit = () => {
  try {
    const guestCartData = localStorage.getItem("cart-guest");
    if (guestCartData) {
      const parsed = JSON.parse(guestCartData);
      return {
        items: parsed.items || [],
        totalItems: parsed.totalItems || 0,
        totalPrice: parsed.totalPrice || 0,
      };
    }
  } catch (error) {
    console.error("Failed to load initial guest cart:", error);
  }
  return {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  };
};

const initialGuestState = loadGuestCartOnInit();

interface CartActions {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  loadUserCart: (userId: string | null) => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

type CartUnsubscribe = () => void;

interface CartStoreState extends CartState {
  currentUserId: string | null;
  isLoading: boolean;
  cartUnsubscribe: CartUnsubscribe | null;
}

export const useCartStore = create<CartStoreState & CartActions>()(
  persist(
    (set, get) => {
      const saveCartToStorage = (cartData: {
        items: CartState["items"];
        totalItems: number;
        totalPrice: number;
        currentUserId: string | null;
      }) => {
        const dataToSave = {
          items: cartData.items,
          totalItems: cartData.totalItems,
          totalPrice: cartData.totalPrice,
        };
        const storageKey = cartData.currentUserId
          ? `cart-user-${cartData.currentUserId}`
          : "cart-guest";
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      };

      return {
        ...initialGuestState,
        currentUserId: null,
        isLoading: false,
        cartUnsubscribe: null,

        loadUserCart: async (userId: string | null) => {
          const state = get();
          if (state.currentUserId === userId) return;

          if (state.cartUnsubscribe) {
            state.cartUnsubscribe();
            set({ cartUnsubscribe: null });
          }

          if (state.items.length > 0) {
            if (state.currentUserId) {
              try {
                await CartService.saveUserCart(state.currentUserId, {
                  items: state.items,
                  totalItems: state.totalItems,
                  totalPrice: state.totalPrice,
                });
              } catch (error) {
                console.error("Failed to save cart to Firestore:", error);
              }
            } else {
              saveCartToStorage(state);
            }
          }

          if (!userId) {
            if (state.currentUserId) {
              set({
                items: [],
                totalItems: 0,
                totalPrice: 0,
                currentUserId: null,
                isLoading: false,
                cartUnsubscribe: null,
              });
            } else {
              const guestCart = localStorage.getItem("cart-guest");
              if (guestCart) {
                try {
                  const parsedCart = JSON.parse(guestCart);
                  set({
                    items: parsedCart.items || [],
                    totalItems: parsedCart.totalItems || 0,
                    totalPrice: parsedCart.totalPrice || 0,
                    currentUserId: null,
                    isLoading: false,
                    cartUnsubscribe: null,
                  });
                } catch (error) {
                  console.error("Error loading guest cart:", error);
                  set({
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    currentUserId: null,
                    isLoading: false,
                    cartUnsubscribe: null,
                  });
                }
              } else {
                set({
                  items: [],
                  totalItems: 0,
                  totalPrice: 0,
                  currentUserId: null,
                  isLoading: false,
                  cartUnsubscribe: null,
                });
              }
            }
          } else {
            // Only try to load from Firestore if userId is valid (not null/undefined)
            if (userId && userId.trim().length > 0) {
              set({ ...get(), isLoading: true, currentUserId: userId });

              try {
                const firestoreCart = await CartService.loadUserCart(userId);
                if (firestoreCart) {
                  set({
                    ...get(),
                    items: firestoreCart.items || [],
                    totalItems: firestoreCart.totalItems || 0,
                    totalPrice: firestoreCart.totalPrice || 0,
                    isLoading: false,
                  });
                } else {
                  set({
                    ...get(),
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    isLoading: false,
                  });
                }

                const unsubscribe = CartService.subscribeToUserCart(
                  userId,
                  (cartData) => {
                    if (cartData && get().currentUserId === userId) {
                      set({
                        items: cartData.items || [],
                        totalItems: cartData.totalItems || 0,
                        totalPrice: cartData.totalPrice || 0,
                      });
                    }
                  }
                );

                set({ cartUnsubscribe: unsubscribe });
              } catch (error) {
                console.error("Error loading user cart from Firestore:", error);
                set({
                  ...get(),
                  items: [],
                  totalItems: 0,
                  totalPrice: 0,
                  isLoading: false,
                });
              }
            } else {
              // For guest users (userId is null/undefined), just load from localStorage
              set({
                ...get(),
                currentUserId: null,
                isLoading: false,
              });
            }
          }
        },

        // --- ADD ITEM LOGIC ---
        addItem: async (product: Product, quantity = 1) => {
          const state = get();

          // 1. მარაგი მთლიანად ამოწურულია?
          if (product.stock === 0) {
            showToast("სამწუხაროდ, პროდუქტი მარაგში არ არის", "error");
            return;
          }

          const existingItem = state.items.find(
            (item) => item.productId === product.id
          );

          // 2. ლიმიტის შემოწმება (არსებულს + ახალი)
          const currentQty = existingItem ? existingItem.quantity : 0;
          if (currentQty + quantity > product.stock) {
            showToast(`მარაგში მხოლოდ ${product.stock} ერთეულია`, "error");
            return;
          }

          let newItems;
          if (existingItem) {
            newItems = state.items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [
              ...state.items,
              { productId: product.id, product, quantity },
            ];
          }

          const newTotalItems = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const newTotalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          const newState = {
            items: newItems,
            totalItems: newTotalItems,
            totalPrice: newTotalPrice,
            currentUserId: state.currentUserId,
          };

          set(newState);

          if (state.currentUserId) {
            try {
              await CartService.saveUserCart(state.currentUserId, {
                items: newItems,
                totalItems: newTotalItems,
                totalPrice: newTotalPrice,
              });
            } catch (error) {
              console.error("Failed to save cart to Firestore:", error);
            }
          } else {
            saveCartToStorage(newState);
          }
        },

        removeItem: async (productId: string) => {
          const state = get();
          const newItems = state.items.filter(
            (item) => item.productId !== productId
          );
          const newTotalItems = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const newTotalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          const newState = {
            items: newItems,
            totalItems: newTotalItems,
            totalPrice: newTotalPrice,
            currentUserId: state.currentUserId,
          };

          set(newState);

          if (state.currentUserId) {
            try {
              await CartService.saveUserCart(state.currentUserId, {
                items: newItems,
                totalItems: newTotalItems,
                totalPrice: newTotalPrice,
              });
            } catch (error) {
              console.error("Failed to save cart to Firestore:", error);
            }
          } else {
            saveCartToStorage(newState);
          }
        },

        // --- UPDATE QUANTITY LOGIC ---
        updateQuantity: async (productId: string, quantity: number) => {
          const state = get();
          const item = state.items.find((i) => i.productId === productId);

          if (!item) return;

          // 3. შემოწმება გაზრდისას
          if (quantity > item.product.stock) {
            showToast(`მაქსიმალური მარაგი: ${item.product.stock}`, "error");
            return;
          }

          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }

          const newItems = state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );

          const newTotalItems = newItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const newTotalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          const newState = {
            items: newItems,
            totalItems: newTotalItems,
            totalPrice: newTotalPrice,
            currentUserId: state.currentUserId,
          };

          set(newState);

          if (state.currentUserId) {
            try {
              await CartService.saveUserCart(state.currentUserId, {
                items: newItems,
                totalItems: newTotalItems,
                totalPrice: newTotalPrice,
              });
            } catch (error) {
              console.error("Failed to save cart to Firestore:", error);
            }
          } else {
            saveCartToStorage(newState);
          }
        },

        clearCart: async () => {
          const state = get();
          const newState = {
            items: [],
            totalItems: 0,
            totalPrice: 0,
            currentUserId: state.currentUserId,
          };

          set(newState);

          if (state.currentUserId) {
            try {
              await CartService.saveUserCart(state.currentUserId, {
                items: [],
                totalItems: 0,
                totalPrice: 0,
              });
            } catch (error) {
              console.error("Failed to clear cart in Firestore:", error);
            }
          } else {
            saveCartToStorage(newState);
          }
        },

        getCartTotal: () => {
          return get().items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
        },

        getCartItemsCount: () => {
          return get().items.reduce((sum, item) => sum + item.quantity, 0);
        },
      };
    },
    {
      name: "cart-storage-main",
      partialize: (state) => ({
        items: !state.currentUserId ? state.items : [],
        totalItems: !state.currentUserId ? state.totalItems : 0,
        totalPrice: !state.currentUserId ? state.totalPrice : 0,
        currentUserId: null,
        isLoading: false,
        cartUnsubscribe: null,
      }),
    }
  )
);
