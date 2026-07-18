"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { login, signInWithGoogle } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const ROLE_HOME: Record<string, string> = {
  customer: "/",
  shop_owner: "/dashboard/shop",
  delivery_partner: "/dashboard/delivery",
};

const ROLE_LABEL: Record<string, string> = {
  customer: "customer",
  shop_owner: "shop owner",
  delivery_partner: "delivery partner",
};

interface Props {
  /** Restrict this page to a single role. Omit to allow any role (used by the default /login page). */
  expectedRole?: "customer" | "shop_owner" | "delivery_partner";
  title?: string;
  subtitle?: string;
}

export function LoginForm({ expectedRole, title = "Welcome back", subtitle = "Sign in to continue to SANTRO." }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await login(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      if (expectedRole && res.role !== expectedRole) {
        // Wrong portal for this account — sign back out and tell them where to go.
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.error(
          res.role
            ? `That account is a ${ROLE_LABEL[res.role] ?? res.role} account. Use the ${ROLE_LABEL[expectedRole]} sign-in page instead.`
            : "This account has no role assigned yet."
        );
        return;
      }

      toast.success("Welcome back!");

      const explicitRedirect = searchParams.get("redirect");
      const destination = explicitRedirect ?? (res.role ? ROLE_HOME[res.role] ?? "/" : "/");

      router.push(destination);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

      <form action={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <Link href="/reset-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
          </div>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <Button type="submit" isLoading={isPending} className="w-full">Sign In</Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <form action={signInWithGoogle}>
        <button type="submit" className="btn-outline w-full">Continue with Google</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link
          href={expectedRole ? `/register?role=${expectedRole}` : "/register"}
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign up
        </Link>
      </p>

      <div className="mt-4 flex flex-col items-center gap-1 text-xs text-slate-400">
        {expectedRole !== "customer" && <Link href="/login" className="hover:underline">Customer sign in</Link>}
        {expectedRole !== "shop_owner" && <Link href="/login/shop" className="hover:underline">Shop owner sign in</Link>}
        {expectedRole !== "delivery_partner" && <Link href="/login/delivery" className="hover:underline">Delivery partner sign in</Link>}
      </div>
    </div>
  );
}
