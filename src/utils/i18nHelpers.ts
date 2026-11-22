import type { Product, Category, CartItem } from "../types";
import type { BlogPost } from "../services/blogService";

export function getLocalizedProductName(product: Product, lang: string): string {
  const language = lang.split("-")[0];
  const localized = (language === "en" ? product.nameEn : language === "ru" ? product.nameRu : product.name) || product.name;
  const name = localized.replace(/(\S)\(/g, "$1 (");
  // These listings share a generic catalog title. Use the finish as their visible distinction.
  const finishes = {
    "faifuris-nakrebi-sjs-0003": { ka: "გლუვი", en: "Smooth", ru: "Гладкий" },
    "faifuris-nakrebi-sjs-0002": { ka: "წერტილოვანი რელიეფით", en: "Dotted", ru: "Точечный рельеф" },
    "faifuris-nakrebi": { ka: "გეომეტრიული რელიეფით", en: "Geometric", ru: "Геометрический рельеф" },
  };
  const finish = finishes[product.slug as keyof typeof finishes];
  if (product.name === "ფაიფურის ნაკრები" && finish) {
    return `${name} · ${finish[language === "en" || language === "ru" ? language : "ka"]}`;
  }
  return name;
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

export function getLocalizedCategorySeoContent(category: Category, lang: string): string {
  if (lang === "en" && category.seoContentEn) return category.seoContentEn;
  if (lang === "ru" && category.seoContentRu) return category.seoContentRu;
  return category.seoContent || "";
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

export function getLocalizedCartItemDisplayName(item: CartItem, lang: string): string {
  const baseName = getLocalizedProductName(item.product, lang);
  if (item.variantId && item.product.variants) {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    if (variant?.name) return `${baseName} (${variant.name})`;
  }
  return baseName;
}

export function getLocalizedBlogTag(tag: string, t: (key: string) => string): string {
  const translated = t(`blog.tags.${tag}`);
  // i18next returns the key itself if not found — fall back to original
  return translated === `blog.tags.${tag}` ? tag : translated;
}
