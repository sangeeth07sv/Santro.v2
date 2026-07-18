import { getBanners } from "@/actions/banners";
import { NewBannerForm } from "@/components/admin/NewBannerForm";
import { BannerRowActions } from "@/components/admin/BannerRowActions";
import Image from "next/image";

export const metadata = { title: "Admin · Banners" };

export default async function AdminBannersPage() {
  const banners = await getBanners();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Banners</h1>

      <div className="mb-6">
        <NewBannerForm />
      </div>

      {banners.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">No banners yet.</div>
      ) : (
        <div className="space-y-3">
          {banners.map((b: any) => (
            <div key={b.id} className="card flex items-center gap-4 p-4">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                <Image src={b.image_url} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100">{b.title}</p>
                <p className="text-xs text-slate-400">Sort order: {b.sort_order}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${b.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                {b.is_active ? "Active" : "Inactive"}
              </span>
              <BannerRowActions id={b.id} isActive={b.is_active} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
