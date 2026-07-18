"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getAddresses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });
  return data ?? [];
}

export async function createAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to add an address" };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();
  const is_default = formData.get("is_default") === "on";

  if (!full_name || !phone || !line1 || !city || !state || !postal_code) {
    return { error: "Please fill in all required fields" };
  }

  // If this is set as default (or it's the user's first address), clear any existing default first.
  if (is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    full_name,
    phone,
    line1,
    line2,
    city,
    state,
    postal_code,
    country: "IN",
    is_default,
  });

  if (error) return { error: error.message };

  revalidatePath("/checkout");
  revalidatePath("/dashboard/addresses");
  redirect("/checkout");
}

export async function deleteAddress(addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };

  const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/checkout");
  revalidatePath("/dashboard/addresses");
  return { success: true };
}
