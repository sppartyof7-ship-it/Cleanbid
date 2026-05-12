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

// ============================================================================
// PHOTO UPLOAD
// ============================================================================
/**
 * Convert a base64 dataUrl (from FileReader) back into a Blob so we can hand it
 * off to Supabase Storage. PhotoUploader stores files as dataUrls in component
 * state for instant preview, so we need this bridge at submit-time.
 */
function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Sanitize a filename so it's safe as an S3/Storage object key.
 * - lowercases, strips weird chars, keeps the extension
 */
function safeFilename(name) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60);
  const ext = (dot > 0 ? name.slice(dot + 1) : "jpg").replace(/[^a-z0-9]+/gi, "").toLowerCase().slice(0, 6);
  return `${base || "photo"}.${ext || "jpg"}`;
}

/**
 * Upload a batch of photos (from PhotoUploader's state) to the `lead-photos`
 * bucket and return [{ name, url, path }] suitable for saving on the lead row.
 *
 * Paths: lead-photos/{tenant_id}/{submission_id}/{filename}
 *
 * If supabase isn't connected (demo / local), we no-op and return [{ name }]
 * so the lead submit still works — the downstream code already handles
 * missing-url gracefully.
 */
export async function uploadLeadPhotos(photos, { tenantId, submissionId }) {
  if (!supabase) return photos.map((p) => ({ name: p.name }));
  if (!Array.isArray(photos) || photos.length === 0) return [];
  if (!tenantId || !submissionId) {
    console.warn("[uploadLeadPhotos] Missing tenantId or submissionId — skipping upload");
    return photos.map((p) => ({ name: p.name }));
  }

  const results = await Promise.all(
    photos.map(async (p, idx) => {
      try {
        if (!p?.dataUrl) return { name: p?.name || `photo-${idx}` };

        const blob = dataUrlToBlob(p.dataUrl);
        const cleanName = safeFilename(p.name || `photo-${idx}.jpg`);
        const path = `${tenantId}/${submissionId}/${Date.now()}-${idx}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("lead-photos")
          .upload(path, blob, {
            contentType: blob.type || "image/jpeg",
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) {
          console.warn("[uploadLeadPhotos] Upload failed for", cleanName, uploadError.message);
          return { name: p.name };
        }

        const { data: pub } = supabase.storage.from("lead-photos").getPublicUrl(path);
        return {
          name: p.name,
          url: pub?.publicUrl || null,
          path,
          size: blob.size,
        };
      } catch (err) {
        console.warn("[uploadLeadPhotos] Unexpected error:", err);
        return { name: p?.name || `photo-${idx}` };
      }
    })
  );

  return results;
}
