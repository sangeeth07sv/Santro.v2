"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createShopProduct } from "@/actions/products";
import { Button } from "@/components/ui/Button";

function slugify(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 7)}`; // suffix avoids slug collisions
}

export function NewProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") || "");
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    formData.set("slug", slugify(name));
    formData.set("is_active", "true");
    formData.set("is_featured", "false");

    startTransition(async () => {
      const res = await createShopProduct(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Product uploaded");
        router.push("/dashboard/shop");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</label>
        <input name="name" required className={inputClass} placeholder="e.g. Handwoven Cotton Kurta" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
        <textarea name="description" rows={3} className={inputClass} placeholder="What makes this product worth buying?" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Price (₹)</label>
          <input name="price" type="number" step="0.01" min="0" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Stock Quantity</label>
          <input name="quantity" type="number" min="0" defaultValue={0} className={inputClass} />
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
          <select name="category_id" className={inputClass}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Image URL</label>
        <input name="image_url" type="url" className={inputClass} placeholder="https://..." />
        <p className="mt-1 text-xs text-slate-400">Paste a hosted image link (e.g. from Cloudinary or Imgur).</p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-200 p-3 dark:border-slate-700">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="is_flash_sale" value="true" />
          Put this on Flash Sale
        </label>
        <div className="mt-2">
          <label className="mb-1 block text-xs text-slate-500">Sale ends at</label>
          <input name="flash_sale_ends_at" type="datetime-local" className={inputClass} />
        </div>
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        Upload Product
      </Button>
    </form>
  );
}
