// src/types/index.ts

// 1. ✅ ახალი ტიპი წყაროებისთვის
export type OrderSource =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "phone"
  | "personal"
  | "other";

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // საბოლოო გასაყიდი ფასი (რასაც კლიენტი იხდის)
  originalPrice?: number; // ძველი ფასი (ფასდაკლების შემთხვევაში)
  images: string[];
  category: string;
  stock: number;
  featured?: boolean;
  priority?: number; // პროდუქტის პრიორიტეტი (0 = სტანდარტული, მაღალი = ზემოთ)
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

// Cart Types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  userId: string | null; // null = guest user
  orderNumber: string; // LS-240001 format

  // ✅ ახალი ველი: საიდან მოვიდა შეკვეთა
  source?: OrderSource;

  // Product Info
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;

  // Customer Info
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string; // manual შეკვეთისას შეიძლება ცარიელი იყოს ან fake
    isGuest: boolean;
  };

  // Delivery Info
  deliveryInfo: {
    city: string;
    address: string;
    comment?: string;
  };

  // Payment & Status
  // ✅ გავაფართოვეთ მეთოდები
  paymentMethod:
    | "cash"
    | "tbc_bank"
    | "visa"
    | "mastercard"
    | "bank_transfer"
    | "other";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "delivered" | "cancelled";

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;

  // Admin notes
  adminNotes?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

// ✅ ახალი ტიპი: მხოლოდ მენეჯერის ფორმისთვის (ხელით შეყვანილი ნივთი)
export interface ManualOrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
}

// For creating new orders (საიტიდან)
export interface CreateOrderRequest {
  userId: string | null;
  items: CartItem[];
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  deliveryInfo: {
    city: string;
    address: string;
    comment?: string;
  };
  paymentMethod: "cash" | "tbc_bank" | "flitt";
}

// Payment Integration Types
export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
  response?: any;
}

export interface PaymentStatus {
  success: boolean;
  status: "pending" | "approved" | "declined" | "processing";
  response?: any;
}

// ✅ ახალი ტიპი: მენეჯერის მიერ შეკვეთის შექმნა
export interface CreateManualOrderRequest {
  items: ManualOrderItem[]; // აქ უკვე გამარტივებული ნივთებია
  source: OrderSource;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string; // მეილი არასავალდებულოა ხელით შეყვანისას
  };
  deliveryInfo: {
    city: string;
    address: string;
    comment?: string;
  };
  shippingCost: number; // მენეჯერს შეუძლია ხელით მიუთითოს
  status: "pending" | "confirmed" | "delivered"; // მენეჯერი ირჩევს სტატუსს
  paymentMethod: Order["paymentMethod"];
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// User Types (for admin)
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "customer";
  createdAt: Date;
}

// Store State Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface ProductState {
  products: Product[];
  isLoading: boolean;
  categories: string[];
}

// Checkout Form Types
export interface DeliveryInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  comment?: string;
  paymentMethod: "cash" | "card";
}
