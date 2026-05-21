import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../services/firebase";
import { Star, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import type { Review } from "../../../types";

interface ReviewWithProduct extends Review {
  productName?: string;
}

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
      />
    ))}
  </span>
);

const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [reviewsSnap, productsSnap] = await Promise.all([
        getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "products")),
      ]);

      const productMap: Record<string, string> = {};
      productsSnap.forEach((d) => {
        productMap[d.id] = d.data().name as string;
      });

      const data: ReviewWithProduct[] = reviewsSnap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          productId: raw.productId,
          productName: productMap[raw.productId] || raw.productId,
          userId: raw.userId,
          userName: raw.userName,
          rating: raw.rating,
          text: raw.text,
          isApproved: raw.isApproved ?? true,
          createdAt:
            raw.createdAt?.toDate ? raw.createdAt.toDate() : new Date(raw.createdAt),
        };
      });

      setReviews(data);
    } catch (e) {
      console.error("Reviews fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("შეფასება წაიშლება. ადასტურებთ?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "reviews", id));
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleApproval = async (review: ReviewWithProduct) => {
    setTogglingId(review.id);
    try {
      await updateDoc(doc(db, "reviews", review.id), {
        isApproved: !review.isApproved,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, isApproved: !r.isApproved } : r
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "approved") return r.isApproved;
    if (filter === "pending") return !r.isApproved;
    return true;
  });

  const counts = {
    all: reviews.length,
    approved: reviews.filter((r) => r.isApproved).length,
    pending: reviews.filter((r) => !r.isApproved).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">შეფასებები</h2>
          <p className="text-sm text-gray-500">{counts.all} სულ · {counts.pending} მოლოდინში</p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="განახლება"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["all", "approved", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "all" ? "ყველა" : f === "approved" ? "გამოქვეყნებული" : "მოლოდინში"}
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          იტვირთება...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">შეფასება არ მოიძებნა</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-lg p-4 shadow-sm flex gap-4 items-start ${
                !review.isApproved ? "border-amber-200 bg-amber-50/30" : "border-gray-200"
              }`}
            >
              {/* Status dot */}
              <div className="flex-shrink-0 mt-1">
                {review.isApproved ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" title="გამოქვეყნებული" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" title="მოლოდინში" />
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium text-gray-900 text-sm">{review.userName}</span>
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs text-gray-400">
                    {review.createdAt.toLocaleDateString("ka-GE")}
                  </span>
                </div>
                <p className="text-xs text-blue-600 font-medium truncate">
                  {review.productName}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.text}</p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <button
                  onClick={() => handleToggleApproval(review)}
                  disabled={togglingId === review.id}
                  title={review.isApproved ? "გამოქვეყნების გაუქმება" : "გამოქვეყნება"}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    review.isApproved
                      ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {review.isApproved ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  title="წაშლა"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManager;
