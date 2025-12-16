//auth store: src/store/authStore.ts
import { create } from "zustand";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import type { AuthState, User } from "../types";

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
    // 1. ვიწყებთ ლოადინგს
    set({ isLoading: true });

    // Create a timeout to auto-stop loading after 3 seconds if no response
    const timeoutId = setTimeout(() => {
      console.log("Sign-in timeout - stopping loading state");
      set({ isLoading: false });
    }, 3000);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Clear timeout since we got a successful result
      clearTimeout(timeoutId);

      if (result.user) {
        await get().checkUserRole(result.user.uid);
      }
    } catch (error: any) {
      // Clear timeout on any error
      clearTimeout(timeoutId);

      // თუ მომხმარებელმა ფანჯარა დახურა, ეს არ არის კრიტიკული ერორი
      if (error.code === "auth/popup-closed-by-user") {
        console.log("მომხმარებელმა გათიშა შესვლის ფანჯარა");
      } else {
        console.error("Error signing in with Google:", error);
      }

      // Immediately stop loading on error
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await firebaseSignOut(auth);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      set({ isLoading: false });
    }
  },

  checkUserRole: async (uid: string): Promise<User | null> => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        return userData;
      } else {
        const newUser: User = {
          id: uid,
          email: auth.currentUser?.email || "",
          displayName: auth.currentUser?.displayName || "",
          role: "customer",
          createdAt: new Date(),
        };

        await setDoc(userRef, newUser);
        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return newUser;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
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
          isLoading: false,
        });
      }
    });
  },
}));
