import { useState, useEffect, useCallback } from "react";
import C, { setTenantColors } from "./config/colors";
import s from "./config/styles";
import { buildDefaultConfig } from "./config/defaults";
import { resolveSlug, isHardcodedTenant, getHardcodedTenant, resolveTenant } from "./tenants";
import { isSupabaseConnected, fetchTenantBySlug } from "./lib/supabase";
import { adaptSupabaseConfig, extractColors } from "./lib/configAdapter";
import { deepClone } from "./utils/helpers";
import { saveConfig, loadConfig, saveLeads, loadLeads } from "./utils/storage";
// NOTE: Lead-notification emails now go through the platform's Resend
// endpoints (see notifyTenantOfLead + emailCustomerConfirmation below).
// The legacy Web3Forms helper has been retired — every tenant now just sets
// leadEmail in the dashboard and notifications "just work."
import { sendToHousecallPro } from "./utils/housecall";
import AdminPanel from "./components/AdminPanel";
import LeadsPanel from "./components/LeadsPanel";
import CustomerFlow from "./components/CustomerFlow";

// ââ Resolve slug synchronously (fast â no network) ââ
const { slug: TENANT_SLUG, source: SLUG_SOURCE } = resolveSlug();

// ââ If it's a hardcoded tenant, load synchronously (backwards compatible) ââ
const HARDCODED = getHardcodedTenant(TENANT_SLUG);
if (HARDCODED) {
  setTenantColors(HARDCODED.colors);
}

const DEFAULT_LEADS = [
  { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "(555) 234-5678", services: ["pressure_washing", "gutter_cleaning"], package: "premium", total: 485, status: "pending", date: "2026-03-12", followUpStep: 2, notes: "Two-story home, large driveway", leadSource: "Online Organic", projectType: "residential", photos: [] },
  { id: 2, name: "Mike Chen", email: "mike@email.com", phone: "(555) 876-5432", services: ["window_cleaning", "deck_cleaning", "roof_cleaning"], package: "platinum", total: 1247, status: "won", date: "2026-03-10", followUpStep: 4, notes: "Repeat customer", leadSource: "Repeat / Referral", projectType: "residential", photos: [] },
  { id: 3, name: "Jessica Williams", email: "jess@email.com", phone: "(555) 345-6789", services: ["concrete_cleaning"], package: "standard", total: 189, status: "lost", date: "2026-03-08", followUpStep: 3, notes: "Went with competitor", leadSource: "Online Paid", projectType: "residential", photos: [] },
  { id: 4, name: "David Park", email: "david@email.com", phone: "(555) 456-7890", services: ["pressure_washing", "window_cleaning", "gutter_cleaning"], package: "premium", total: 692, status: "pending", date: "2026-03-13", followUpStep: 1, notes: "Spring bundle prospect", leadSource: "Social Media", projectType: "residential", photos: [] },
];

export default function App() {
  // ââ Loading states ââ
  const [loading, setLoading] = useState(!HARDCODED); // Only loading if we need to fetch
  const [error, setError] = useState(null);

  // ââ Config â initialized immediately for hardcoded tenants ââ
  const [config, setConfig] = useState(() => {
    if (!HARDCODED) return null; // Will be set after Supabase fetch

    const tenantDefaults = buildDefaultConfig(HARDCODED);
    const saved = loadConfig();
    if (!saved) return deepClone(tenantDefaults);
    return mergeConfigWithDefaults(saved, tenantDefaults);
  });

  const [leads, setLeads] = useState(() => loadLeads() || DEFAULT_LEADS);

  // ââ View routing (hash-based) ââ
  const getViewFromHash = () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "admin") return "admin";
    if (hash === "leads") return "leads";
    return "customer";
  };

  const [view, setView] = useState(getViewFromHash);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [animate, setAnimate] = useState(false);

  // ââ Fetch config from Supabase for non-hardcoded tenants ââ
  useEffect(() => {
    if (HARDCODED) return; // Already loaded synchronously

    async function fetchConfig() {
      try {
        if (!isSupabaseConnected()) {
          // No Supabase env vars â fall back to default Cloute config
          console.warn("[App] Supabase not configured, using default config");
          const fallback = resolveTenant();
          setTenantColors(fallback.colors);
          const cfg = buildDefaultConfig(fallback);
          setConfig(deepClone(cfg));
          setLoading(false);
          return;
        }

        // Try fetching by slug from Supabase
        const tenantRow = await fetchTenantBySlug(TENANT_SLUG);

        if (!tenantRow) {
          setError({
            title: "Business Not Found",
            message: `We couldn't find a cleaning company with the URL "${TENANT_SLUG}".`,
            suggestion: "Double-check the URL or contact the business directly.",
          });
          setLoading(false);
          return;
        }

        // Set colors FIRST (before render) so all components get the right palette
        const colors = extractColors(tenantRow);
        setTenantColors(colors);

        // Build the full Cleanbid config from the Supabase data
        const fullConfig = adaptSupabaseConfig(tenantRow);
        setConfig(fullConfig);
        setLoading(false);
      } catch (err) {
        console.error("[App] Failed to fetch tenant config:", err);
        // Graceful fallback â use default config
        const fallback = resolveTenant();
        setTenantColors(fallback.colors);
        const cfg = buildDefaultConfig(fallback);
        setConfig(deepClone(cfg));
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  // ââ Set page title from tenant ââ
  useEffect(() => {
    if (config) {
      document.title = `${config.businessName} - ${config.tagline || "Instant Cleaning Service Quotes"}`;
    }
  }, [config?.businessName, config?.tagline]);

  // ââ Sync view when the URL hash changes (browser back/forward) ââ
  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const changeView = (newView) => {
    window.location.hash = newView === "customer" ? "" : newView;
    setView(newView);
  };

  // ââ Persist config and leads to localStorage whenever they change ââ
  useEffect(() => { if (config) saveConfig(config); }, [config]);
  useEffect(() => { saveLeads(leads); }, [leads]);

  // ââ Page transition animation ââ
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 350);
    return () => clearTimeout(t);
  }, [view]);

  const handleAdminLogin = () => {
    if (adminPw === config.adminPassword) setAdminAuth(true);
  };

  const handleAdminExit = () => {
    setAdminAuth(false);
    setAdminPw("");
    changeView("customer");
  };

  const handleSubmitLead = (newLead) => {
    setLeads((prev) => [newLead, ...prev]);

    // ── Notify the cleaning company (the tenant) — Resend via platform API ──
    notifyTenantOfLead(newLead, config);

    // ── Email the customer their "we got your quote" confirmation ──
    emailCustomerConfirmation(newLead, config);

    if (config.housecallProEnabled) {
      sendToHousecallPro(newLead, config.services);
    }

    // Save lead to Supabase via edge function (deducts credit too)
    if (config.supabaseId) {
      const supabaseUrl = "https://eccuaztubjdxicylcwrh.supabase.co/functions/v1/submit-lead";
      fetch(supabaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: config.supabaseId,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          address: newLead.address || null,
          projectType: newLead.projectType || "residential",
          services: newLead.services,
          selectedPackage: newLead.package,
          total: newLead.total,
          notes: newLead.notes || null,
          leadSource: newLead.leadSource || null,
          serviceDetails: newLead.details || {},
          selectedExtras: newLead.selectedExtras || {},
          packagePrices: newLead.allPackagePrices || {},
          bundleApplied: newLead.appliedBundle || null,
          photos: (newLead.photos || []).map(p => ({ name: p.name, size: p.size, timestamp: p.timestamp })),
          preferredDays: newLead.preferredDays || null,
          preferredTime: newLead.preferredTime || null,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log("[MyBidQuick] Lead saved to database:", data.lead_id, "| Credits remaining:", data.credits_remaining);
          } else {
            console.warn("[MyBidQuick] Lead save failed:", data.error);
          }
        })
        .catch(err => console.error("[MyBidQuick] Lead save error:", err));
    }
  };

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // LOADING STATE
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f7ff",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: "linear-gradient(135deg, #3b9cff, #6dd19e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, color: "#fff",
          animation: "pulse 1.5s ease-in-out infinite",
          marginBottom: 20,
        }}>
          BQ
        </div>
        <p style={{ color: "#4a6d94", fontSize: 16 }}>Loading your quote page...</p>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // ERROR STATE (tenant not found)
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f7ff",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: 24,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "48px 40px",
          maxWidth: 440,
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(59,156,255,0.1)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F50D}"}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>
            {error.title}
          </h1>
          <p style={{ fontSize: 15, color: "#4a6d94", lineHeight: 1.6, marginBottom: 20 }}>
            {error.message}
          </p>
          <p style={{ fontSize: 13, color: "#7a9bbc" }}>
            {error.suggestion}
          </p>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e8f0fa" }}>
            <a
              href="https://mybidquick.com"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "linear-gradient(135deg, #3b9cff, #6dd19e)",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Visit MyBidQuick
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // MAIN APP (config loaded)
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: C.text }}>
      {/* HEADER */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(59,156,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => changeView("customer")}>
            {config.logoImage ? (
              <img src={config.logoImage} alt={config.businessName} style={{ height: 38, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
            ) : null}
            <div style={{ width: 38, height: 38, borderRadius: 10, background: C.gradient, display: config.logoImage ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: config.logoLetter?.length > 1 ? 13 : 18, fontWeight: 800, color: C.white }}>{config.logoLetter || "C"}</div>
            {!config.logoImage && <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{config.businessName}</span>}
          </div>
          {(view === "admin" || view === "leads") && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => changeView("leads")} style={{ ...s.btnSecondary, padding: "8px 14px", fontSize: 12, background: view === "leads" ? `${C.primary}12` : C.white, color: view === "leads" ? C.primary : C.textLight, borderColor: view === "leads" ? C.primary : C.border }}>
                {"\u{1F4CB}"} Leads ({leads.filter((l) => l.status === "pending").length})
              </button>
              <button onClick={() => changeView("admin")} style={{ ...s.btnSecondary, padding: "8px 14px", fontSize: 12, background: view === "admin" ? `${C.primary}12` : C.white, color: view === "admin" ? C.primary : C.textLight, borderColor: view === "admin" ? C.primary : C.border }}>
                {"\u2699\uFE0F"} Admin
              </button>
              <button onClick={() => changeView("customer")} style={{ ...s.btnSecondary, padding: "8px 14px", fontSize: 12, color: C.textLight, borderColor: C.border }}>
                {"\u{1F441}"} Customer View
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px", opacity: animate ? 0 : 1, transform: animate ? "translateY(10px)" : "none", transition: "all 0.35s ease" }}>

        {/* Admin Login */}
        {view === "admin" && !adminAuth && (
          <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F512}"}</div>
            <h2 style={{ ...s.h1, fontSize: 24, marginBottom: 16 }}>Admin Access</h2>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin(); }}
              style={{ ...s.input, textAlign: "center", marginBottom: 12 }}
            />
            <button onClick={handleAdminLogin} style={{ ...s.btnPrimary, width: "100%" }}>Unlock</button>
          </div>
        )}

        {/* Admin Panel */}
        {view === "admin" && adminAuth && (
          <AdminPanel config={config} setConfig={setConfig} onExit={handleAdminExit} tenantSlug={TENANT_SLUG} />
        )}

        {/* Leads / CRM */}
        {view === "leads" && (
          <LeadsPanel leads={leads} setLeads={setLeads} config={config} />
        )}

        {/* Customer Quote Flow */}
        {view === "customer" && (
          <CustomerFlow config={config} onSubmitLead={handleSubmitLead} />
        )}
      </main>

    </div>
  );
}

// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// HELPERS
// ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// Platform API base. Engine runs on slug.mybidquick.com so we call across to
// www.mybidquick.com where the Resend-backed serverless functions live.
const PLATFORM_API = "https://www.mybidquick.com";

/**
 * Fire-and-forget: tell the tenant (Noah, Steven, etc.) that a new lead just
 * came in. The platform endpoint looks up the tenant by id, pulls leadEmail
 * from their config, and emails them via Resend with replyTo = customer email.
 */
function notifyTenantOfLead(lead, config) {
  if (!config?.supabaseId) {
    console.info("[Lead notify] No supabaseId on config - skipping (likely demo/local).");
    return;
  }
  fetch(`${PLATFORM_API}/api/send-lead-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        services: lead.services,
        servicePrices: lead.servicePrices,
        package: lead.package,
        total: lead.total,
        notes: lead.notes,
        leadSource: lead.leadSource,
        projectType: lead.projectType,
        photos: lead.photos,
        preferredDays: lead.preferredDays,
        preferredTime: lead.preferredTime,
      },
      tenant_id: config.supabaseId,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d?.sent) console.log("[Lead notify] Sent to", d.to);
      else if (d?.skipped) console.warn("[Lead notify] Skipped:", d.reason);
      else console.warn("[Lead notify] Unknown response:", d);
    })
    .catch((err) => console.warn("[Lead notify] Network error (non-blocking):", err));
}

/**
 * Fire-and-forget: send the customer their branded "we got your quote"
 * confirmation. Uses the existing /api/send-quote-confirmation endpoint.
 */
function emailCustomerConfirmation(lead, config) {
  if (!config?.supabaseId) return; // demo/local - no tenant to brand the email
  if (!lead.email) return; // customer didn't give an email - nothing to send
  fetch(`${PLATFORM_API}/api/send-quote-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead: {
        name: lead.name,
        email: lead.email,
        services: lead.services,
        servicePrices: lead.servicePrices, // per-service final $ for the email line items
        total: lead.total,
        package: lead.package,
      },
      tenant_id: config.supabaseId,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d?.sent) console.log("[Customer confirm] Sent to", d.to);
      else if (d?.skipped) console.warn("[Customer confirm] Skipped:", d.reason);
    })
    .catch((err) => console.warn("[Customer confirm] Network error (non-blocking):", err));
}

/**
 * Merge a saved localStorage config with fresh defaults.
 * Preserves admin price overrides while syncing new features.
 */
function mergeConfigWithDefaults(saved, defaults) {
  // If pricing version changed, discard saved pricing — use fresh defaults
  // This prevents stale localStorage from overriding updated default prices
  const pricingStale = (saved.configVersion || 0) !== (defaults.configVersion || 0);

  if (pricingStale) {
    console.info("[Config] Pricing version changed — resetting to new defaults");
    // Keep non-pricing admin settings, reset all pricing to defaults
    const merged = deepClone(defaults);
    // Preserve non-pricing settings the admin may have customized
    if (saved.marketing) merged.marketing = saved.marketing;
    if (saved.followUp) merged.followUp = saved.followUp;
    if (saved.contactEmail) merged.contactEmail = saved.contactEmail;
    if (saved.web3formsKey) merged.web3formsKey = saved.web3formsKey;
    if (saved.googlePlacesApiKey) merged.googlePlacesApiKey = saved.googlePlacesApiKey;
    // Preserve service enabled/disabled state (but not prices)
    merged.services = defaults.services.map((defSvc) => {
      const savedSvc = saved.services?.find((s) => s.id === defSvc.id);
      if (!savedSvc) return defSvc;
      return { ...defSvc, enabled: savedSvc.enabled ?? defSvc.enabled };
    });
    return merged;
  }

  const merged = { ...deepClone(defaults), ...saved };

  // Always sync services from defaults (names, descriptions, extras, options)
  // but preserve any admin price overrides
  merged.services = defaults.services.map((defSvc) => {
    const savedSvc = saved.services?.find((s) => s.id === defSvc.id);
    if (!savedSvc) return defSvc;
    return {
      ...defSvc,
      basePrice: savedSvc.basePrice ?? defSvc.basePrice,
      perSqFt: savedSvc.perSqFt ?? defSvc.perSqFt,
      perWindow: savedSvc.perWindow ?? defSvc.perWindow,
      perLinFt: savedSvc.perLinFt ?? defSvc.perLinFt,
      enabled: savedSvc.enabled ?? defSvc.enabled,
    };
  });

  // Always use tenant lead sources & identity
  merged.leadSources = defaults.leadSources;
  merged.tenantId = defaults.tenantId;
  merged.supabaseId = defaults.supabaseId;
  merged.businessName = defaults.businessName;
  merged.logoLetter = defaults.logoLetter;
  merged.tagline = defaults.tagline;
  merged.housecallProEnabled = defaults.housecallProEnabled;

  return merged;
}
