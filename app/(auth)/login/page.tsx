import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic"; // <-- add this line

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm />
    </Suspense>
  );
}
