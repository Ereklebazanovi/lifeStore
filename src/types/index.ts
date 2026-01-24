// src/types/index.ts

export type OrderSource =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "phone"
  | "personal"
  | "other";

export interface StockHistory {
  timestamp: Date;
  quantity: number;
  reason: string;
  orderId?: string;
  notes?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  stock: number;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stockHistory?: StockHistory[];
}

// Main Product acts as a container for variants or standalone item
export interface Product {
  id: string;
  name: string; // Base product name (e.g., "Lunchbox", "Glass Container Set")
  productCode: string; // Unique product code for accounting (e.g., "LC001", "GCS002")
  description: string;
  images: string[];
  category: string;

  // Variant System
  hasVariants?: boolean; // If true, this product has multiple variations (default: false)
  variants?: ProductVariant[]; // Array of variants (only if hasVariants=true)

  // For non-variant products (simple products) - Backward compatible
  price: number;
  salePrice?: number;
  originalPrice?: number;
  stock: number;
  weight?: number;
  stockHistory?: StockHistory[];

  // Computed fields (read-only)
  totalStock?: number;
  minPrice?: number;
  maxPrice?: number;

  // Meta
  featured?: boolean;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  productId: string;
  variantId?: string; // If product has variants, this specifies which one
  product: Product;
  variant?: ProductVariant; // The specific variant selected (if applicable)
  quantity: number;
}

export interface Order {
  id: string;
  userId: string | null;
  orderNumber: string;
  accessToken?: string; // ✅ უნიქალური token permanent access-ისთვის
  source?: OrderSource;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    isGuest: boolean;
  };
  deliveryInfo: {
    shippingCost: any;
    city: string;
    address: string;
    comment?: string;
  };
  // ✅ შესწორება 1: დაემატა "flitt"
  paymentMethod:
    | "cash"
    | "tbc_bank"
    | "flitt"
    | "visa"
    | "mastercard"
    | "bank_transfer"
    | "other";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date | { seconds: number; nanoseconds: number }; // ✅ Added for payment completion timestamp
  deliveredAt?: Date | { seconds: number; nanoseconds: number };
  adminNotes?: string;
  trackingNumber?: string;
  // Cancellation fields
  cancelReason?: string;
  cancellationReason?: string;
  cancelledAt?: Date | { seconds: number; nanoseconds: number };
}

export interface OrderItem {
  productId: string;
  variantId?: string; // If product has variants, this specifies which one
  product: Product;
  variant?: ProductVariant; // The specific variant ordered (if applicable)
  quantity: number;
  price: number; // Price at time of order (from variant or product)
  total: number;
}

export interface ManualOrderItem {
  productId?: string;
  variantId?: string; // For variant-based products
  name: string; // Display name (product + variant name if applicable)
  price: number;
  quantity: number;
  weight?: number; // Weight in grams (გრ)
}

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

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  customerEmail?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
  response?: any;
}

// ✅ შესწორება 2: გადავარქვით სახელი, რომ არ დამთხვეოდა ქვედა ტიპს
export interface PaymentGatewayStatus {
  success: boolean;
  status: "pending" | "approved" | "declined" | "processing";
  response?: any;
}

export interface CreateManualOrderRequest {
  items: ManualOrderItem[];
  source: OrderSource;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  deliveryInfo: {
    city: string;
    address: string;
    comment?: string;
  };
  shippingCost: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  paymentMethod: Order["paymentMethod"];
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
// ეს რჩება როგორც არის (სტრინგების ტიპი)
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "manager" | "warehouse" | "customer";
  createdAt: Date;
}

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
