import { Suspense } from "react";
import { LoginForm } from "../LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Delivery Partner Sign in" };

export default function DeliveryLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm
        expectedRole="delivery_partner"
        title="Delivery Partner Sign in"
        subtitle="Sign in to view and manage your deliveries."
      />
    </Suspense>
  );
}
