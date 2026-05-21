// src/store/productStore.ts

import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { sortProductsByPriority } from "../utils/priority";
import type { ProductState, Product, ProductVariant, StockHistory } from "../types";

interface ProductActions {
  fetchProducts: () => Promise<void>;
  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  getProductBySlug: (slug: string) => Promise<Product | null>;
  updateStock: (id: string, newStock: number, reason?: string) => Promise<void>;
  updateVariantStock: (productId: string, variantId: string, newStock: number, reason?: string) => Promise<void>;
  addVariant: (productId: string, variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVariant: (productId: string, variantId: string, updates: Partial<ProductVariant>) => Promise<void>;
  deleteVariant: (productId: string, variantId: string) => Promise<void>;
  subscribeToProducts: () => () => void;
  refreshInventory: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setIsCreatingOrder: (creating: boolean) => void;
  isCreatingOrder: boolean;
}

export const useProductStore = create<ProductState & ProductActions>(
  (set, get) => ({
    products: [],
    isLoading: false,
    categories: [],
    isCreatingOrder: false,

    setIsCreatingOrder: (creating: boolean) => set({ isCreatingOrder: creating }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),

    fetchProducts: async () => {
      try {
        set({ isLoading: true });
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        let products: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          priority: doc.data().priority || 0, // Default priority to 0
        })) as Product[];

        // Sort products by priority and date
        products = sortProductsByPriority(products);

        // Extract unique categories
        const categories = [
          ...new Set(products.map((product) => product.category)),
        ].filter(Boolean);

        set({
          products,
          categories,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        set({ isLoading: false });
      }
    },

    // --- ახალი ფუნქცია: კონკრეტული პროდუქტის წამოღება ---
    getProductById: async (id: string) => {
      const state = get();

      // 1. ჯერ ვეძებთ უკვე ჩატვირთულ პროდუქტებში (Performance Optimization)
      const existingProduct = state.products.find((p) => p.id === id);
      if (existingProduct) {
        return existingProduct;
      }

      // 2. თუ არ გვაქვს, მოგვაქვს Firebase-დან (Direct Link Access)
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const data = productSnap.data();
          const productData = {
            id: productSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Product;

          set({ isLoading: false });
          return productData;
        } else {
          set({ isLoading: false });
          return null;
        }
      } catch (error) {
        console.error("Error fetching product by ID:", error);
        set({ isLoading: false });
        return null;
      }
    },
    // -----------------------------------------------------

    getProductBySlug: async (slug: string) => {
      const existing = get().products.find((p) => p.slug === slug);
      if (existing) return existing;

      try {
        const q = query(
          collection(db, "products"),
          where("slug", "==", slug)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const d = snap.docs[0];
        return {
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
          updatedAt: d.data().updatedAt?.toDate() || new Date(),
        } as Product;
      } catch (error) {
        console.error("Error fetching product by slug:", error);
        return null;
      }
    },

    addProduct: async (productData) => {
      try {
        set({ isLoading: true });
        const productsRef = collection(db, "products");

        // Calculate stock fields for variant products
        let calculatedStock = productData.stock || 0;
        let calculatedTotalStock = productData.stock || 0;

        if (productData.hasVariants && productData.variants) {
          calculatedStock = productData.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
          calculatedTotalStock = calculatedStock;
        }

        // Initialize stock history for the new product
        const now = new Date();
        let stockHistoryForProduct: StockHistory[] = [];
        let stockHistoryForVariants: StockHistory[] = [];

        // Create initial stock history entry
        const initialHistoryEntry: StockHistory = {
          timestamp: now,
          quantity: calculatedStock,
          reason: "Initial stock",
          notes: "Product creation - initial stock set"
        };

        stockHistoryForProduct.push(initialHistoryEntry);

        // If product has variants, create stock history for each variant
        let updatedVariants = undefined;
        if (productData.hasVariants && productData.variants) {
          updatedVariants = productData.variants.map(variant => {
            const variantStock = variant.stock || 0;
            const variantHistoryEntry: StockHistory = {
              timestamp: now,
              quantity: variantStock,
              reason: "Initial stock",
              notes: `Variant creation - initial stock set for ${variant.name}`
            };
            return {
              ...variant,
              stockHistory: [variantHistoryEntry]
            };
          });
        }

        // Build new product object without undefined fields
        const newProduct: any = {
          ...productData,
          stock: calculatedStock,
          totalStock: calculatedTotalStock,
          stockHistory: stockHistoryForProduct,
          createdAt: now,
          updatedAt: now,
        };

        // Only add variants if they exist (avoid undefined fields in Firestore)
        if (updatedVariants !== undefined) {
          newProduct.variants = updatedVariants;
        }

        await addDoc(productsRef, newProduct);

        // Refresh products list
        await get().fetchProducts();
      } catch (error) {
        console.error("Error adding product:", error);
        set({ isLoading: false });
      }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", id);

        // Replace null values with deleteField() to actually remove fields from Firestore
        const firestoreUpdates: Record<string, unknown> = { updatedAt: new Date() };
        for (const [key, value] of Object.entries(updates)) {
          firestoreUpdates[key] = value === null ? deleteField() : value;
        }

        await updateDoc(productRef, firestoreUpdates);

        // Update local state — remove null fields (they were deleted in Firestore)
        const localUpdates = Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== null)
        ) as Partial<Product>;
        set({
          products: get().products.map((product) => {
            if (product.id !== id) return product;
            const merged = { ...product, ...localUpdates, updatedAt: new Date() };
            // Remove keys that were null (deleted)
            for (const [key, value] of Object.entries(updates)) {
              if (value === null) delete (merged as Record<string, unknown>)[key];
            }
            return merged;
          }),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error updating product:", error);
        set({ isLoading: false });
      }
    },

    deleteProduct: async (id: string) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", id);
        await deleteDoc(productRef);

        // Update local state
        set({
          products: get().products.filter((product) => product.id !== id),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        set({ isLoading: false });
      }
    },

    toggleProductStatus: async (id: string) => {
      try {
        const product = get().products.find((p) => p.id === id);
        if (!product) return;

        await get().updateProduct(id, { isActive: !product.isActive });
      } catch (error) {
        console.error("Error toggling product status:", error);
      }
    },

    updateStock: async (id: string, newStock: number, reason?: string) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", id);

        // Get current product to get existing stockHistory
        const currentProduct = await getDoc(productRef);
        const currentData = currentProduct.data() as Product;
        const existingHistory = currentData.stockHistory || [];

        // Add new history entry
        const newHistoryEntry: StockHistory = {
          timestamp: new Date(),
          quantity: newStock,
          reason: reason || "Stock update",
          notes: `Stock changed to ${newStock}`
        };

        const updatedHistory = [...existingHistory, newHistoryEntry];

        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: new Date(),
          stockHistory: updatedHistory,
          ...(reason && { lastStockReason: reason }),
        });

        // Update local state
        set({
          products: get().products.map((product) =>
            product.id === id
              ? { ...product, stock: newStock, updatedAt: new Date(), stockHistory: updatedHistory }
              : product
          ),
          isLoading: false,
        });

        console.log(`✅ Stock updated: ${id} → ${newStock} (${reason || 'No reason'}) - History logged`);
      } catch (error) {
        console.error("Error updating stock:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Variant Management Methods
    updateVariantStock: async (productId: string, variantId: string, newStock: number, reason?: string) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product not found: ${productId}`);
        }

        const productData = productDoc.data() as Product;
        if (!productData.hasVariants || !productData.variants) {
          throw new Error("Product does not have variants");
        }

        // Update the specific variant's stock and add history
        const updatedVariants = productData.variants.map(variant => {
          if (variant.id === variantId) {
            const existingHistory = variant.stockHistory || [];
            const newHistoryEntry: StockHistory = {
              timestamp: new Date(),
              quantity: newStock,
              reason: reason || "Variant stock update",
              notes: `Variant ${variant.name} stock changed to ${newStock}`
            };
            const updatedHistory = [...existingHistory, newHistoryEntry];

            return {
              ...variant,
              stock: newStock,
              updatedAt: new Date(),
              stockHistory: updatedHistory
            };
          }
          return variant;
        });

        // Calculate new total stock
        const totalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);

        await updateDoc(productRef, {
          variants: updatedVariants,
          totalStock,
          stock: totalStock, // Keep legacy stock field synchronized
          updatedAt: new Date(),
          ...(reason && { lastStockReason: reason }),
        });

        // Update local state
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants: updatedVariants,
                  totalStock,
                  stock: totalStock, // Keep legacy stock field synchronized
                  updatedAt: new Date()
                }
              : product
          ),
          isLoading: false,
        });

        console.log(`✅ Variant stock updated: ${productId}/${variantId} → ${newStock} (${reason || 'No reason'})`);
      } catch (error) {
        console.error("Error updating variant stock:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    addVariant: async (productId: string, variantData: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product not found: ${productId}`);
        }

        const productData = productDoc.data() as Product;

        // Create new variant with unique ID
        const newVariant: ProductVariant = {
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...variantData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedVariants = [...(productData.variants || []), newVariant];
        const totalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
        const minPrice = Math.min(...updatedVariants.map(v => v.price));
        const maxPrice = Math.max(...updatedVariants.map(v => v.price));

        await updateDoc(productRef, {
          hasVariants: true,
          variants: updatedVariants,
          totalStock,
          stock: totalStock, // Keep legacy stock field synchronized
          minPrice,
          maxPrice,
          updatedAt: new Date(),
        });

        // Update local state
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  hasVariants: true,
                  variants: updatedVariants,
                  totalStock,
                  stock: totalStock, // Keep legacy stock field synchronized
                  minPrice,
                  maxPrice,
                  updatedAt: new Date()
                }
              : product
          ),
          isLoading: false,
        });

        console.log(`✅ Variant added: ${productId} - ${newVariant.name}`);
      } catch (error) {
        console.error("Error adding variant:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    updateVariant: async (productId: string, variantId: string, updates: Partial<ProductVariant>) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product not found: ${productId}`);
        }

        const productData = productDoc.data() as Product;
        if (!productData.variants) {
          throw new Error("Product has no variants");
        }

        const updatedVariants = productData.variants.map(variant =>
          variant.id === variantId
            ? { ...variant, ...updates, updatedAt: new Date() }
            : variant
        );

        const totalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
        const minPrice = Math.min(...updatedVariants.map(v => v.price));
        const maxPrice = Math.max(...updatedVariants.map(v => v.price));

        await updateDoc(productRef, {
          variants: updatedVariants,
          totalStock,
          minPrice,
          maxPrice,
          updatedAt: new Date(),
        });

        // Update local state
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants: updatedVariants,
                  totalStock,
                  minPrice,
                  maxPrice,
                  updatedAt: new Date()
                }
              : product
          ),
          isLoading: false,
        });

        console.log(`✅ Variant updated: ${productId}/${variantId}`);
      } catch (error) {
        console.error("Error updating variant:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    deleteVariant: async (productId: string, variantId: string) => {
      try {
        set({ isLoading: true });
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product not found: ${productId}`);
        }

        const productData = productDoc.data() as Product;
        if (!productData.variants) {
          throw new Error("Product has no variants");
        }

        const updatedVariants = productData.variants.filter(variant => variant.id !== variantId);

        // If no variants left, convert back to simple product
        if (updatedVariants.length === 0) {
          await updateDoc(productRef, {
            hasVariants: false,
            variants: null,
            totalStock: null,
            minPrice: null,
            maxPrice: null,
            // Reset to simple product - admin will need to set price/stock manually
            price: 0,
            stock: 0,
            updatedAt: new Date(),
          });

          set({
            products: get().products.map((product) =>
              product.id === productId
                ? {
                    ...product,
                    hasVariants: false,
                    variants: undefined,
                    totalStock: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    price: 0,
                    stock: 0,
                    updatedAt: new Date()
                  }
                : product
            ),
            isLoading: false,
          });
        } else {
          const totalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
          const minPrice = Math.min(...updatedVariants.map(v => v.price));
          const maxPrice = Math.max(...updatedVariants.map(v => v.price));

          await updateDoc(productRef, {
            variants: updatedVariants,
            totalStock,
            minPrice,
            maxPrice,
            updatedAt: new Date(),
          });

          set({
            products: get().products.map((product) =>
              product.id === productId
                ? {
                    ...product,
                    variants: updatedVariants,
                    totalStock,
                    minPrice,
                    maxPrice,
                    updatedAt: new Date()
                  }
                : product
            ),
            isLoading: false,
          });
        }

        console.log(`✅ Variant deleted: ${productId}/${variantId}`);
      } catch (error) {
        console.error("Error deleting variant:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    subscribeToProducts: () => {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const state = get();

        // ⚠️ Skip updates while creating order to avoid transaction conflicts
        if (state.isCreatingOrder) {
          console.log("⏸️ subscribeToProducts update skipped (order creation in progress)");
          return;
        }

        console.log("🔥 subscribeToProducts triggered", {
          docChanges: snapshot.docChanges().length,
          docs: snapshot.docs.length,
          timestamp: new Date().toISOString()
        });

        let products: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          priority: doc.data().priority || 0,
        })) as Product[];

        // Sort products by priority and date
        products = sortProductsByPriority(products);

        // Extract unique categories
        const categories = [
          ...new Set(products.map((product) => product.category)),
        ].filter(Boolean);

        set({
          products,
          categories,
          isLoading: false,
        });
      });

      return unsubscribe;
    },

    // ✅ Real-time inventory refresh (მხოლოდ მარაგის მონაცემები, არა სრული პროდუქტები)
    refreshInventory: async () => {
      try {
        const currentProducts = get().products;

        // რომ მხოლოდ stock fields შევამოწმოთ, არ ჩამოვტვირთოთ სრული პროდუქტები
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);

        const updatedProducts = currentProducts.map((currentProduct) => {
          const serverDoc = snapshot.docs.find((doc) => doc.id === currentProduct.id);

          if (serverDoc) {
            const serverData = serverDoc.data();

            // მხოლოდ stock მონაცემების განახლება
            return {
              ...currentProduct,
              stock: serverData.stock || 0,
              totalStock: serverData.totalStock,
              variants: currentProduct.variants?.map((variant) => {
                const serverVariant = serverData.variants?.find((v: any) => v.id === variant.id);
                return serverVariant
                  ? { ...variant, stock: serverVariant.stock || 0 }
                  : variant;
              }),
            };
          }

          return currentProduct; // თუ server-ზე არ არის, უცვლელი დატოვება
        });

        set({ products: updatedProducts });
        console.log("📦 Inventory refreshed silently");
      } catch (error) {
        console.error("❌ Error refreshing inventory:", error);
        // Silent fail - არ ვშლით UX-ს
      }
    },
  })
);
