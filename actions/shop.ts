"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string; success?: boolean };

export async function updateShopDetails(formData: FormData): Promise<ActionResult> {
  const shop_name = String(formData.get("shop_name") || "").trim();
  const shop_address = String(formData.get("shop_address") || "").trim();
  const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : null;
  const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : null;

  if (!shop_name) return { error: "Shop name is required" };
  if (!shop_address) return { error: "Shop address is required" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first" };

  const { error } = await supabase
    .from("profiles")
    .update({ shop_name, shop_address, latitude, longitude })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/shop");
  return { success: true };
}
