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
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  titleRu?: string;
  excerpt: string;
  excerptEn?: string;
  excerptRu?: string;
  content: string;
  contentEn?: string;
  contentRu?: string;
  image?: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  // Internal-linking for topical authority: blog → commerce pages
  relatedProductIds?: string[];
  relatedCategorySlugs?: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type BlogPostInput = Omit<BlogPost, "id" | "createdAt" | "updatedAt">;

const COLLECTION = "blogPosts";

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

function fromDoc(id: string, data: Record<string, unknown>): BlogPost {
  return {
    id,
    slug: (data.slug as string) || "",
    title: (data.title as string) || "",
    excerpt: (data.excerpt as string) || "",
    content: (data.content as string) || "",
    titleEn: (data.titleEn as string) || undefined,
    titleRu: (data.titleRu as string) || undefined,
    excerptEn: (data.excerptEn as string) || undefined,
    excerptRu: (data.excerptRu as string) || undefined,
    contentEn: (data.contentEn as string) || undefined,
    contentRu: (data.contentRu as string) || undefined,
    image: data.image as string | undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    relatedProductIds: Array.isArray(data.relatedProductIds) ? (data.relatedProductIds as string[]) : [],
    relatedCategorySlugs: Array.isArray(data.relatedCategorySlugs) ? (data.relatedCategorySlugs as string[]) : [],
    readTime: (data.readTime as number) || 1,
    isPublished: Boolean(data.isPublished),
    publishedAt: toDate(data.publishedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export const BlogService = {
  async getPublishedPosts(maxResults?: number): Promise<BlogPost[]> {
    let q = query(
      collection(db, COLLECTION),
      where("isPublished", "==", true),
      orderBy("publishedAt", "desc")
    );
    if (maxResults) q = query(q, limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromDoc(d.id, d.data()));
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const q = query(collection(db, COLLECTION), where("slug", "==", slug), where("isPublished", "==", true), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return fromDoc(d.id, d.data());
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return fromDoc(snap.id, snap.data());
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromDoc(d.id, d.data()));
  },

  async createPost(data: BlogPostInput): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      publishedAt: data.isPublished ? Timestamp.fromDate(data.publishedAt) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async updatePost(id: string, data: Partial<BlogPostInput>): Promise<void> {
    const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.publishedAt instanceof Date) {
      payload.publishedAt = Timestamp.fromDate(data.publishedAt);
    }
    await updateDoc(doc(db, COLLECTION, id), payload);
  },

  async deletePost(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
