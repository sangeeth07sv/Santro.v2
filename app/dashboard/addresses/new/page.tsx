import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/shop/AddressForm";

export const metadata = { title: "Add address" };

export default async function NewAddressPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/addresses/new");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-ink dark:text-white">Add a shipping address</h1>
      <p className="mb-6 text-sm text-ink/50 dark:text-slate-400">Used for delivery and order tracking.</p>
      <AddressForm />
    </div>
  );
}
