/**
 * Supabase Client for Cleanbid
 *
 * Connects to the SAME Supabase project as MyBidQuick.
 * Used to fetch tenant configs so any cleaning company signed up
 * on mybidquick.com automatically gets their own quote page.
 *
 * Env vars (set in Vercel dashboard for Cleanbid project):
 *   VITE_SUPABASE_URL  â e.g. https://eccuaztubjdxicylcwrh.supabase.co
 *   VITE_SUPABASE_ANON_KEY â public anon key
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the client if env vars are set (allows local dev without Supabase)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Check if Supabase is available.
 */
export function isSupabaseConnected() {
  return supabase !== null;
}

/**
 * Fetch a tenant by their URL slug.
 * Returns the full tenant row or null if not found.
 */
export async function fetchTenantBySlug(slug) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.warn(`[Supabase] Tenant not found for slug: "${slug}"`, error?.message);
    return null;
  }

  return data;
}

/**
 * Fetch a tenant by email (fallback lookup).
 */
export async function fetchTenantByEmail(email) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .ilike("email", email)
    .single();

  if (error || !data) return null;
  return data;
}
