import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Review } from "../types";

const REVIEWS_COLLECTION = "reviews";

export class ReviewService {
  // პროდუქტის ყველა დამტკიცებული შეფასება (დახარისხებული — ახალი პირველი)
  static async getByProduct(productId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where("productId", "==", productId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
          } as Review;
        })
        .filter((r) => r.isApproved)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  // მომხმარებელმა ამ პროდუქტზე უკვე დატოვა შეფასება?
  static async hasReviewed(userId: string, productId: string): Promise<boolean> {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("productId", "==", productId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // ახალი შეფასების დამატება (auth არ არის საჭირო — guest-ებიც წერენ)
  static async add(
    review: Omit<Review, "id" | "createdAt" | "isApproved">
  ): Promise<void> {
    await addDoc(collection(db, REVIEWS_COLLECTION), {
      productId: review.productId,
      userName: review.userName,
      rating: review.rating,
      text: review.text,
      ...(review.userId ? { userId: review.userId } : {}),
      isApproved: true,
      createdAt: serverTimestamp(),
    });
  }
}
