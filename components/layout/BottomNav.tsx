"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Search, Heart, ShoppingCart, User, LayoutDashboard, Package, Truck, Bell } from "lucide-react";
import { cn } from "@/utils/cn";

type Role = "customer" | "shop_owner" | "delivery_partner" | "admin" | null | undefined;

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const CUSTOMER_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Search", icon: Search },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard", label: "Account", icon: User },
];

const SHOP_OWNER_ITEMS: NavItem[] = [
  { href: "/dashboard/shop", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Account", icon: User },
];

const DELIVERY_ITEMS: NavItem[] = [
  { href: "/dashboard/delivery", label: "Deliveries", icon: Truck },
  { href: "/dashboard/delivery", label: "Active", icon: Package },
  { href: "/products", label: "Shop", icon: Store },
  { href: "/dashboard", label: "Account", icon: User },
];

function itemsForRole(role: Role): NavItem[] {
  if (role === "shop_owner") return SHOP_OWNER_ITEMS;
  if (role === "delivery_partner") return DELIVERY_ITEMS;
  return CUSTOMER_ITEMS;
}

export function BottomNav({
  isLoggedIn,
  role,
  cartCount,
}: {
  isLoggedIn: boolean;
  role?: string | null;
  cartCount: number;
}) {
  const pathname = usePathname();

  // Rule: bottom nav is hidden for signed-out visitors (there's no role to key
  // the nav off yet — they see the top nav + a sign-in prompt instead). It now
  // shows on the home page too for logged-in users, per product decision.
  if (!isLoggedIn) return null;

  const items = itemsForRole(role as Role);
  // Pick the single best (longest-prefix) match so nested routes like
  // /dashboard/wishlist don't also light up the broader /dashboard tab.
  const activeHref = items
    .filter((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-40 md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-center justify-between rounded-full bg-white px-2 py-2 shadow-elevated dark:bg-indigo-800">
        {items.map((item) => (
          <NavLink
            key={item.href + item.label}
            item={item}
            active={item.href === activeHref}
            badge={item.label === "Cart" ? cartCount : undefined}
          />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-700 dark:text-white"
          : "text-ink/40 dark:text-slate-400"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
      {!!badge && badge > 0 && (
        <span className="absolute right-3 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-marigold-500 text-[9px] font-bold text-indigo-900">
          {badge}
        </span>
      )}
      {item.label}
    </Link>
  );
}
