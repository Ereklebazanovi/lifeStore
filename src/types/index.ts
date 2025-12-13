// src/types/index.ts
// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  featured?: boolean;
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
    email: string;
    isGuest: boolean;
  };

  // Delivery Info
  deliveryInfo: {
    city: string;
    address: string;
    comment?: string;
  };

  // Payment & Status
  paymentMethod: 'cash' | 'tbc_bank' | 'visa' | 'mastercard';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

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
  product: Product; // მთელი product object
  quantity: number;
  price: number; // unit price at time of order
  total: number; // quantity * price
}

// For creating new orders
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
  paymentMethod: 'cash' | 'tbc_bank';
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// User Types (for admin)
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'customer';
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
  paymentMethod: 'cash' | 'card';
}