"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteAddress } from "@/actions/addresses";

export function DeleteAddressButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this address? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteAddress(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Address deleted");
    });
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="text-sm text-red-500 hover:underline disabled:opacity-50">
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
