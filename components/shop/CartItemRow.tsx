"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { removeCartItem, updateCartItemQuantity } from "@/actions/cart";

export function CartItemRow({ item }: { item: any }) {
  const [isPending, startTransition] = useTransition();
  const image = item.product?.product_images?.find((i: any) => i.is_primary)?.url ?? item.product?.product_images?.[0]?.url;

  function changeQty(delta: number) {
    startTransition(async () => {
      await updateCartItemQuantity(item.id, item.quantity + delta);
    });
  }

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
        {image && <Image src={image} alt={item.product?.name ?? ""} fill className="object-cover" />}
      </div>

      <div className="flex-1">
        <Link href={`/products/${item.product?.slug}`} className="text-sm font-medium hover:text-indigo-600">
          {item.product?.name}
        </Link>
        <p className="mt-1 text-sm text-indigo-700 dark:text-marigold-400">
          ₹{item.product?.price?.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
        <button onClick={() => changeQty(-1)} disabled={isPending} className="p-2" aria-label="Decrease">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <button onClick={() => changeQty(1)} disabled={isPending} className="p-2" aria-label="Increase">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        onClick={() => startTransition(async () => { await removeCartItem(item.id); })}
        disabled={isPending}
        className="p-2 text-slate-400 hover:text-red-500"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
