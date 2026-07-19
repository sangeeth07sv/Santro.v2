"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProduct } from "@/actions/products";
import { Button } from "@/components/ui/Button";
import { ProductImageUpload } from "@/components/shop/ProductImageUpload";

interface Props {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    is_active: boolean;
    inventory?: { quantity: number }[];
    product_images?: { url: string; is_primary: boolean }[];
  };
  categories: { id: string; name: string }[];
}

export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ?? product.product_images?.[0]?.url ?? null;
  const currentQuantity = product.inventory?.[0]?.quantity ?? 0;

  function handleSubmit(formData: FormData) {
    formData.set("is_active", formData.get("is_active") === "on" ? "true" : "false");

    startTransition(async () => {
      const res = await updateProduct(product.id, formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Product updated");
        router.push("/dashboard/shop");
        router.refresh();
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</label>
        <input name="name" defaultValue={product.name} required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
        <textarea name="description" defaultValue={product.description ?? ""} rows={3} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Price (₹)</label>
          <input name="price" type="number" step="0.01" min="0" defaultValue={product.price} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Stock Quantity</label>
          <input name="quantity" type="number" min="0" defaultValue={currentQuantity} className={inputClass} />
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
          <select name="category_id" defaultValue={product.category_id ?? ""} className={inputClass}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <ProductImageUpload initialUrl={primaryImage} />

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input type="checkbox" name="is_active" defaultChecked={product.is_active} />
        Listed (visible to customers)
      </label>

      <Button type="submit" isLoading={isPending} className="w-full">
        Save Changes
      </Button>
    </form>
  );
            }
