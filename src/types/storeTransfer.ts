import type { OrderActor } from "./index";

export type StoreTransferType = "out" | "return";
export interface StoreTransferInputItem {
  productId: string;
  variantId?: string;
  quantity: number;
}
export interface StoreTransferItem extends StoreTransferInputItem {
  name: string;
  price: number;
}
export interface StoreTransfer {
  id: string;
  transferNumber: string;
  type: StoreTransferType;
  storeId: string;
  storeName: string;
  storeAddress: string;
  items: StoreTransferItem[];
  totalQuantity: number;
  totalValue: number;
  note: string;
  date: Date;
  createdAt: Date;
  createdBy: OrderActor;
  updatedAt?: Date;
  updatedBy?: OrderActor;
  /** მიღებიდან („აქედან მაღაზიაში“) შექმნილი გადატანა — იცვლება მხოლოდ თავისი მიღებიდან */
  receiptId?: string;
  receiptNumber?: string;
}
export interface StoreTransferRequest {
  type: StoreTransferType;
  items: StoreTransferInputItem[];
  note?: string;
  /** Actual movement day (YYYY-MM-DD); omitted by older callers. */
  date?: string;
}
