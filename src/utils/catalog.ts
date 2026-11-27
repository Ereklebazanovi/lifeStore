import type { Category, Product } from "../types";
import { hasDiscount } from "./discount";
import { getLocalizedProductName } from "./i18nHelpers";
import { getProductStock } from "./productHelpers";

export type CatalogSort = "recommended" | "newest" | "price-asc" | "price-desc";

export function isCatalogSort(value: string | null): value is CatalogSort {
  return value === "recommended" || value === "newest" || value === "price-asc" || value === "price-desc";
}

export function catalogProductView(product: Product, inStock: boolean, onSale: boolean): Product {
  if (!product.hasVariants || !product.variants || (!inStock && !onSale)) return product;
  const variants = product.variants.filter(variant => (
    variant.isActive &&
    (!inStock || variant.stock > 0) &&
    (!onSale || (!!variant.salePrice && variant.salePrice < variant.price))
  ));
  return { ...product, variants };
}

export function getCatalogPrice(product: Product, inStock = false, onSale = false): number {
  const variants = catalogProductView(product, inStock, onSale).variants?.filter(variant => variant.isActive);
  if (product.hasVariants && variants?.length) {
    return Math.min(...variants.map(variant => Math.min(variant.price, variant.salePrice || variant.price)));
  }
  return Math.min(product.price ?? product.minPrice ?? 0, product.salePrice || Infinity);
}

export function selectCatalogProducts(products: Product[], options: {
  category?: Category;
  query: string;
  inStock: boolean;
  onSale: boolean;
  sort: CatalogSort;
  language: string;
}): Product[] {
  const terms = options.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = products.filter(product => {
    if (product.isActive === false || (options.category && product.category !== options.category.name)) return false;
    const searchable = [
      getLocalizedProductName(product, options.language),
      product.name, product.nameEn, product.nameRu, product.productCode,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    if (!terms.every(term => searchable.includes(term))) return false;
    if (options.inStock && getProductStock(product) <= 0) return false;
    if (options.onSale && !hasDiscount(product)) return false;
    if (options.inStock && options.onSale && product.hasVariants && product.variants) {
      return !!catalogProductView(product, true, true).variants?.length;
    }
    return true;
  });

  if (options.sort === "newest") {
    return filtered.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
  }
  if (options.sort === "price-asc" || options.sort === "price-desc") {
    const direction = options.sort === "price-asc" ? 1 : -1;
    const price = (product: Product) => getCatalogPrice(product, options.inStock, options.onSale);
    return filtered.sort((a, b) => direction * (price(a) - price(b)));
  }
  return filtered;
}
