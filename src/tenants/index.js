/**
 * Multi-Tenant Resolver
 *
 * Detects which business (tenant) to load based on the URL hostname.
 * This is what lets one ClouteBid codebase power multiple cleaning businesses.
 *
 * Detection order:
 * 1. ?tenant=xxx query param (dev/testing)
 * 2. Hostname matching
 * 3. Falls back to "cloute" (default)
 */
import CLOUTE from "./cloute";
import CORNERSTONE from "./cornerstone";

const TENANTS = {
  cloute: CLOUTE,
  cornerstone: CORNERSTONE,
};

// Map hostnames → tenant IDs
const HOST_MAP = {
  // Cloute (default)
  "cleanbid.vercel.app": "cloute",
  "cloutebid.vercel.app": "cloute",
  "cloutebid.com": "cloute",
  "www.cloutebid.com": "cloute",

  // Cornerstone
  "cornerstone.cloutebid.com": "cornerstone",
  "cornerstonebid.vercel.app": "cornerstone",
  "cornerstonewash.com": "cornerstone",
  "www.cornerstonewash.com": "cornerstone",

  // Local dev
  "localhost": "cloute",
};

/**
 * Resolve current tenant from the URL.
 */
export function resolveTenant() {
  // 1. Check query param (for testing: ?tenant=cornerstone)
  const params = new URLSearchParams(window.location.search);
  const paramTenant = params.get("tenant");
  if (paramTenant && TENANTS[paramTenant]) {
    return TENANTS[paramTenant];
  }

  // 2. Check hostname (exact match)
  const host = window.location.hostname.toLowerCase();
  const tenantId = HOST_MAP[host];
  if (tenantId && TENANTS[tenantId]) {
    return TENANTS[tenantId];
  }

  // 3. Fuzzy match — handles Vercel preview URLs like
  //    cornerstonebid-abc123-team.vercel.app
  if (host.includes("cornerstonebid") || host.includes("cornerstone")) {
    return TENANTS.cornerstone;
  }

  // 4. Default to Cloute
  return TENANTS.cloute;
}

/**
 * Get all registered tenants (for future admin/dashboard use).
 */
export function getAllTenants() {
  return Object.values(TENANTS);
}

export default TENANTS;
