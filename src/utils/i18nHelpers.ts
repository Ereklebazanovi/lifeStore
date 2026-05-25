import type { Product, Category } from "../types";
import type { BlogPost } from "../services/blogService";

export function getLocalizedProductName(product: Product, lang: string): string {
  if (lang === "en" && product.nameEn) return product.nameEn;
  if (lang === "ru" && product.nameRu) return product.nameRu;
  return product.name;
}

export function getLocalizedProductDescription(product: Product, lang: string): string {
  if (lang === "en" && product.descriptionEn) return product.descriptionEn;
  if (lang === "ru" && product.descriptionRu) return product.descriptionRu;
  return product.description;
}

export function getLocalizedCategoryName(category: Category, lang: string): string {
  if (lang === "en" && category.nameEn) return category.nameEn;
  if (lang === "ru" && category.nameRu) return category.nameRu;
  return category.name;
}

export function getLocalizedCategoryDescription(category: Category, lang: string): string {
  if (lang === "en" && category.descriptionEn) return category.descriptionEn;
  if (lang === "ru" && category.descriptionRu) return category.descriptionRu;
  return category.description || "";
}

export function getLocalizedBlogTitle(post: BlogPost, lang: string): string {
  if (lang === "en" && post.titleEn) return post.titleEn;
  if (lang === "ru" && post.titleRu) return post.titleRu;
  return post.title;
}

export function getLocalizedBlogExcerpt(post: BlogPost, lang: string): string {
  if (lang === "en" && post.excerptEn) return post.excerptEn;
  if (lang === "ru" && post.excerptRu) return post.excerptRu;
  return post.excerpt;
}

export function getLocalizedBlogContent(post: BlogPost, lang: string): string {
  if (lang === "en" && post.contentEn) return post.contentEn;
  if (lang === "ru" && post.contentRu) return post.contentRu;
  return post.content;
}

export function getLocalizedBlogTag(tag: string, t: (key: string) => string): string {
  const translated = t(`blog.tags.${tag}`);
  // i18next returns the key itself if not found — fall back to original
  return translated === `blog.tags.${tag}` ? tag : translated;
}
