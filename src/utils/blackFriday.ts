import type { Product } from "../types";
import { catalogProductView, getCatalogPrice } from "./catalog";
import { hasDiscount } from "./discount";
import { getProductStock } from "./productHelpers";

// The partner's November 25 campaign list, excluding its three full-price items.
const campaignCodes = new Set([
  "SJS-0001", "SJS-0002", "SJS-0003", "RGC-002", "BBWO-001", "FCS-0002",
  "LBB-0001", "LBB-0004", "LBB-0006", "LBB-0007",
  "LBS-0001", "LBS-0003", "LBS-0004", "LBS-0005", "LBS-0006", "LBS-0007",
  "BLB-0070", "BLB-0085", "BLB-0052", "BLB-0099", "BLB-0110",
  "BLBB-0070", "BLBB-0085", "BLBB-0052", "BLBB-0099", "BLBB-0110",
  "FLB-001", "LBR-001", "RLB-001", "RLB-002", "BS-001",
  "GCW-800", "GCW-1000", "GCW-1200", "GCWS-500", "GCWS-600", "GCWS-800",
  "RGC-600", "BB-002", "CHB-001", "CHB-002", "CHB-003", "BBW-001", "BBB-001", "BBG-001",
]);

const featuredCodes = ["BBW-001", "LBR-001", "LBB-0006", "GCW-800"];
const productCode = (product: Product) => product.productCode?.trim().toUpperCase();

export function getBlackFridayProducts(products: Product[]): Product[] {
  return products
    .filter(product => product.isActive !== false && campaignCodes.has(productCode(product)))
    .map(product => catalogProductView(product, true, true))
    .filter(product => getProductStock(product) > 0 && hasDiscount(product));
}

export function getBlackFridayFeatured(products: Product[]): Product[] {
  return featuredCodes.flatMap(code => {
    const product = products.find(item => productCode(item) === code);
    return product ? [product] : [];
  });
}

export function getBlackFridayStartingPrice(offers: Product[]): number | null {
  const prices = offers.map(product => getCatalogPrice(product)).filter(price => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}
