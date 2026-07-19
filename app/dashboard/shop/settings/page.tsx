import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShopDetailsForm } from "@/components/shop/ShopDetailsForm";

export const metadata = { title: "Shop Settings" };

export default async function ShopSettingsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login/shop?redirect=/dashboard/shop/settings");
  if (auth.profile?.role !== "shop_owner") redirect("/");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/dashboard/shop" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Shop Settings</h1>
      <ShopDetailsForm
        initial={{
          shop_name: auth.profile?.shop_name ?? null,
          shop_address: auth.profile?.shop_address ?? null,
          latitude: auth.profile?.latitude ?? null,
          longitude: auth.profile?.longitude ?? null,
        }}
      />
    </div>
  );
}
