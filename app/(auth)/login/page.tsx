import Link from "next/link";
import { Store, Truck, User } from "lucide-react";

export const metadata = { title: "Sign in" };

const ROLES = [
  {
    href: "/login/customer",
    label: "Customer",
    blurb: "Shop products",
    icon: User,
  },
  {
    href: "/login/shop",
    label: "Shop Owner",
    blurb: "Sell products",
    icon: Store,
  },
  {
    href: "/login/delivery",
    label: "Delivery Partner",
    blurb: "Deliver orders",
    icon: Truck,
  },
];

export default function LoginRoleSelectPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign in to SANTRO</h1>
      <p className="mt-1 text-sm text-slate-500">Choose how you'd like to continue.</p>

      <div className="mt-8 space-y-3">
        {ROLES.map(({ href, label, blurb, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-4 p-4 hover:shadow-elevated"
          >
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-slate-800">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
              <p className="text-xs text-slate-400">{blurb}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
