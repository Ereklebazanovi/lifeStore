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
  userId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderSource = 'website' | 'facebook' | 'manual';

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