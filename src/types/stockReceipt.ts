import type { OrderActor } from "./index";

/** მიღებიდან ახლად შექმნილი პროდუქტი — იქმნება დამალული, ფასის/ფოტოს გარეშე. */
export interface NewReceiptProduct {
  name: string;
  productCode: string;
  category?: string;
}

export interface StockReceiptInputItem {
  /** არსებული პროდუქტის id, ან ახალი პროდუქტისთვის წინასწარ შექმნილი id */
  productId: string;
  quantity: number;
  /** აქედან პირდაპირ მაღაზიაში (0..quantity) */
  toStore?: number;
  /** მხოლოდ ახალ მიღებაში: პროდუქტი ჯერ არ არსებობს */
  newProduct?: NewReceiptProduct;
}

export interface StockReceiptItem {
  productId: string;
  /** შენახვის მომენტის სახელი/კოდი — ჟურნალი მიმდინარეს აჩვენებს, ეს საჭიროა წაშლილი პროდუქტისთვის */
  name: string;
  productCode: string;
  quantity: number;
  toStore: number;
  createdProduct?: boolean;
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  date: Date;
  supplier: string;
  documentNumber: string;
  note: string;
  items: StockReceiptItem[];
  totalQuantity: number;
  totalToStore: number;
  storeTransferId?: string;
  storeTransferNumber?: string;
  createdAt: Date;
  createdBy: OrderActor;
  updatedAt?: Date;
  updatedBy?: OrderActor;
}

export interface StockReceiptRequest {
  /** მოძრაობის დღე (YYYY-MM-DD) */
  date: string;
  supplier: string;
  documentNumber?: string;
  note?: string;
  items: StockReceiptInputItem[];
}
