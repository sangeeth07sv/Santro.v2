import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm
        expectedRole="customer"
        title="Welcome back"
        subtitle="Sign in to shop on SANTRO."
      />
    </Suspense>
  );
}
