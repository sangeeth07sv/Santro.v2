import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "@/components/shop/UpdatePasswordForm";
import Link from "next/link";

export const metadata = { title: "Set New Password" };

export default async function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  let sessionEstablished = false;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    sessionEstablished = !error;
  }

  if (!sessionEstablished) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Link expired or invalid</h1>
        <p className="mb-6 text-sm text-slate-500">
          This password reset link is no longer valid. Please request a new one.
        </p>
        <Link href="/reset-password" className="text-sm text-brand-600 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Set a new password</h1>
      <p className="mb-6 text-sm text-slate-500">Choose a new password for your account.</p>
      <UpdatePasswordForm />
    </div>
  );
}
