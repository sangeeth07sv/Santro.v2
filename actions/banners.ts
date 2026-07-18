"use server";

import { createClient } from "@/lib/supabase/server";
import { bannerSchema } from "@/utils/validation";
import { revalidatePath } from "next/cache";

export async function getBanners() {
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });
  return data ?? [];
}

export async function createBanner(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = bannerSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    link_url: raw.link_url || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/banners");
  return { success: true };
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/banners");
  return { success: true };
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/banners");
  return { success: true };
}
