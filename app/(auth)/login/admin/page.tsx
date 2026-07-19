import { Suspense } from "react";
import { LoginForm } from "../LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Sign in" };

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm
        expectedRole="admin"
        title="Admin Sign in"
        subtitle="Sign in to manage SANTRO."
      />
    </Suspense>
  );
}
