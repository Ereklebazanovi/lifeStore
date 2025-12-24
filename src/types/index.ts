// src/types/index.ts

export type OrderSource =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "phone"
  | "personal"
  | "other";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock: number;
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
  product: Product;
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
  orderStatus: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
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

export interface ManualOrderItem {
  productId?: string;
  name: string;
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
  status: "pending" | "confirmed" | "delivered";
  paymentMethod: Order["paymentMethod"];
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
// ეს რჩება როგორც არის (სტრინგების ტიპი)
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "customer";
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