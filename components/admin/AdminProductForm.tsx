"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/actions/products";
import { Button } from "@/components/ui/Button";

function slugify(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AdminProductFormProps {
  categories: { id: string; name: string }[];
  product?: any; // when present, form edits this product instead of creating
}

export function AdminProductForm({ categories, product }: AdminProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!product;

  const primaryImage = product?.product_images?.find((i: any) => i.is_primary)?.url ?? product?.product_images?.[0]?.url;
  const currentQty = (product?.inventory ?? []).reduce((n: number, i: any) => n + i.quantity, 0);

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") || "");
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!isEdit) formData.set("slug", slugify(name));

    startTransition(async () => {
      const res = isEdit ? await updateProduct(product.id, formData) : await createProduct(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Product updated" : "Product created");
        router.push("/admin/products");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</label>
        <input name="name" required defaultValue={product?.name} className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
        <textarea name="description" rows={3} defaultValue={product?.description} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Price (₹)</label>
          <input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Compare-at Price (₹)</label>
          <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Stock Quantity</label>
          <input name="quantity" type="number" min="0" defaultValue={isEdit ? currentQty : 0} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">SKU</label>
          <input name="sku" defaultValue={product?.sku ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Brand</label>
          <input name="brand" defaultValue={product?.brand ?? ""} className={inputClass} />
        </div>
        {categories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
            <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputClass}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Image URL</label>
        <input name="image_url" type="url" defaultValue={primaryImage ?? ""} className={inputClass} placeholder="https://..." />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="is_active" value="true" defaultChecked={product?.is_active ?? true} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="is_featured" value="true" defaultChecked={product?.is_featured ?? false} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" name="is_flash_sale" value="true" defaultChecked={product?.is_flash_sale ?? false} />
          Flash Sale
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Flash Sale Ends At <span className="font-normal text-slate-400">(required for the Flash Sale badge to show)</span>
        </label>
        <input
          name="flash_sale_ends_at"
          type="datetime-local"
          defaultValue={product?.flash_sale_ends_at ? product.flash_sale_ends_at.slice(0, 16) : ""}
          className={inputClass}
        />
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">
        {isEdit ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
      }
      
