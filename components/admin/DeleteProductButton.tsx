"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/products";

export function DeleteProductButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Product deleted");
    });
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="ml-4 text-red-500 hover:underline">
      Delete
    </button>
  );
}
