import { getCustomers } from "@/actions/admin";

export const metadata = { title: "Admin · Customers" };

const ROLE_STYLES: Record<string, string> = {
  customer: "bg-blue-50 text-blue-600",
  shop_owner: "bg-amber-50 text-amber-600",
  delivery_partner: "bg-purple-50 text-purple-600",
  admin: "bg-green-50 text-green-600",
};

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Customers</h1>

      <div className="card overflow-x-auto">
        {customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No users yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                  <td className="p-4 font-medium">{c.full_name ?? "—"}</td>
                  <td className="p-4">{c.phone ?? "—"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs capitalize ${ROLE_STYLES[c.role] ?? ""}`}>
                      {c.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
