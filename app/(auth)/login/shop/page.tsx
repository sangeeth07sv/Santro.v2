import { Suspense } from "react";
import { LoginForm } from "../LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop Owner Sign in" };

export default function ShopLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginForm
        expectedRole="shop_owner"
        title="Shop Owner Sign in"
        subtitle="Sign in to manage your shop on SANTRO."
      />
    </Suspense>
  );
}
