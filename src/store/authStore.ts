//AuthStore.ts
import { create } from 'zustand';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { AuthState, User } from '../types';

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
  checkUserRole: (uid: string) => Promise<User | null>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        await get().checkUserRole(result.user.uid);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Don't keep loading if user cancels sign-in
      if ((error as { code: string }).code !== 'auth/popup-closed-by-user' && (error as { code: string }).code !== 'auth/cancelled-popup-request') {
        set({ isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  checkUserRole: async (uid: string): Promise<User | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
        return userData;
      } else {
        // Create new user document for first-time users
        const newUser: User = {
          id: uid,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          role: 'customer', // Default role
          createdAt: new Date()
        };

        await setDoc(userRef, newUser);
        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false
        });
        return newUser;
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      set({ isLoading: false });
      return null;
    }
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await get().checkUserRole(firebaseUser.uid);
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });
  }
}));