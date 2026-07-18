"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleBannerActive, deleteBanner } from "@/actions/banners";

export function BannerRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleBannerActive(id, !isActive);
      if (res?.error) toast.error(res.error);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteBanner(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Banner deleted");
    });
  }

  return (
    <div className="flex gap-3 text-xs">
      <button onClick={handleToggle} disabled={isPending} className="text-indigo-600 hover:underline disabled:opacity-50">
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <button onClick={handleDelete} disabled={isPending} className="text-red-500 hover:underline disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
