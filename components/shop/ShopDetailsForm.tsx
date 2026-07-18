"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateShopDetails } from "@/actions/shop";
import { Button } from "@/components/ui/Button";
import { LocateFixed } from "lucide-react";

interface Props {
  initial: { shop_name: string | null; shop_address: string | null; latitude: number | null; longitude: number | null };
}

export function ShopDetailsForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.latitude && initial.longitude ? { lat: initial.latitude, lng: initial.longitude } : null
  );

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  function handleLocate() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device/browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast.success("Location captured");
      },
      () => {
        setIsLocating(false);
        toast.error("Couldn't get your location — check location permission for this site");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(formData: FormData) {
    if (coords) {
      formData.set("latitude", String(coords.lat));
      formData.set("longitude", String(coords.lng));
    }
    startTransition(async () => {
      const res = await updateShopDetails(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Shop details saved");
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100">Shop Details</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Shop Name</label>
        <input name="shop_name" defaultValue={initial.shop_name ?? ""} required className={inputClass} placeholder="e.g. Amma's Kirana Store" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Shop Address</label>
        <textarea name="shop_address" defaultValue={initial.shop_address ?? ""} required rows={2} className={inputClass} placeholder="Full address customers will see" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Shop Location (GPS)</label>
        <button
          type="button"
          onClick={handleLocate}
          disabled={isLocating}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 px-3 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-300"
        >
          <LocateFixed className="h-4 w-4" />
          {isLocating ? "Getting your location..." : coords ? "Update current location" : "Use my current location"}
        </button>
        <p className="mt-1 text-xs text-slate-400">
          This is what customers use to find you as a "local" shop — stand at your shop when you tap this.
        </p>
      </div>

      {coords && (
        <iframe
          title="Shop location preview"
          src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`}
          className="h-40 w-full rounded-lg border-0"
          loading="lazy"
        />
      )}

      <Button type="submit" isLoading={isPending} className="w-full">
        Save Shop Details
      </Button>
    </form>
  );
}
