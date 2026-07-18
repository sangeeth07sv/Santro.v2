import { getCoupons } from "@/actions/coupons";
import { NewCouponForm } from "@/components/admin/NewCouponForm";
import { CouponRowActions } from "@/components/admin/CouponRowActions";

export const metadata = { title: "Admin · Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Coupons</h1>

      <div className="mb-6">
        <NewCouponForm />
      </div>

      <div className="card overflow-x-auto">
        {coupons.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No coupons yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Value</th>
                <th className="p-4">Used</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                  <td className="p-4 font-mono font-medium">{c.code}</td>
                  <td className="p-4">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="p-4">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${c.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <CouponRowActions id={c.id} isActive={c.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
