import { ResetPasswordForm } from "@/components/shop/ResetPasswordForm";

export const metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Reset your password</h1>
      <p className="mb-6 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
      <ResetPasswordForm />
    </div>
  );
}
