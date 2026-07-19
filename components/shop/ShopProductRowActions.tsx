"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/products";

export function ShopProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Product deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-3 text-xs">
      <Link href={`/dashboard/shop/products/${id}/edit`} className="text-indigo-600 hover:underline">
        Edit
      </Link>
      <button onClick={handleDelete} disabled={isPending} className="text-red-500 hover:underline disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
