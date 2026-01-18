// src/services/productService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Product, Category } from "../types";

const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

export class ProductService {
  // Product Code Validation
  static async validateProductCode(productCode: string, excludeProductId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("productCode", "==", productCode)
      );

      const querySnapshot = await getDocs(q);

      // If no documents found, code is unique
      if (querySnapshot.empty) {
        return true;
      }

      // If excluding a product (for updates), check if the found product is the same one
      if (excludeProductId) {
        const foundProducts = querySnapshot.docs;
        return foundProducts.every(doc => doc.id === excludeProductId);
      }

      // Code already exists
      return false;
    } catch (error) {
      console.error("Error validating product code:", error);
      throw new Error("Failed to validate product code");
    }
  }

  // Generate unique product code suggestion
  static async generateProductCode(baseName: string): Promise<string> {
    try {
      // Extract first 2-3 characters from product name
      const prefix = baseName
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase();

      let counter = 1;
      let productCode = `${prefix}${counter.toString().padStart(3, "0")}`;

      // Keep incrementing until we find a unique code
      while (!(await this.validateProductCode(productCode))) {
        counter++;
        productCode = `${prefix}${counter.toString().padStart(3, "0")}`;

        // Safety check to prevent infinite loop
        if (counter > 999) {
          throw new Error("Unable to generate unique product code");
        }
      }

      return productCode;
    } catch (error) {
      console.error("Error generating product code:", error);
      throw new Error("Failed to generate product code");
    }
  }

  // Get all products with category filtering
  static async getProducts(categoryFilter?: string): Promise<Product[]> {
    try {
      let q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));

      if (categoryFilter && categoryFilter !== "all") {
        q = query(
          collection(db, PRODUCTS_COLLECTION),
          where("category", "==", categoryFilter),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  }

  // Get product by product code
  static async getProductByCode(productCode: string): Promise<Product | null> {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("productCode", "==", productCode)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Product;
    } catch (error) {
      console.error("Error fetching product by code:", error);
      throw new Error("Failed to fetch product by code");
    }
  }

  // Category Management
  static async getCategories(): Promise<Category[]> {
    try {
      const q = query(collection(db, CATEGORIES_COLLECTION), orderBy("priority", "asc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  static async createCategory(category: Omit<Category, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating category:", error);
      throw new Error("Failed to create category");
    }
  }
}

export default ProductService;