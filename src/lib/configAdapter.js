/**
 * Config Adapter â MyBidQuick Supabase â Engine Format
 *
 * MyBidQuick stores tenant configs in a simplified JSONB format.
 * The engine's pricing system expects a richer structure (windowTypes,
 * tiers, conditionQuestions, package features, etc.).
 *
 * Strategy:
 * 1. Build a "tenant object" from the Supabase row (matches what buildDefaultConfig expects)
 * 2. Let buildDefaultConfig() generate the full engine config with all rich features
 * 3. Overlay the Supabase config's custom values (prices, enabled services, marketing, etc.)
 *
 * This way, new engine features are always available, and tenants only customize
 * the simple knobs exposed in MyBidQuick's dashboard.
 */

import { buildDefaultConfig } from "../config/defaults";
import { deepClone } from "../utils/helpers";

/**
 * Generate a full color palette from a primary color.
 * Each MyBidQuick tenant picks one color; we derive the full 20+ palette from it.
 */
function generatePalette(primaryHex) {
  // Default to MyBidQuick blue if no color provided
  const hex = primaryHex || "#3b9cff";

  // Parse hex â RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Helper: lighten/darken a color
  const adjust = (r, g, b, amount) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${[r, g, b].map((c) => clamp(c + amount).toString(16).padStart(2, "0")).join("")}`;
  };

  // Helper: mix with white (tint)
  const tint = (r, g, b, factor) => {
    const mix = (c) => Math.round(c + (255 - c) * factor);
    return `#${[r, g, b].map((c) => mix(c).toString(16).padStart(2, "0")).join("")}`;
  };

  // Build a complementary green-ish secondary from the primary
  const secR = Math.round(r * 0.4 + 50);
  const secG = Math.round(g * 0.6 + 130);
  const secB = Math.round(b * 0.3 + 80);

  return {
    bg: tint(r, g, b, 0.94),
    bgCard: "#ffffff",
    bgCardAlt: tint(r, g, b, 0.96),
    bgDark: tint(r, g, b, 0.9),
    bgAccent: "#eef7ee",
    border: tint(r, g, b, 0.82),
    borderLight: tint(r, g, b, 0.9),
    primary: hex,
    primaryDark: adjust(r, g, b, -30),
    secondary: `#${secR.toString(16).padStart(2, "0")}${secG.toString(16).padStart(2, "0")}${secB.toString(16).padStart(2, "0")}`,
    secondaryDark: adjust(secR, secG, secB, -30),
    accent: "#a78bfa",
    accentDark: "#7c5fd6",
    warning: "#f59e0b",
    danger: "#ef4444",
    text: "#1e3a5f",
    textMid: "#4a6d94",
    textLight: "#7a9bbc",
    textMuted: "#a3bdd4",
    white: "#ffffff",
    gradient: `linear-gradient(135deg, ${hex}, #6dd19e)`,
    shadow: `0 2px 12px rgba(${r},${g},${b},0.1)`,
    shadowHover: `0 4px 20px rgba(${r},${g},${b},0.18)`,
  };
}

/**
 * Convert a Supabase tenant row into the "tenant object" that
 * buildDefaultConfig() expects (same shape as cloute.js / cornerstone.js).
 */
function rowToTenantObject(row) {
  const cfg = row.config || {};

  return {
    id: row.slug || row.id,
    businessName: row.business_name || cfg.businessName || "My Cleaning Co",
    tagline: cfg.tagline || "Professional Cleaning Services",
    phone: row.phone || "",
    email: row.email || "",
    adminPassword: cfg.adminPassword || "",

    // API keys from config
    web3formsKey: cfg.web3formsKey || "",
    googlePlacesApiKey: cfg.googlePlacesApiKey || "",
    housecallProEnabled: cfg.housecallProEnabled ?? false,

    // Generate full palette from the single primary color
    colors: generatePalette(row.primary_color || cfg.primaryColor),

    // Logo
    logoLetter: (row.business_name || "C").charAt(0).toUpperCase(),
    logoImage: row.logo_url || cfg.logoImage || null,

    // Lead sources
    leadSources: cfg.leadSources || ["Google Search", "Facebook / Instagram", "Friend / Referral", "Nextdoor", "Yard Sign", "Saw Our Truck / Trailer", "Repeat Customer", "Thumbtack / Angi / HomeAdvisor", "Other"],

    // Gallery
    gallery: { enabled: cfg.gallery?.enabled ?? true },

    // Marketing â translate nested MyBidQuick format â flat engine format
    marketing: adaptMarketing(cfg.marketing),

    // Disabled services (any service in config with enabled: false)
    disabledServices: (cfg.services || [])
      .filter((s) => s.enabled === false)
      .map((s) => s.id),
  };
}

/**
 * Adapt MyBidQuick's nested marketing format to the engine's flat format.
 *
 * MyBidQuick: { urgencyTimer: {enabled, message, endDate}, socialProof: {enabled, count}, ... }
 * Engine:     { showUrgencyTimer, urgencyMessage, urgencyEndDate, showSocialProof, socialProofCount, ... }
 */
function adaptMarketing(mkt) {
  if (!mkt) return {};

  // If it's already in the engine's flat format (has showUrgencyTimer), pass through
  if ("showUrgencyTimer" in mkt) return mkt;

  return {
    showUrgencyTimer: mkt.urgencyTimer?.enabled ?? false,
    urgencyMessage: mkt.urgencyTimer?.message || "Limited time offer!",
    urgencyEndDate: mkt.urgencyTimer?.endDate || "",
    showSocialProof: mkt.socialProof?.enabled ?? false,
    socialProofCount: mkt.socialProof?.count || 0,
    showLimitedOffer: mkt.limitedOffer?.enabled ?? false,
    limitedOfferText: mkt.limitedOffer?.text || "",
    showReviewBadge: mkt.reviewBadge?.enabled ?? false,
    reviewCount: mkt.reviewBadge?.count || 0,
    reviewAverage: mkt.reviewBadge?.rating || 4.8,
  };
}

/**
 * Adapt MyBidQuick's package names to the engine's names.
 *
 * MyBidQuick uses: basic / standard / premium
 * Engine uses:     standard / premium / platinum
 *
 * We map:  basic â standard,  standard â premium,  premium â platinum
 */
function adaptPackages(mbqPackages, defaultPackages) {
  if (!mbqPackages) return defaultPackages;

  const result = deepClone(defaultPackages);

  // Map MyBidQuick basic â engine standard
  if (mbqPackages.basic) {
    result.standard.multiplier = mbqPackages.basic.multiplier ?? result.standard.multiplier;
    if (mbqPackages.basic.tagline) result.standard.tag = mbqPackages.basic.tagline;
  }

  // Map MyBidQuick standard â engine premium
  if (mbqPackages.standard) {
    result.premium.multiplier = mbqPackages.standard.multiplier ?? result.premium.multiplier;
    if (mbqPackages.standard.tagline) result.premium.tag = mbqPackages.standard.tagline;
  }

  // Map MyBidQuick premium â engine platinum
  if (mbqPackages.premium) {
    result.platinum.multiplier = mbqPackages.premium.multiplier ?? result.platinum.multiplier;
    if (mbqPackages.premium.tagline) result.platinum.tag = mbqPackages.premium.tagline;
  }

  return result;
}

/**
 * Adapt MyBidQuick's bundle discounts format.
 *
 * MyBidQuick: { twoServices: 10, threeServices: 15 }
 * Engine:     { 2: 10, 3: 15 }
 */
function adaptBundleDiscounts(mbqDiscounts) {
  if (!mbqDiscounts) return { 2: 5, 3: 10 };

  // If already in engine format (numeric keys), pass through
  if (mbqDiscounts[2] !== undefined) return mbqDiscounts;

  return {
    2: mbqDiscounts.twoServices ?? 5,
    3: mbqDiscounts.threeServices ?? 10,
  };
}

/**
 * Adapt MyBidQuick's follow-up format.
 *
 * MyBidQuick: [ {id, delay (int), type, subject, body, active} ]
 * Engine:     { enabled: true, sequences: [ {id, delay (string), type, subject, body, active} ] }
 */
function adaptFollowUp(mbqFollowUp) {
  if (!mbqFollowUp) return undefined; // Let defaults handle it

  // If it's already in engine format (has .sequences), pass through
  if (mbqFollowUp.sequences) return mbqFollowUp;

  // Convert array format â engine object format
  const delayLabels = { 0: "Immediate", 1: "1 day", 2: "2 days", 3: "3 days", 5: "5 days", 7: "7 days", 14: "14 days" };

  return {
    enabled: mbqFollowUp.length > 0,
    sequences: mbqFollowUp.map((step) => ({
      id: step.id,
      delay: delayLabels[step.delay] || `${step.delay} days`,
      type: step.type || "email",
      subject: step.subject || "",
      body: step.body || "",
      active: step.active ?? true,
    })),
  };
}

/**
 * Merge MyBidQuick service pricing into the engine's rich service config.
 *
 * MyBidQuick stores simple: { id, name, enabled, basePrice, perSqFt, perWindow, perLinFt, extras }
 * Engine has rich:          { ...above + windowTypes, tiers, conditionQuestions, tierFeatures, etc. }
 *
 * We keep all of the engine's rich structure and only override the price values.
 */
function adaptServices(mbqServices, defaultServices) {
  if (!mbqServices || mbqServices.length === 0) return defaultServices;

  return defaultServices.map((defSvc) => {
    const mbqSvc = mbqServices.find((s) => s.id === defSvc.id);
    if (!mbqSvc) return defSvc;

    return {
      ...defSvc,
      // Override prices from MyBidQuick
      basePrice: mbqSvc.basePrice ?? defSvc.basePrice,
      perSqFt: mbqSvc.perSqFt ?? defSvc.perSqFt,
      perWindow: mbqSvc.perWindow ?? defSvc.perWindow,
      perLinFt: mbqSvc.perLinFt ?? defSvc.perLinFt,
      enabled: mbqSvc.enabled ?? defSvc.enabled,
      name: mbqSvc.name || defSvc.name,
      // Merge extras: keep engine's rich extras, override prices from MyBidQuick
      extras: defSvc.extras.map((defExtra) => {
        const mbqExtra = (mbqSvc.extras || []).find(
          (e) => e.label === defExtra.label || e.id === defExtra.id
        );
        if (!mbqExtra) return defExtra;
        return { ...defExtra, price: mbqExtra.price ?? defExtra.price };
      }),
    };
  });
}

/**
 * Adapt MyBidQuick's seasonal bundles to the engine's format.
 */
function adaptBundles(mbqBundles) {
  if (!mbqBundles) return undefined; // Let defaults handle it

  return mbqBundles.map((b) => ({
    id: b.id,
    name: b.name,
    services: b.services || [],
    discount: b.discount || 10,
    active: b.active ?? true,
    endDate: b.endDate || "",
    tagline: b.tagline || "",
  }));
}

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// MAIN EXPORT
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Transform a Supabase tenant row into a complete engine config.
 *
 * @param {Object} row â Full tenant row from Supabase (with .config JSONB)
 * @returns {Object} â Complete engine config ready for the app
 */
export function adaptSupabaseConfig(row) {
  const cfg = row.config || {};

  // Step 1: Build the tenant object (same shape as cloute.js)
  const tenantObj = rowToTenantObject(row);

  // Step 2: Generate full engine config from defaults + tenant identity
  const fullConfig = buildDefaultConfig(tenantObj);

  // Step 3: Overlay MyBidQuick's custom pricing/settings
  if (cfg.priceAdjustment !== undefined) {
    fullConfig.globalPriceAdjustment = cfg.priceAdjustment;
  }

  // Packages (basic/standard/premium â standard/premium/platinum)
  fullConfig.packages = adaptPackages(cfg.packages, fullConfig.packages);

  // Bundle discounts
  fullConfig.bundleDiscounts = adaptBundleDiscounts(cfg.bundleDiscounts);

  // Services (overlay custom prices onto rich defaults)
  fullConfig.services = adaptServices(cfg.services, fullConfig.services);

  // Seasonal bundles
  if (cfg.bundles) {
    fullConfig.seasonalBundles = adaptBundles(cfg.bundles);
  }

  // Follow-up sequences
  const adaptedFollowUp = adaptFollowUp(cfg.followUp);
  if (adaptedFollowUp) {
    fullConfig.followUp = adaptedFollowUp;
  }

  // Lead notification email
  if (cfg.leadEmail) {
    fullConfig.contactEmail = cfg.leadEmail;
  }

  // Upsell config (if tenant configured it in MyBidQuick)
  if (cfg.upsell) {
    fullConfig.upsell = cfg.upsell;
  }

  return fullConfig;
}

/**
 * Extract the color palette from a Supabase row.
 * Called separately because colors need to be set before React renders.
 */
export function extractColors(row) {
  return generatePalette(row?.primary_color || row?.config?.primaryColor);
}
