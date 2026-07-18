import { getCurrentUser } from "@/actions/auth";
import { getAddresses } from "@/actions/addresses";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteAddressButton } from "@/components/shop/DeleteAddressButton";
import { MapPin, Plus } from "lucide-react";

export const metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?redirect=/dashboard/addresses");

  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My Addresses</h1>
        <Link href="/dashboard/addresses/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Address
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">You haven't saved any addresses yet.</p>
          <Link href="/dashboard/addresses/new" className="btn-primary mt-4 inline-flex">
            Add your first address
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a: any) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{a.full_name}</p>
                    {a.is_default && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 dark:bg-slate-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{a.phone}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postal_code}
                  </p>
                </div>
                <DeleteAddressButton id={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
