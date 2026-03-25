import { useState, useEffect, useMemo } from "react";
import C, { setTenantColors } from "./config/colors";
import s from "./config/styles";
import DEFAULT_CONFIG, { buildDefaultConfig } from "./config/defaults";
import { resolveTenant } from "./tenants";
import { deepClone } from "./utils/helpers";
import { saveConfig, loadConfig, saveLeads, loadLeads } from "./utils/storage";
import { sendLeadNotification } from "./utils/email";
import { sendToHousecallPro } from "./utils/housecall";
import AdminPanel from "./components/AdminPanel";
import LeadsPanel from "./components/LeadsPanel";
import CustomerFlow from "./components/CustomerFlow";

// Resolve tenant once at module load (before any renders)
const TENANT = resolveTenant();
setTenantColors(TENANT.colors);

const DEFAULT_LEADS = [
  { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "(555) 234-5678", services: ["pressure_washing", "gutter_cleaning"], package: "standard", total: 485, status: "pending", date: "2026-03-12", followUpStep: 2, notes: "Two-story home, large driveway", leadSource: "Online Organic", projectType: "residential", photos: [] },
  { id: 2, name: "Mike Chen", email: "mike@email.com", phone: "(555) 876-5432", services: ["window_cleaning", "deck_cleaning", "roof_cleaning"], package: "premium", total: 1247, status: "won", date: "2026-03-10", followUpStep: 4, notes: "Repeat customer", leadSource: "Repeat / Referral", projectType: "residential", photos: [] },
  { id: 3, name: "Jessica Williams", email: "jess@email.com", phone: "(555) 345-6789", services: ["concrete_cleaning"], package: "basic", total: 189, status: "lost", date: "2026-03-08", followUpStep: 3, notes: "Went with competitor", leadSource: "Online Paid", projectType: "commercial", photos: [] },
  { id: 4, name: "David Park", email: "david@email.com", phone: "(555) 456-7890", services: ["pressure_washing", "window_cleaning", "gutter_cleaning"], package: "standard", total: 692, status: "pending", date: "2026-03-13", followUpStep: 1, notes: "Spring bundle prospect", leadSource: "Social Media", projectType: "residential", photos: [] },
];

export default function App() {
  const [config, setConfig] = useState(() => {
    const tenantDefaults = buildDefaultConfig(TENANT);
    const saved = loadConfig();
    if (!saved) return deepClone(tenantDefaults);
    const defaults = deepClone(tenantDefaults);
    // Deep merge: start with defaults, overlay saved top-level keys
    const merged = { ...defaults, ...saved };
    // Always sync services from defaults (names, descriptions, extras, options)
    // but preserve any admin price overrides
    merged.services = defaults.services.map((defSvc) => {
      const savedSvc = saved.services?.find((s) => s.id === defSvc.id);
      if (!savedSvc) return defSvc;
      return {
        ...defSvc,
        // Preserve admin-editable fields from saved config
        basePrice: savedSvc.basePrice ?? defSvc.basePrice,
        perSqFt: savedSvc.perSqFt ?? defSvc.perSqFt,
        perWindow: savedSvc.perWindow ?? defSvc.perWindow,
        perLinFt: savedSvc.perLinFt ?? defSvc.perLinFt,
        enabled: savedSvc.enabled ?? defSvc.enabled,
      };
    });
    // Always use tenant lead sources
    merged.leadSources = defaults.leadSources;
    // Always preserve tenant identity
    merged.tenantId = defaults.tenantId;
    merged.businessName = defaults.businessName;
    merged.logoLetter = defaults.logoLetter;
    merged.tagline = defaults.tagline;
    merged.housecallProEnabled = defaults.housecallProEnabled;
    return merged;
  });
  const [leads, setLeads] = useState(() => loadLeads() || DEFAULT_LEADS);
  // Read initial view from URL hash (#admin, #leads) — defaults to customer
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

  // Set page title from tenant
  useEffect(() => {
    document.title = `${config.businessName} - ${config.tagline || "Instant Cleaning Service Quotes"}`;
  }, [config.businessName, config.tagline]);

  // Sync view when the URL hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Keep hash in sync when view changes programmatically
  const changeView = (newView) => {
    window.location.hash = newView === "customer" ? "" : newView;
    setView(newView);
  };

  // Persist config and leads to localStorage whenever they change
  useEffect(() => { saveConfig(config); }, [config]);
  useEffect(() => { saveLeads(leads); }, [leads]);

  // Page transition animation
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
    // Send email notification (fire-and-forget — doesn't block the UI)
    sendLeadNotification(newLead, config);
    // Sync to Housecall Pro CRM (fire-and-forget — creates customer + estimate)
    if (config.housecallProEnabled) {
      sendToHousecallPro(newLead, config.services);
    }
  };

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
          {/* Admin nav — only visible when on admin/leads views (accessed via #admin or #leads URL) */}
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
          <AdminPanel config={config} setConfig={setConfig} onExit={handleAdminExit} />
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
