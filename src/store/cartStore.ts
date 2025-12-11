import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState, Product } from "../types";
import { CartService } from "../services/cartService";

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
        // საწყისი მდგომარეობა იტვირთება Guest Cart-ის მონაცემებიდან
        ...initialGuestState,
        currentUserId: null,
        isLoading: false,
        cartUnsubscribe: null,

        loadUserCart: async (userId: string | null) => {
          const state = get();

          // 1. თუ მომხმარებელი არ იცვლება, არაფერი გააკეთო
          if (state.currentUserId === userId) return;

          // 2. Cleanup previous subscription
          if (state.cartUnsubscribe) {
            state.cartUnsubscribe();
            set({ cartUnsubscribe: null });
          }

          // 3. Save current cart before switching users
          if (state.items.length > 0) {
            if (state.currentUserId) {
              // Save to Firestore for authenticated user
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
              // Save to localStorage for guest
              saveCartToStorage(state);
            }
          }

          // 4. Handle user switch
          if (!userId) {
            // Switching to guest user - clear cart and load guest data
            if (state.currentUserId) {
              // Coming from authenticated user - clear cart
              set({
                items: [],
                totalItems: 0,
                totalPrice: 0,
                currentUserId: null,
                isLoading: false,
                cartUnsubscribe: null,
              });
            } else {
              // Load guest cart from localStorage
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
            // Switching to authenticated user - load from Firestore
            set({ ...get(), isLoading: true, currentUserId: userId });

            try {
              // Load cart from Firestore
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

              // Subscribe to real-time cart updates
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
          }
        },

        // -----------------------------------------------------------------
        // ACTION: addItem
        // -----------------------------------------------------------------
        addItem: async (product: Product, quantity = 1) => {
          const state = get();
          const existingItem = state.items.find(
            (item) => item.productId === product.id
          );

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

          // Save based on user type
          if (state.currentUserId) {
            // Save to Firestore for authenticated user
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
            // Save to localStorage for guest
            saveCartToStorage(newState);
          }
        },

        // -----------------------------------------------------------------
        // სხვა ფუნქციები (removeItem, updateQuantity, clearCart)
        // -----------------------------------------------------------------

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

          // Save based on user type
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

        updateQuantity: async (productId: string, quantity: number) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }

          const state = get();
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

          // Save based on user type
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

          // Save based on user type
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

        // -----------------------------------------------------------------
        // GETTERS
        // -----------------------------------------------------------------

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
        // Only persist guest cart data - authenticated users use Firestore
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
