"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { createAddress } from "@/actions/addresses";
import { LocationPicker } from "./LocationPicker";

export function AddressForm() {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [fields, setFields] = useState({ line1: "", city: "", state: "", postal_code: "" });

  function handleSubmit(formData: FormData) {
    if (!pin) {
      toast.error("Please pin your exact location on the map — delivery partners need this to find you.");
      return;
    }
    formData.set("latitude", String(pin.lat));
    formData.set("longitude", String(pin.lng));
    startTransition(async () => {
      const res = await createAddress(formData);
      if (res?.error) toast.error(res.error);
      // On success, createAddress() redirects itself — no further handling needed here.
    });
  }

  const inputClass =
    "w-full rounded-lg border border-surface-muted px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-700 dark:bg-indigo-900";

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">
          Pin your location <span className="text-red-500">*</span>
        </label>
        {!showPicker ? (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 px-3 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300"
          >
            <MapPin className="h-4 w-4" />
            {pin ? "Change pinned location" : "Drop a pin on the map"}
          </button>
        ) : (
          <LocationPicker
            confirmLabel="Select this address"
            onCancel={() => setShowPicker(false)}
            onConfirm={(data) => {
              setPin({ lat: data.lat, lng: data.lng, address: data.address });
              setFields((prev) => ({
                line1: data.line1 || prev.line1,
                city: data.city || prev.city,
                state: data.state || prev.state,
                postal_code: data.postalCode || prev.postal_code,
              }));
              setShowPicker(false);
              toast.success("Location pinned — details filled in below, review and save.");
            }}
          />
        )}
        {pin && !showPicker && (
          <p className="mt-1 truncate text-xs text-ink/50">📍 {pin.address}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">Full name</label>
        <input name="full_name" required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">Phone number</label>
        <input name="phone" type="tel" required placeholder="10-digit mobile number" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">Address line 1</label>
        <input
          name="line1"
          required
          value={fields.line1}
          onChange={(e) => setFields((p) => ({ ...p, line1: e.target.value }))}
          placeholder="Flat / House no., Building, Street"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">Address line 2 (optional)</label>
        <input name="line2" placeholder="Landmark, Area" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">City</label>
          <input
            name="city"
            required
            value={fields.city}
            onChange={(e) => setFields((p) => ({ ...p, city: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">State</label>
          <input
            name="state"
            required
            value={fields.state}
            onChange={(e) => setFields((p) => ({ ...p, state: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-100">Pincode</label>
        <input
          name="postal_code"
          required
          inputMode="numeric"
          value={fields.postal_code}
          onChange={(e) => setFields((p) => ({ ...p, postal_code: e.target.value }))}
          placeholder="6-digit PIN code"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70 dark:text-slate-300">
        <input type="checkbox" name="is_default" defaultChecked className="rounded border-surface-muted" />
        Set as default address
      </label>

      <button type="submit" disabled={isPending || !pin} className="btn-primary w-full disabled:opacity-50">
        {isPending ? "Saving…" : !pin ? "Pin your location to continue" : "Save address"}
      </button>
    </form>
  );
          }
