import type { StoreTransfer } from "../types/storeTransfer";

export const isStoreMovementReason = (reason: unknown): boolean =>
  typeof reason === "string" &&
  /^Store (transfer|return)(?: edit| deleted)? #ST-/.test(reason);

export function summarizeStoreTransfers(
  transfers: StoreTransfer[],
  range: [Date, Date] | null,
) {
  const products = new Map<
    string,
    {
      productId: string;
      variantId?: string;
      name: string;
      outQuantity: number;
      returnQuantity: number;
      netQuantity: number;
      outValue: number;
      returnValue: number;
      netValue: number;
    }
  >();
  let outCount = 0,
    returnCount = 0,
    outQuantity = 0,
    returnQuantity = 0,
    outValue = 0,
    returnValue = 0;
  for (const transfer of transfers) {
    if (range && (transfer.date < range[0] || transfer.date > range[1]))
      continue;
    if (transfer.type === "out") outCount++;
    else returnCount++;
    for (const item of transfer.items) {
      const key = JSON.stringify([item.productId, item.variantId || ""]);
      const row = products.get(key) || {
        productId: item.productId,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        name: item.name,
        outQuantity: 0,
        returnQuantity: 0,
        netQuantity: 0,
        outValue: 0,
        returnValue: 0,
        netValue: 0,
      };
      const value = item.price * item.quantity;
      if (transfer.type === "out") {
        row.outQuantity += item.quantity;
        row.outValue += value;
        outQuantity += item.quantity;
        outValue += value;
      } else {
        row.returnQuantity += item.quantity;
        row.returnValue += value;
        returnQuantity += item.quantity;
        returnValue += value;
      }
      row.netQuantity = row.outQuantity - row.returnQuantity;
      row.netValue = Math.round((row.outValue - row.returnValue) * 100) / 100;
      products.set(key, row);
    }
  }
  return {
    outCount,
    returnCount,
    outQuantity,
    returnQuantity,
    netQuantity: outQuantity - returnQuantity,
    outValue: Math.round(outValue * 100) / 100,
    returnValue: Math.round(returnValue * 100) / 100,
    netValue: Math.round((outValue - returnValue) * 100) / 100,
    products: [...products.values()].sort(
      (a, b) => b.outQuantity - a.outQuantity || a.name.localeCompare(b.name),
    ),
  };
}
