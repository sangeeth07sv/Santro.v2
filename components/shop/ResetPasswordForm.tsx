"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
      if (res?.error) toast.error(res.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-slate-800 dark:text-green-400">
        If an account exists for that email, a password reset link has been sent.
      </p>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:border-slate-700";

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
        <input name="email" type="email" required className={inputClass} placeholder="you@example.com" />
      </div>
      <Button type="submit" isLoading={isPending} className="w-full">Send Reset Link</Button>
    </form>
  );
}
