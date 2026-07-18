// Hand-authored types mirroring supabase/schema.sql.
// For a fully generated version run:
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
// and merge with the domain helper types below.

export type UserRole = "customer" | "admin" | "shop_owner" | "delivery_partner";
export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped"
  | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "stripe" | "upi" | "cod";
export type CouponType = "percentage" | "fixed";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  shop_name: string | null;
  shop_address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  brand: string | null;
  attributes: Record<string, string[]>;
  is_active: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  owner_id: string | null; // profile id of the shop owner who uploaded it; null = admin-owned
  created_at: string;
  updated_at: string;
  // joined
  product_images?: ProductImage[];
  category?: Category;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface InventoryRow {
  id: string;
  product_id: string;
  variant_key: string;
  quantity: number;
  low_stock_threshold: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_key: string;
  quantity: number;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax: number;
  total: number;
  coupon_id: string | null;
  shipping_address: Address;
  billing_address: Address | null;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  variant_key: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  provider_payment_id: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  created_at: string;
  profile?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

// Minimal Database generic to satisfy @supabase/ssr typings.
// Replace with the full generated type for strict column-level typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
