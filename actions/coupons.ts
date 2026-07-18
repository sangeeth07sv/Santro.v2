"use server";

import { createClient } from "@/lib/supabase/server";
import { couponSchema } from "@/utils/validation";
import { revalidatePath } from "next/cache";

export async function getCoupons() {
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createCoupon(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = couponSchema.safeParse({
    ...raw,
    max_discount: raw.max_discount || null,
    usage_limit: raw.usage_limit || null,
    expires_at: raw.expires_at || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}
