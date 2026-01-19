import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";
import type { Category } from "../types";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
}

interface CategoryActions {
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryBySlug: (slug: string) => Category | undefined;
  subscribeToCategories: () => () => void;
  setLoading: (loading: boolean) => void;
}

export const useCategoryStore = create<CategoryState & CategoryActions>(
  (set, get) => ({
    categories: [],
    isLoading: false,

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    fetchCategories: async () => {
      try {
        set({ isLoading: true });
        const categoriesRef = collection(db, "categories");
        const q = query(categoriesRef, orderBy("priority", "asc"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const categories: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Category[];

        set({ categories, isLoading: false });
      } catch (error) {
        console.error("Error fetching categories:", error);
        set({ isLoading: false });
      }
    },

    addCategory: async (categoryData) => {
      try {
        set({ isLoading: true });
        const categoriesRef = collection(db, "categories");

        const newCategory = {
          ...categoryData,
          isActive: categoryData.isActive !== false,
          priority: categoryData.priority || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(categoriesRef, newCategory);
        await get().fetchCategories();
      } catch (error) {
        console.error("Error adding category:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    updateCategory: async (id: string, updates: Partial<Category>) => {
      try {
        set({ isLoading: true });
        const categoryRef = doc(db, "categories", id);

        await updateDoc(categoryRef, {
          ...updates,
          updatedAt: new Date(),
        });

        set({
          categories: get().categories.map((cat) =>
            cat.id === id
              ? { ...cat, ...updates, updatedAt: new Date() }
              : cat
          ),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error updating category:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    deleteCategory: async (id: string) => {
      try {
        set({ isLoading: true });
        const categoryRef = doc(db, "categories", id);
        await deleteDoc(categoryRef);

        set({
          categories: get().categories.filter((cat) => cat.id !== id),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error deleting category:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    getCategoryBySlug: (slug: string) => {
      return get().categories.find((cat) => cat.slug === slug && cat.isActive !== false);
    },

    subscribeToCategories: () => {
      const categoriesRef = collection(db, "categories");
      const q = query(categoriesRef, orderBy("priority", "asc"), orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const categories: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Category[];

        set({ categories, isLoading: false });
      });

      return unsubscribe;
    },
  })
);
