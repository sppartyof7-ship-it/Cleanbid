/**
 * Multi-Tenant Resolver
 *
 * Detects which business (tenant) to load based on the URL.
 *
 * Detection order:
 * 1. ?tenant=xxx query param (dev/testing)
 * 2. Subdomain extraction (cloute-cleaning.mybidquick.com â "cloute-cleaning")
 * 3. Hostname matching (legacy â for existing custom domains)
 * 4. Falls back to "cloute" (default)
 *
 * For Supabase-backed tenants, resolveSlug() returns the slug string,
 * and App.jsx fetches the full config asynchronously.
 */
import CLOUTE from "./cloute";
// CORNERSTONE removed 2026-05-01 - Cornerstone now lives in Supabase (slug "cornerstone")

// ââ Hardcoded tenants (legacy â will be phased out as tenants move to Supabase) ââ
const TENANTS = {
  cloute: CLOUTE,
  // cornerstone moved to Supabase
};

// -- Subdomain aliases: map legacy/auto-generated slugs to their canonical --
// When a tenant's URL changes (e.g. signup-generated long slug -> short slug),
// add an entry here so old QR codes / bookmarks still resolve.
const SLUG_ALIASES = {
  "cornerstone-wash-and-window-cleaning": "cornerstone",
};

// ââ Legacy hostname â tenant ID map ââ
const HOST_MAP = {
  // Cloute (default)
  "cleanbid.vercel.app": "cloute",
  "cloutebid.vercel.app": "cloute",
  "cloutebid.com": "cloute",
  "www.cloutebid.com": "cloute",

  // Local dev
  localhost: "cloute",
};

// ââ Domains where subdomains map to tenant slugs ââ
const SUBDOMAIN_ROOTS = [
  "mybidquick.com",
  "mybidquick.io",
  "mybidquick.org",
  "mybidquick.vercel.app",
];

/**
 * Extract the tenant slug from a subdomain.
 * e.g., "cloute-cleaning.mybidquick.com" â "cloute-cleaning"
 *       "mybidquick.com" (root) â null
 *       "www.mybidquick.com" â null
 */
export function extractSubdomainSlug() {
  const host = window.location.hostname.toLowerCase();

  for (const root of SUBDOMAIN_ROOTS) {
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -(root.length + 1)); // strip ".mybidquick.com"
      if (sub && sub !== "www") return sub;
    }
  }

  return null;
}

/**
 * Resolve the tenant slug from the URL.
 * Returns: { slug: string, source: "param"|"subdomain"|"hostname"|"default" }
 *
 * This is the FIRST step â just figures out WHAT to load.
 * The actual config fetch happens in App.jsx.
 */
function applySlugAlias(slug) {
  return SLUG_ALIASES[slug] || slug;
}

export function resolveSlug() {
  // 1. Check query param (for testing: ?tenant=cloute-cleaning)
  const params = new URLSearchParams(window.location.search);
  const paramTenant = params.get("tenant");
  if (paramTenant) {
    return { slug: applySlugAlias(paramTenant), source: "param" };
  }

  // 2. Check subdomain (cloute-cleaning.mybidquick.com)
  const subSlug = extractSubdomainSlug();
  if (subSlug) {
    return { slug: applySlugAlias(subSlug), source: "subdomain" };
  }

  // 3. Check legacy hostname map
  const host = window.location.hostname.toLowerCase();
  const legacyId = HOST_MAP[host];
  if (legacyId) {
    return { slug: applySlugAlias(legacyId), source: "hostname" };
  }

  // 4. Fuzzy match for Vercel preview URLs
  if (host.includes("cornerstonebid") || host.includes("cornerstone")) {
    return { slug: "cornerstone", source: "hostname" };
  }

  // 5. Default
  return { slug: "cloute", source: "default" };
}

/**
 * Resolve the tenant synchronously from hardcoded configs.
 * Used as a FALLBACK when Supabase is unavailable.
 */
export function resolveTenant() {
  const { slug } = resolveSlug();

  // Check hardcoded tenants first
  if (TENANTS[slug]) return TENANTS[slug];

  // Default to Cloute
  return TENANTS.cloute;
}

/**
 * Check if a slug matches a hardcoded tenant (no Supabase needed).
 */
export function isHardcodedTenant(slug) {
  return slug in TENANTS;
}

/**
 * Get the hardcoded tenant config by slug.
 */
export function getHardcodedTenant(slug) {
  return TENANTS[slug] || null;
}

/**
 * Get all registered tenants (for future admin/dashboard use).
 */
export function getAllTenants() {
  return Object.values(TENANTS);
}

export default TENANTS;
