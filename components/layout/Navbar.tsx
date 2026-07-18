"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

export function Navbar({
  isLoggedIn,
  isAdmin,
  role,
  cartCount,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  role?: string | null;
  cartCount: number;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-indigo-800">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="text-white md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
          SANTRO
        </Link>

        <nav className="hidden gap-5 md:flex">
          <Link href="/products" className="text-sm text-indigo-100 hover:text-marigold-300">
            Shop
          </Link>
          <Link href="/categories" className="text-sm text-indigo-100 hover:text-marigold-300">
            Categories
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-indigo-100 hover:text-marigold-300">
              Admin
            </Link>
          )}
          {(role === "shop_owner" || isAdmin) && (
            <Link href="/dashboard/shop" className="text-sm text-indigo-100 hover:text-marigold-300">
              My Shop
            </Link>
          )}
          {(role === "delivery_partner" || isAdmin) && (
            <Link href="/dashboard/delivery" className="text-sm text-indigo-100 hover:text-marigold-300">
              Deliveries
            </Link>
          )}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anything..."
              className="w-full rounded-l-md border-0 bg-white py-2 pl-4 pr-4 text-sm text-ink outline-none focus:ring-2 focus:ring-marigold-500"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex items-center justify-center rounded-r-md bg-marigold-500 px-4 text-indigo-900 hover:bg-marigold-300"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className={cn("flex items-center gap-4", "ml-auto md:ml-0")}>
          <Link href="/dashboard/wishlist" className="relative">
            <Heart className="h-5 w-5 text-indigo-100" />
          </Link>
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-indigo-100" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-marigold-500 text-[10px] font-bold text-indigo-900">
                {cartCount}
              </span>
            )}
          </Link>
          <Link href={isLoggedIn ? "/dashboard" : "/login"}>
            <User className="h-5 w-5 text-indigo-100" />
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="bg-indigo-700 px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="relative mb-3 flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anything..."
              className="w-full rounded-l-md border-0 bg-white py-2 pl-4 pr-4 text-sm text-ink outline-none"
            />
            <button type="submit" aria-label="Search" className="rounded-r-md bg-marigold-500 px-3 text-indigo-900">
              <Search className="h-4 w-4" />
            </button>
          </form>
          <nav className="flex flex-col gap-3 text-indigo-100">
            <Link href="/products" onClick={() => setMenuOpen(false)}>Shop</Link>
            <Link href="/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
            {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {(role === "shop_owner" || isAdmin) && (
              <Link href="/dashboard/shop" onClick={() => setMenuOpen(false)}>My Shop</Link>
            )}
            {(role === "delivery_partner" || isAdmin) && (
              <Link href="/dashboard/delivery" onClick={() => setMenuOpen(false)}>Deliveries</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
                }
