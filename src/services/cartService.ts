// src/services/cartService.ts
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { CartItem } from '../types';

export interface FirestoreCartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: Timestamp;
}

export class CartService {
  // Save user cart to Firestore
  static async saveUserCart(userId: string, cartData: Omit<FirestoreCartData, 'updatedAt'>) {
    try {
      const cartRef = doc(db, 'userCarts', userId);
      await setDoc(cartRef, {
        ...cartData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving user cart to Firestore:', error);
      throw error;
    }
  }

  // Load user cart from Firestore
  static async loadUserCart(userId: string): Promise<FirestoreCartData | null> {
    try {
      const cartRef = doc(db, 'userCarts', userId);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        return cartSnap.data() as FirestoreCartData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user cart from Firestore:', error);
      return null;
    }
  }

  // Delete user cart from Firestore
  static async deleteUserCart(userId: string) {
    try {
      const cartRef = doc(db, 'userCarts', userId);
      await deleteDoc(cartRef);
    } catch (error) {
      console.error('Error deleting user cart from Firestore:', error);
      throw error;
    }
  }

  // Subscribe to real-time cart updates
  static subscribeToUserCart(
    userId: string,
    callback: (cartData: FirestoreCartData | null) => void
  ) {
    const cartRef = doc(db, 'userCarts', userId);

    return onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FirestoreCartData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in cart subscription:', error);
      callback(null);
    });
  }
}