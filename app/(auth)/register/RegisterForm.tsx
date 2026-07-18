"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

const ROLES = [
  { value: "customer", label: "Customer", blurb: "Shop products" },
  { value: "shop_owner", label: "Shop Owner", blurb: "Sell products" },
  { value: "delivery_partner", label: "Delivery Partner", blurb: "Deliver orders" },
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState(searchParams.get("role") ?? "customer");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await register(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Account created! Check your email to confirm.");
        router.push("/login");
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join SANTRO in seconds.</p>

      <form action={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">I am a...</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer flex-col items-center rounded-lg border border-slate-200 p-3 text-center has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:border-slate-700"
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span className="text-xs font-medium">{r.label}</span>
                <span className="mt-0.5 text-[10px] text-slate-400">{r.blurb}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Full Name</label>
          <input name="fullName" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-slate-800 dark:border-slate-700" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-slate-800 dark:border-slate-700" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
          <input name="password" type="password" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-slate-800 dark:border-slate-700" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
          <input name="confirmPassword" type="password" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-slate-800 dark:border-slate-700" />
        </div>
        <Button type="submit" isLoading={isPending} className="w-full">Create Account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
