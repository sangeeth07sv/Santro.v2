"use client";


import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { login, signInWithGoogle } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await login(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Welcome back!");
        router.push(searchParams.get("redirect") ?? "/");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to continue to SANTRO.</p>

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
        Don't have an account? <Link href="/register" className="font-medium text-indigo-600 hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
