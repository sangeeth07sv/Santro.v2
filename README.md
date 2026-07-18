# SANTRO Commerce — Next.js + Supabase E-Commerce Starter

A production-grade foundation for a full-stack e-commerce site using **only**
Next.js 15 (App Router) and Supabase — no Express, no Prisma, no Firebase,
no separate backend server. White background, blue (`brand-600 #2563eb`)
accent theme throughout, with dark mode support.

## ✅ What's fully built and working

- **Database**: complete `supabase/schema.sql` — 15 tables, enums, triggers
  (auto profile+cart creation, rating recalculation, search vector, `updated_at`),
  RPC functions (`decrement_inventory`, `increment_coupon_usage`), and **RLS
  policies on every table**.
- **Auth**: email/password, Google OAuth, password reset, session refresh via
  middleware, protected `/dashboard`, `/checkout`, `/admin` routes with a
  server-side admin role re-check.
- **Shop**: home page, product listing with search/filter/sort/pagination
  (URL-driven, server-rendered), product detail page with gallery + reviews,
  add-to-cart, wishlist toggle — all via Server Actions with optimistic UI.
- **Cart & Checkout**: real cart persisted in Supabase, quantity controls,
  checkout flow with address selection, coupon validation, atomic inventory
  decrement, order + payment record creation, and notifications.
- **Admin**: role-gated layout + nav, products list with stock/status, delete
  action, server actions for full product CRUD (`actions/products.ts`) ready
  to wire into create/edit forms.
- **UI system**: Tailwind theme, reusable `Button`, `ProductCard` with
  Framer Motion hover animation, loading skeletons, toast notifications
  (`sonner`), responsive mobile-first layout.

## 🧩 What's scaffolded but needs finishing before production

These have real server actions and DB support already, but need UI pages
built out following the same patterns shown above:

- Admin: product create/edit form (`app/admin/products/new`, `/[id]`),
  category CRUD, order management UI, coupon CRUD UI, banner CRUD UI,
  analytics dashboard (query `orders`/`order_items` for charts).
- Customer dashboard: order history/detail, address book UI, wishlist page.
- Stripe/Razorpay: webhook route stubs are in `app/api/webhooks/*` — add your
  provider SDK calls there to flip `payments.status` to `paid` and
  `orders.status` to `confirmed`.
- Password reset confirmation page, email templates.

Given the size of this request, generating every single admin/dashboard page
in full would mean thousands more lines of unreviewed code. The pattern is
identical everywhere (Server Action → Zod validation → Supabase →
`revalidatePath`), so extending it is mostly copy-adjust from the examples
already in `actions/` and `app/admin/products`.

## 🚀 Setup

1. **Create a Supabase project** at supabase.com.
2. Run `supabase/schema.sql` in the SQL Editor (top to bottom).
3. In Supabase Auth settings, enable **Google** provider and set the redirect
   URL to `https://<your-domain>/auth/callback`.
4. Copy `.env.example` to `.env.local` and fill in your keys.
5. Make yourself an admin:
   ```sql
   update profiles set role = 'admin' where id = '<your-user-uuid>';
   ```
6. Install and run:
   ```bash
   npm install
   npm run dev
   ```
7. **Storage**: create a public bucket named `products` in Supabase Storage
   for product images; use `supabase.storage.from('products').upload(...)`
   in your admin image uploader.

## 📦 Deploy

- Push to GitHub, import into Vercel.
- Add the same env vars from `.env.local` to Vercel's Environment Variables.
- Set `NEXT_PUBLIC_SITE_URL` to your production domain (needed for OAuth and
  password-reset redirects).

## 🗂 Folder structure

```
app/              # routes (App Router) — (auth), (shop), cart, checkout, dashboard, admin, api
components/       # ui, shop, admin, layout
lib/supabase/     # client.ts (browser), server.ts (RSC/actions), middleware.ts
actions/          # server actions: auth, products, cart, orders
types/            # database.ts (hand-typed; regenerate via supabase CLI for full accuracy)
utils/            # validation.ts (Zod schemas), cn.ts
supabase/         # schema.sql
middleware.ts     # session refresh + route protection
```
