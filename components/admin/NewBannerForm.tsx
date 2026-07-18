"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBanner } from "@/actions/banners";
import { Button } from "@/components/ui/Button";

export function NewBannerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  function handleSubmit(formData: FormData) {
    formData.set("is_active", "true");
    startTransition(async () => {
      const res = await createBanner(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Banner created");
        router.refresh();
        (document.getElementById("new-banner-form") as HTMLFormElement)?.reset();
      }
    });
  }

  return (
    <form id="new-banner-form" action={handleSubmit} className="card space-y-4 p-5">
      <h2 className="font-semibold text-slate-800 dark:text-white">New Banner</h2>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Title</label>
        <input name="title" required className={inputClass} placeholder="Monsoon Sale — Up to 40% off" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Image URL</label>
        <input name="image_url" type="url" required className={inputClass} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Link URL (optional)</label>
        <input name="link_url" type="url" className={inputClass} placeholder="https://.../products?category=..." />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Sort Order</label>
        <input name="sort_order" type="number" defaultValue={0} className={inputClass} />
      </div>
      <Button type="submit" isLoading={isPending} className="w-full">Create Banner</Button>
    </form>
  );
}
