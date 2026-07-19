import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Automatically wires cookies for session persistence.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. ONLY import this in Route Handlers
 * or Server Actions that run exclusively on the server, and NEVER expose it
 * to the client bundle. Used for privileged operations (e.g. admin dashboards
 * bypassing RLS intentionally, sending emails, etc).
 */
export function createAdminClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Cookie-free anon client for public, non-personalized read queries (banners,
 * categories, active offers, etc). Doesn't touch cookies()/headers(), so it's
 * safe to call from inside unstable_cache — letting these queries be cached
 * across requests instead of hitting Supabase fresh on every page load.
 */
export function createPublicClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
