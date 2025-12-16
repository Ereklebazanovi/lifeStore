// src/store/productStore.ts

import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  getDoc, // <--- ახალი იმპორტი
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";
import type { ProductState, Product } from "../types";

interface ProductActions {
  fetchProducts: () => Promise<void>;
  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>; // <--- ახალი ფუნქციის ტიპი
  subscribeToProducts: () => () => void;
  setLoading: (loading: boolean) => void;
}

export const useProductStore = create<ProductState & ProductActions>(
  (set, get) => ({
    products: [],
    isLoading: false,
    categories: [],

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    fetchProducts: async () => {
      try {
        set({ isLoading: true });
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const products: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Product[];

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

    addProduct: async (productData) => {
      try {
        set({ isLoading: true });
        const productsRef = collection(db, "products");

        const newProduct = {
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

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

        await updateDoc(productRef, {
          ...updates,
          updatedAt: new Date(),
        });

        // Update local state
        set({
          products: get().products.map((product) =>
            product.id === id
              ? { ...product, ...updates, updatedAt: new Date() }
              : product
          ),
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

    subscribeToProducts: () => {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const products: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Product[];

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
  })
);
