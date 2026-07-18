import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { Store, Truck, ShoppingBag, ArrowRight } from "lucide-react";

const DASHBOARDS = [
  {
    role: "customer",
    title: "Customer Dashboard",
    desc: "Browse products, track orders, and manage your wishlist.",
    href: "/dashboard",
    icon: ShoppingBag,
  },
  {
    role: "shop_owner",
    title: "Shop Owner Dashboard",
    desc: "List products, manage inventory, and view your sales.",
    href: "/dashboard/shop",
    icon: Store,
  },
  {
    role: "delivery_partner",
    title: "Delivery Partner Dashboard",
    desc: "View assigned deliveries and update order status.",
    href: "/dashboard/delivery",
    icon: Truck,
  },
];

export default async function HomePage() {
  const auth = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Welcome to <span className="text-brand-600">Santro</span>
        </h1>
        <p className="mt-3 text-slate-500">
          {auth ? "Choose a dashboard to continue." : "Sign in to access your dashboard."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {DASHBOARDS.map(({ role, title, desc, href, icon: Icon }) => {
          const isOwnRole = auth?.profile?.role === role;
          const linkHref = !auth
            ? `/login?redirect=${encodeURIComponent(href)}`
            : isOwnRole
            ? href
            : `/register?role=${role}`;

          return (
            <Link
              key={role}
              href={linkHref}
              className="card group flex flex-col items-start p-6 transition-shadow hover:shadow-elevated"
            >
              <div className="mb-4 rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-slate-800">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                {auth && isOwnRole ? "Open dashboard" : auth ? "Sign up as this role" : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
          Just want to browse? View all products →
        </Link>
      </div>
    </div>
  );
}
