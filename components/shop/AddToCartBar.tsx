"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/Button";

export function AddToCartBar({ productId, inStock }: { productId: string; inStock: boolean }) {
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const res = await addToCart(productId, qty);
      if (res?.error) toast.error(res.error);
      else toast.success(`Added ${qty} item(s) to cart`);
    });
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5" aria-label="Decrease">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm">{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} className="p-2.5" aria-label="Increase">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button onClick={handleAdd} isLoading={isPending} disabled={!inStock} className="flex-1">
        <ShoppingCart className="h-4 w-4" /> {inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  );
}
