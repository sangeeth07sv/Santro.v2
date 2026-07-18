import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name is too short"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["customer", "shop_owner", "delivery_partner"]).default("customer"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const addressSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(8, "Enter a valid phone number"),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postal_code: z.string().min(3),
  country: z.string().default("IN"),
  is_default: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers and hyphens only"),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_flash_sale: z.boolean().default(false),
  flash_sale_ends_at: z.string().optional().nullable(), // raw datetime-local value; normalized to ISO before insert
});
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive(),
  min_order_amount: z.coerce.number().min(0).default(0),
  max_discount: z.coerce.number().positive().optional().nullable(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  expires_at: z.string().optional().nullable(),
});

export const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  image_url: z.string().url("Must be a valid image URL"),
  link_url: z.string().url().optional().or(z.literal("")).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const checkoutSchema = z.object({
  address_id: z.string().uuid(),
  payment_method: z.enum(["razorpay", "stripe", "upi", "cod"]),
  coupon_code: z.string().optional(),
});

    
