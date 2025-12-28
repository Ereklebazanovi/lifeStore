// src/types/index.ts

export type OrderSource =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "phone"
  | "personal"
  | "other";

// Variant represents a specific variation of a product (e.g., "Round 500ml", "Square 850ml")
export interface ProductVariant {
  id: string; // Unique ID for each variant (e.g., "var_123abc")
  name: string; // User-defined name (e.g., "Round 500ml", "Bamboo Lid", "3-Piece Set")
  price: number; // Variant-specific price
  stock: number; // Variant-specific stock
  isActive: boolean; // Can be disabled without deleting
  createdAt: Date;
  updatedAt: Date;
}

// Main Product acts as a container for variants or standalone item
export interface Product {
  id: string;
  name: string; // Base product name (e.g., "Lunchbox", "Glass Container Set")
  description: string;
  images: string[];
  category: string;

  // Variant System
  hasVariants?: boolean; // If true, this product has multiple variations (default: false)
  variants?: ProductVariant[]; // Array of variants (only if hasVariants=true)

  // For non-variant products (simple products) - Backward compatible
  price: number; // Always present for backward compatibility
  originalPrice?: number;
  stock: number; // Always present for backward compatibility

  // Computed fields (read-only)
  totalStock?: number; // Sum of all variant stocks (auto-calculated)
  minPrice?: number; // Lowest price among variants (auto-calculated)
  maxPrice?: number; // Highest price among variants (auto-calculated)

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
  description?: string;
  image?: string;
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
  orderStatus: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date; // ✅ Added for payment completion timestamp
  deliveredAt?: Date;
  adminNotes?: string;
  trackingNumber?: string;
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
  status: "pending" | "shipped" | "delivered";
  paymentMethod: Order["paymentMethod"];
}

export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
// ეს რჩება როგორც არის (სტრინგების ტიპი)
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "manager" | "customer";
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
