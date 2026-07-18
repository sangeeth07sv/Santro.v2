"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types/database";

function useCountdown(endsAt: string | null) {
  const [msLeft, setMsLeft] = useState(() => (endsAt ? new Date(endsAt).getTime() - Date.now() : 0));

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setMsLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return Math.max(0, msLeft);
}

function CountdownBadge({ endsAt }: { endsAt: string | null }) {
  const msLeft = useCountdown(endsAt);
  if (!endsAt || msLeft <= 0) return null;

  const totalSeconds = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="rounded-full bg-white/90 px-3 py-1 font-mono text-sm font-semibold text-red-600 shadow-card">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export function FlashSaleSection({ products }: { products: (Product & { flash_sale_ends_at: string | null })[] }) {
  // Nearest-ending sale drives the header countdown; individual products
  // could end at different times if a shop owner sets custom windows.
  const soonestEndsAt = products.length
    ? products.reduce((soonest, p) =>
        p.flash_sale_ends_at && (!soonest || p.flash_sale_ends_at < soonest) ? p.flash_sale_ends_at : soonest,
        null as string | null
      )
    : null;

  if (!products.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 fill-white" />
          <h2 className="text-lg font-bold">Flash Sale</h2>
        </div>
        <CountdownBadge endsAt={soonestEndsAt} />
      </div>
      <div className="rounded-b-2xl border border-t-0 border-red-100 p-4 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/products?sort=newest" className="text-sm font-medium text-red-600 hover:underline">
            View all deals →
          </Link>
        </div>
      </div>
    </section>
  );
}
