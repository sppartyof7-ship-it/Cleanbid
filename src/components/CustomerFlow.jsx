import { useState, useMemo, useEffect } from "react";
import C from "../config/colors";
import s from "../config/styles";
import { SERVICES_WITH_STORIES } from "../config/defaults";
import { fmt, isValidEmail, isValidPhone } from "../utils/helpers";
import { calculateServicePrice, calculateTotalBase, getDiscountPercent, getPackagePrice, calculateTotalPackagePrice, getEstimatedWindows, estimateGutterLinearFt } from "../utils/pricing";
import Badge from "./Badge";
import CountdownTimer from "./CountdownTimer";
import PhotoUploader from "./PhotoUploader";
import AddressAutocomplete from "./AddressAutocomplete";
import TrustGallery from "./TrustGallery";

/**
 * National average price ranges for exterior cleaning services (2026).
 * Sources: Angi, HomeGuide, HomeAdvisor, Thumbtack — updated April 2026.
 * Ranges represent typical residential jobs, not outliers.
 */
const NATIONAL_AVERAGES = {
  pressure_washing: { low: 250, high: 600, label: "House Washing" },
  window_cleaning: { low: 150, high: 450, label: "Window Cleaning" },
  deck_cleaning: { low: 100, high: 350, label: "Deck Cleaning" },
  concrete_cleaning: { low: 100, high: 350, label: "Concrete Cleaning" },
  roof_cleaning: { low: 250, high: 600, label: "Roof Cleaning" },
  gutter_cleaning: { low: 119, high: 234, label: "Gutter Cleaning" },
  gutter_guard_install: { low: 1050, high: 2250, label: "Gutter Guards" },
};

// Session storage helpers for persistence
const CF_STORAGE_KEY = 'mbq_customer_flow_progress'

function loadCustomerProgress() {
  try {
    const raw = sessionStorage.getItem(CF_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveCustomerProgress(data) {
  try { sessionStorage.setItem(CF_STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function clearCustomerProgress() {
  try { sessionStorage.removeItem(CF_STORAGE_KEY) } catch {}
}

function WindowTypeSVG({ type, active }) {
  const color = active ? "#3b9cff" : "#94a3b8";
  const bg = active ? "#eef6ff" : "#f8fafc";
  const w = 80, h = 64;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", margin: "0 auto" }}>
      <rect x="4" y="4" width="72" height="56" rx="3" fill={bg} stroke={color} strokeWidth="2" />
      {type === "casement" && (
        <>
          <line x1="40" y1="4" x2="40" y2="60" stroke={color} strokeWidth="1.5" />
          <circle cx="36" cy="32" r="2" fill={color} />
          <circle cx="44" cy="32" r="2" fill={color} />
          <path d="M 20 20 L 20 44" stroke={color} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
          <path d="M 60 20 L 60 44" stroke={color} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
        </>
      )}
      {type === "double_hung" && (
        <>
          <line x1="4" y1="32" x2="76" y2="32" stroke={color} strokeWidth="2" />
          <line x1="40" y1="4" x2="40" y2="60" stroke={color} strokeWidth="1" />
          <path d="M 30 26 L 30 38 M 50 26 L 50 38" stroke={color} strokeWidth="0.8" opacity="0.5" />
          <rect x="35" y="28" width="10" height="8" rx="1" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        </>
      )}
      {type === "combination" && (
        <>
          <rect x="10" y="10" width="60" height="44" rx="2" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4,2" />
          <line x1="40" y1="4" x2="40" y2="60" stroke={color} strokeWidth="1" />
          <line x1="4" y1="32" x2="76" y2="32" stroke={color} strokeWidth="1" />
          <text x="40" y="22" textAnchor="middle" fontSize="7" fill={color} fontWeight="600">STORM</text>
          <text x="40" y="48" textAnchor="middle" fontSize="7" fill={color} fontWeight="600">INNER</text>
        </>
      )}
    </svg>
  );
}

export default function CustomerFlow({ config, onSubmitLead }) {
  // Load saved progress from sessionStorage
  const saved = loadCustomerProgress()

  const [step, setStep] = useState(saved?.step ?? 0);
  const [selectedServices, setSelectedServices] = useState(saved?.selectedServices ?? []);
  const [details, setDetails] = useState(saved?.details ?? {});
  const [selectedExtras, setSelectedExtras] = useState(saved?.selectedExtras ?? {});
  const [servicePackages, setServicePackages] = useState(saved?.servicePackages ?? {});
  const [contact, setContact] = useState(saved?.contact ?? {
    name: "", email: "", phone: "", address: "", notes: "", leadSource: "", projectType: "residential",
  });
  const [appliedBundle, setAppliedBundle] = useState(null);
  const [globalStories, setGlobalStories] = useState(saved?.globalStories ?? 1);
  const [customerPhotos, setCustomerPhotos] = useState([]); // Can't serialize file objects
  const [validationErrors, setValidationErrors] = useState({});
  const [dismissedUpsells, setDismissedUpsells] = useState([]);

  // Helper functions for per-service package selection
  const getServicePackage = (svcId) => servicePackages[svcId] || "premium";
  const setServicePackage = (svcId, pkg) => setServicePackages(prev => ({ ...prev, [svcId]: pkg }));

  // Derived selectedPackage for backward compat display (most common package across selected services)
  const selectedPackage = (() => {
    if (selectedServices.length === 0) return "premium";
    const pkgs = selectedServices.map(id => getServicePackage(id));
    const counts = {};
    pkgs.forEach(p => counts[p] = (counts[p] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "premium";
  })();

  // Auto-save progress to sessionStorage
  useEffect(() => {
    saveCustomerProgress({ step, selectedServices, details, selectedExtras, servicePackages, contact, globalStories })
  }, [step, selectedServices, details, selectedExtras, servicePackages, contact, globalStories])

  const enabledServices = config.services.filter((sv) => sv.enabled);

  // --- Smart Cascade Upsell Logic ---
  // Uses tenant's upsell config (enabled, discountPercent) from Supabase/onboarding
  const upsellConfig = config.upsell || { enabled: true, discountPercent: 0 };
  const upsellDiscount = upsellConfig.discountPercent || 0;

  const hasHouseWash = selectedServices.includes("pressure_washing");
  const hasWindows = selectedServices.includes("window_cleaning");
  const hasGutters = selectedServices.includes("gutter_cleaning");
  const windowServiceEnabled = enabledServices.some((sv) => sv.id === "window_cleaning");
  const gutterServiceEnabled = enabledServices.some((sv) => sv.id === "gutter_cleaning");

  // Get sqft from house washing details (used for gutter estimation)
  const houseWashSqft = details.pressure_washing?.sqft || 0;

  // Track which services were added via upsell (to apply discount in pricing)
  const [upsellAccepted, setUpsellAccepted] = useState([]);

  // Smart auto-populate: sync sqft across services + estimate gutter LF
  // Finds the best available sqft from any service and shares it everywhere
  useEffect(() => {
    const hwSqft = details.pressure_washing?.sqft || 0
    const winSqft = details.window_cleaning?.sqft || 0
    // Use whichever sqft the customer entered (house wash takes priority)
    const bestSqft = hwSqft || winSqft
    if (!bestSqft || bestSqft <= 0) return

    setDetails(prev => {
      const next = { ...prev }
      let changed = false

      // Sync sqft to house washing if not manually set
      if (selectedServices.includes('pressure_washing') && !prev.pressure_washing?.sqft) {
        next.pressure_washing = { ...(prev.pressure_washing || {}), sqft: bestSqft }
        changed = true
      }
      // Sync sqft to window cleaning if not manually set
      if (selectedServices.includes('window_cleaning') && !prev.window_cleaning?.sqft) {
        next.window_cleaning = { ...(prev.window_cleaning || {}), sqft: bestSqft }
        changed = true
      }
      // Sync sqft to roof cleaning if not manually set
      if (selectedServices.includes('roof_cleaning') && !prev.roof_cleaning?.sqft) {
        next.roof_cleaning = { ...(prev.roof_cleaning || {}), sqft: bestSqft }
        changed = true
      }
      // Auto-estimate gutter cleaning linear ft from sqft
      if (selectedServices.includes('gutter_cleaning') && !prev.gutter_cleaning?.linearFt) {
        next.gutter_cleaning = { ...(prev.gutter_cleaning || {}), linearFt: estimateGutterLinearFt(bestSqft) }
        changed = true
      }
      // Auto-estimate gutter guard install linear ft from sqft
      if (selectedServices.includes('gutter_guard_install') && !prev.gutter_guard_install?.linearFt) {
        next.gutter_guard_install = { ...(prev.gutter_guard_install || {}), linearFt: estimateGutterLinearFt(bestSqft) }
        changed = true
      }

      return changed ? next : prev
    })
  }, [details.pressure_washing?.sqft, details.window_cleaning?.sqft, selectedServices])

  // Street View URL — shows the property from the curb (more personal than satellite)
  const streetViewUrl = useMemo(() => {
    if (!contact?.address || !config.googlePlacesApiKey) return null
    // Require at least a comma (indicates city/state present) to avoid bad API calls
    if (!contact.address.includes(',')) return null
    const encoded = encodeURIComponent(contact.address)
    return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encoded}&key=${config.googlePlacesApiKey}`
  }, [contact?.address, config.googlePlacesApiKey])

  const upsellOffers = [];
  if (upsellConfig.enabled !== false && hasHouseWash) {
    if (!hasWindows && windowServiceEnabled && !dismissedUpsells.includes("window_cleaning")) {
      upsellOffers.push({
        id: "window_cleaning",
        name: "Window Cleaning",
        icon: "\u{1FA9F}",
        tagline: upsellDiscount > 0
          ? `Since we're already at your home  - save ${upsellDiscount}% on window cleaning!`
          : "Since we're already at your home, get your windows sparkling too!",
        color: "#059669",
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
      });
    }
    if (!hasGutters && gutterServiceEnabled && !dismissedUpsells.includes("gutter_cleaning")) {
      upsellOffers.push({
        id: "gutter_cleaning",
        name: "Gutter Cleaning",
        icon: "\u{1F327}\u{FE0F}",
        tagline: houseWashSqft > 0
          ? `Based on your home size, we estimate ~${estimateGutterLinearFt(houseWashSqft)} linear ft. ${upsellDiscount > 0 ? `Save ${upsellDiscount}%!` : ""}`
          : `Keep your gutters flowing while we're on-site!${upsellDiscount > 0 ? ` Save ${upsellDiscount}%!` : ""}`,
        color: "#7c3aed",
        bgColor: "#f5f3ff",
        borderColor: "#ddd6fe",
      });
    }
  }

  const handleAcceptUpsell = (svcId) => {
    setSelectedServices((p) => [...p, svcId]);
    setUpsellAccepted((p) => [...p, svcId]);

    // Auto-populate gutter/guard linear ft from best available sqft
    const bestSqft = houseWashSqft || details.window_cleaning?.sqft || 0;
    if ((svcId === "gutter_cleaning" || svcId === "gutter_guard_install") && bestSqft > 0) {
      const estLinFt = estimateGutterLinearFt(bestSqft);
      setDetails((p) => ({
        ...p,
        [svcId]: { ...(p[svcId] || {}), linearFt: estLinFt },
      }));
    }
  };

  const handleDismissUpsell = (svcId) => {
    setDismissedUpsells((p) => [...p, svcId]);
  };

  // --- Pricing (uses shared pricing engine  - no duplication!) ---
  const basePrice = useMemo(
    () => calculateTotalBase(selectedServices, config.services, details, selectedExtras, config.globalPriceAdjustment, globalStories),
    [selectedServices, details, selectedExtras, config, globalStories]
  );

  const seasonalBundle = config.seasonalBundles.find(
    (b) => b.active && b.services.every((sid) => selectedServices.includes(sid)) && new Date(b.endDate) > new Date()
  );

  const bundleDiscount = getDiscountPercent(selectedServices, config.bundleDiscounts, appliedBundle, seasonalBundle);

  const svcPrice = (svcId, packageKey) => {
    const svc = config.services.find((sv) => sv.id === svcId);
    // Defensive: ensure window cleaning gets sqft even if useEffect sync hasn't fired yet
    let svcDetails = details[svcId] || {};
    if (svc?.id === "window_cleaning" && svc.windowTypes && !svcDetails.sqft) {
      const fallbackSqft = details.pressure_washing?.sqft || details.roof_cleaning?.sqft || 0;
      if (fallbackSqft > 0) {
        svcDetails = { ...svcDetails, sqft: fallbackSqft };
      }
    }
    let price = calculateServicePrice(svc, svcDetails, selectedExtras[svcId], config.globalPriceAdjustment, globalStories, packageKey);
    // Apply upsell discount if this service was added via upsell
    if (upsellAccepted.includes(svcId) && upsellDiscount > 0) {
      price = Math.round(price * (1 - upsellDiscount / 100));
    }
    return price;
  };

  // Compute total price using per-service packages
  const totalPrice = () => {
    let total = 0;
    selectedServices.forEach(svcId => {
      const svc = config.services.find(s => s.id === svcId);
      if (!svc) return;
      const pkg = getServicePackage(svcId);
      // Defensive: ensure window cleaning gets sqft even if useEffect sync hasn't fired yet
      let svcDetails = details[svcId] || {};
      if (svc.id === "window_cleaning" && svc.windowTypes && !svcDetails.sqft) {
        const fallbackSqft = details.pressure_washing?.sqft || details.roof_cleaning?.sqft || 0;
        if (fallbackSqft > 0) svcDetails = { ...svcDetails, sqft: fallbackSqft };
      }
      let price = calculateServicePrice(svc, svcDetails, selectedExtras[svcId], config.globalPriceAdjustment, globalStories, svc.hasPackagePricing ? pkg : undefined);
      const pkgMult = svc.hasPackagePricing ? 1 : (config.packages[pkg]?.multiplier || 1);
      price = Math.round(price * pkgMult);
      if (upsellAccepted.includes(svcId) && upsellDiscount > 0) {
        price = Math.round(price * (1 - upsellDiscount / 100));
      }
      total += price;
    });
    if (bundleDiscount > 0) {
      total = Math.round(total * (1 - bundleDiscount / 100));
    }
    return total;
  };

  // Package price for backward compat / "what-if" pricing (all services at one package level)
  const pkgPrice = (pkg) => {
    let total = calculateTotalPackagePrice(
      selectedServices, config.services, details, selectedExtras,
      config.globalPriceAdjustment, globalStories, bundleDiscount,
      pkg, config.packages[pkg].multiplier
    );
    // Calculate upsell savings and subtract from total
    if (upsellAccepted.length > 0 && upsellDiscount > 0) {
      const upsellSavings = upsellAccepted.reduce((sum, svcId) => {
        const svc = config.services.find((sv) => sv.id === svcId);
        if (!svc) return sum;
        const fullPrice = calculateServicePrice(svc, details[svcId], selectedExtras[svcId], config.globalPriceAdjustment, globalStories, pkg);
        const pkgMultiplier = svc.hasPackagePricing ? 1 : (config.packages[pkg]?.multiplier || 1);
        return sum + Math.round(fullPrice * pkgMultiplier * (upsellDiscount / 100));
      }, 0);
      total = Math.max(0, total - upsellSavings);
    }
    return total;
  };

  // --- Helpers ---
  const toggleService = (id) => {
    setSelectedServices((p) => {
      const isRemoving = p.includes(id);
      if (isRemoving) return p.filter((x) => x !== id);

      // Adding a service — auto-populate details from best available sqft
      const bestSqft = details.pressure_washing?.sqft || details.window_cleaning?.sqft || 0;
      if (bestSqft > 0) {
        // Auto-populate sqft for services that need it
        if ((id === "window_cleaning" || id === "roof_cleaning" || id === "pressure_washing") && !details[id]?.sqft) {
          setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), sqft: bestSqft } }));
        }
        // Auto-populate linear ft for gutter services
        if ((id === "gutter_cleaning" || id === "gutter_guard_install") && !details[id]?.linearFt) {
          setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), linearFt: estimateGutterLinearFt(bestSqft) } }));
        }
      }

      return [...p, id];
    });
  };

  const toggleExtra = (svcId, extId) =>
    setSelectedExtras((p) => ({
      ...p,
      [svcId]: (p[svcId] || []).includes(extId)
        ? (p[svcId] || []).filter((x) => x !== extId)
        : [...(p[svcId] || []), extId],
    }));

  const updateDetail = (svcId, key, val) =>
    setDetails((p) => ({ ...p, [svcId]: { ...(p[svcId] || {}), [key]: val } }));

  const next = () => setStep((x) => Math.min(x + 1, 4));
  const back = () => { setStep((x) => Math.max(x - 1, 0)); setValidationErrors({}); };

  const canProceed = () => {
    if (step === 0) return contact.name && contact.email && contact.phone;
    if (step === 1) {
      if (selectedServices.length === 0) return false;
      // Every selected service must have its required measurement filled in
      for (const svcId of selectedServices) {
        const svc = config.services.find((s) => s.id === svcId);
        if (!svc) continue;
        const d = details[svcId] || {};
        // Services priced per square foot need sqft
        if (svc.perSqFt > 0 && !d.sqft) return false;
        // Services priced per linear foot need linearFt
        if ((svc.perLinFt > 0 || (svc.tiers && svc.tiers.length > 0)) && !d.linearFt) return false;
        // Services priced per window need windows (unless using windowTypes picker)
        if (svc.perWindow > 0 && !svc.windowTypes && !d.windows) return false;
        // Window cleaning with windowTypes needs sqft for estimation
        if (svc.id === "window_cleaning" && svc.windowTypes && !d.sqft) return false;
      }
      return true;
    }
    return true;
  };

  const validateContactAndProceed = () => {
    const errors = {};
    if (!contact.name.trim()) errors.name = "Name is required";
    if (!isValidEmail(contact.email)) errors.email = "Please enter a valid email";
    if (!isValidPhone(contact.phone)) errors.phone = "Please enter a valid phone number";
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) return;
    next();
  };

  const submitQuote = () => {
    const newLead = {
      id: Date.now(),
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      address: contact.address || "",
      services: [...selectedServices],
      servicePrices: selectedServices.reduce((acc, svcId) => {
        const svcPkg = getServicePackage(svcId);
        acc[svcId] = svcPrice(svcId, svcPkg);
        return acc;
      }, {}),
      package: selectedPackage,
      servicePackages: { ...servicePackages },
      total: totalPrice(),
      allPackagePrices: {
        standard: pkgPrice("standard"),
        premium: pkgPrice("premium"),
        elite: pkgPrice("platinum"),
      },
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      followUpStep: 0,
      notes: contact.notes || "",
      leadSource: contact.leadSource,
      projectType: contact.projectType,
      photos: customerPhotos.map((p) => ({ ...p })),
    };
    onSubmitLead(newLead);
    clearCustomerProgress();
    next();
  };

  const resetQuote = () => {
    setStep(0);
    setSelectedServices([]);
    setDetails({});
    setSelectedExtras({});
    setServicePackages({});
    setContact({ name: "", email: "", phone: "", address: "", notes: "", leadSource: "", projectType: "residential" });
    setAppliedBundle(null);
    setCustomerPhotos([]);
    setGlobalStories(1);
    setValidationErrors({});
    clearCustomerProgress();
  };

  const stepLabels = ["Your Info", "Services & Details", "Photos", "Your Quote"];

  return (
    <>
      {/* STEP 0: Contact Info (first!) */}
      {step === 0 && (
        <div>
          {/* ── Welcome Hero ── */}
          <div style={{
            background: C.gradient,
            borderRadius: 16,
            padding: "28px 24px 24px",
            marginBottom: 20,
            textAlign: "center",
            color: C.white,
          }}>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
              {config.businessName}
            </h1>
            <p style={{ fontSize: 15, opacity: 0.92, margin: 0 }}>
              Instant online quotes for professional exterior cleaning {config.serviceArea ? `in ${config.serviceArea}` : ""}
            </p>
          </div>

          <TrustGallery config={config} />
          <h2 style={{ ...s.h1, fontSize: 22 }}>Let's get started!</h2>
          <p style={{ color: C.textLight, marginBottom: 24, fontSize: 15 }}>Tell us a bit about yourself so we can build your custom quote.</p>
          <div style={s.card}>
            <div style={s.grid2}>
              {[
                { key: "name", l: "Full Name", p: "John Smith", t: "text" },
                { key: "email", l: "Email", p: "john@example.com", t: "email" },
                { key: "phone", l: "Phone", p: "(555) 123-4567", t: "tel" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={s.label}>{f.l} <span style={{ color: C.danger }}>*</span></label>
                  <input type={f.t} placeholder={f.p} value={contact[f.key]} onChange={(e) => { setContact((c) => ({ ...c, [f.key]: e.target.value })); setValidationErrors((v) => ({ ...v, [f.key]: undefined })); }} style={{ ...s.input, borderColor: validationErrors[f.key] ? C.danger : C.border }} />
                  {validationErrors[f.key] && <div style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{validationErrors[f.key]}</div>}
                </div>
              ))}
              <div>
                <label style={s.label}>Property Address</label>
                <AddressAutocomplete
                  value={contact.address}
                  onChange={(val) => setContact((c) => ({ ...c, address: val }))}
                  style={s.input}
                  placeholder="Start typing an address..."
                  apiKey={config.googlePlacesApiKey}
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>How did you hear about us?</label>
              <select value={contact.leadSource} onChange={(e) => setContact((c) => ({ ...c, leadSource: e.target.value }))} style={s.input}>
                <option value="">Select...</option>
                {config.leadSources.map((src) => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Notes</label>
              <textarea placeholder="Anything we should know about your property..." value={contact.notes} onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))} rows={3} style={{ ...s.input, resize: "vertical", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* ── Trust Badges ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginTop: 20,
          }}>
            {[
              { icon: "\u2705", text: "Fully Insured & Bonded" },
              { icon: "\u{1F3C6}", text: "100% Satisfaction Guarantee" },
              { icon: "\u{1F4C5}", text: "Same-Week Scheduling" },
            ].map((badge) => (
              <div key={badge.text} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                background: C.bgCard,
                borderRadius: 10,
                border: `1px solid ${C.borderLight}`,
                fontSize: 13,
                fontWeight: 600,
                color: C.textMid,
              }}>
                <span style={{ fontSize: 16 }}>{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </div>

          {/* ── Mini FAQ ── */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Common Questions</h3>
            {[
              { q: "How soon can I get scheduled?", a: "Most jobs are scheduled within 3\u20135 business days of your quote request." },
              { q: "What payment methods do you accept?", a: "We accept cards, cash, check, and ACH." },
              { q: "Do I need to be home during the service?", a: "For exterior-only work, nope! You\u2019re free to go about your day. If we need to remove screens or you\u2019re having interior windows done, we\u2019ll need access inside \u2014 some customers give us their garage code." },
              { q: "Is there a satisfaction guarantee?", a: "Absolutely. If you\u2019re not happy with any part of the job, we\u2019ll come back and make it right at no extra charge." },
            ].map((faq) => (
              <details key={faq.q} style={{
                marginBottom: 8,
                background: C.bgCard,
                borderRadius: 10,
                border: `1px solid ${C.borderLight}`,
                overflow: "hidden",
              }}>
                <summary style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  {faq.q}
                  <span style={{ fontSize: 12, color: C.textLight, flexShrink: 0, marginLeft: 8 }}>{"\u25BC"}</span>
                </summary>
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Marketing Banners  - on step 1 (services) */}
      {step === 1 && (
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {config.marketing.showLimitedOffer && (
            <div style={{ padding: "12px 20px", background: "linear-gradient(90deg, #eef4ff, #f0f7ff)", border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u{1F525}"}</span>
              <span style={{ color: C.primaryDark, fontWeight: 600, fontSize: 14 }}>{config.marketing.limitedOfferText}</span>
            </div>
          )}
          {config.marketing.showUrgencyTimer && (
            <div style={{ padding: "14px 20px", background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 12 }}>
              <div style={{ color: "#dc2626", fontWeight: 600, fontSize: 13, textAlign: "center", marginBottom: 10 }}>{config.marketing.urgencyMessage}</div>
              <CountdownTimer endDate={config.marketing.urgencyEndDate} />
            </div>
          )}
          {config.marketing.showSocialProof && (
            <div style={{ padding: "10px 20px", background: C.bgAccent, border: "1px solid #bbf7d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span>{"\u{1F464}"}</span>
              <span style={{ color: C.secondaryDark, fontSize: 13 }}><strong>{config.marketing.socialProofCount} people</strong> requested quotes in your area today</span>
            </div>
          )}
          {config.marketing.showReviewBadge && (
            <div style={{ padding: "10px 20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{"\u2B50"}</span>
              <span style={{ color: "#b45309", fontSize: 13, fontWeight: 600 }}>{config.marketing.reviewAverage} stars</span>
              <span style={{ color: C.textLight, fontSize: 13 }}>from {config.marketing.reviewCount} verified reviews</span>
            </div>
          )}
        </div>
      )}

      {/* Seasonal Bundle Promo */}
      {step === 1 && config.seasonalBundles.filter((b) => b.active && new Date(b.endDate) > new Date()).map((bundle) => (
        <div key={bundle.id} style={{ marginBottom: 20, padding: "20px 24px", background: "linear-gradient(135deg, #eef4ff, #f0fdf4)", border: `2px dashed ${C.primary}60`, borderRadius: 16, cursor: "pointer" }}
          onClick={() => { setSelectedServices(bundle.services.filter((sid) => config.services.find((sv) => sv.id === sid)?.enabled)); setAppliedBundle(bundle.id); }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Badge color={C.accent}>Seasonal Special</Badge>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{bundle.name}</span>
              </div>
              <p style={{ color: C.textMid, fontSize: 13 }}>{bundle.tagline} Save {bundle.discount}%!</p>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.secondaryDark }}>{bundle.discount}% OFF</div>
          </div>
        </div>
      ))}

      {/* STEP 1: Services + Details */}
      {step === 1 && (
        <div>
          <h1 style={s.h1}>Tell us about your project</h1>
          <p style={{ color: C.textLight, marginBottom: 24, fontSize: 15 }}>Select your services and fill in the details. We'll build your custom quote!</p>

          {/* Street view of property — show if address is provided */}
          {streetViewUrl && (
            <div style={{ marginBottom: 24 }}>
              <img src={streetViewUrl} alt="Your property" style={{ width: "100%", maxHeight: 300, borderRadius: 16, border: `1px solid ${C.border}`, objectFit: "cover" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
            </div>
          )}

          {/* Global property info — residential only */}
          <div style={s.card}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: 180 }}>
                <label style={s.label}>Number of Stories</label>
                <select value={globalStories} onChange={(e) => setGlobalStories(Number(e.target.value))} style={s.input}>
                  <option value={1}>1 Story</option>
                  <option value={2}>2 Stories</option>
                  <option value={3}>3+ Stories</option>
                </select>
              </div>
            </div>
            {globalStories >= 2 && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.textLight }}>
                Stories pricing applies to: {SERVICES_WITH_STORIES.map((sid) => config.services.find((sv) => sv.id === sid)?.name).filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          {/* Service cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {enabledServices.map((svc) => {
              const sel = selectedServices.includes(svc.id);
              const d = details[svc.id] || {};
              return (
                <div key={svc.id} style={{ background: C.white, border: `2px solid ${sel ? C.primary : C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: sel ? C.shadowHover : C.shadow, transition: "all 0.2s" }}>
                  <div onClick={() => toggleService(svc.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: sel ? `${C.primary}06` : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${sel ? C.primary : C.border}`, background: sel ? C.gradient : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 14, transition: "all 0.2s" }}>{sel ? "\u2713" : ""}</div>
                      <span style={{ fontSize: 26 }}>{svc.icon}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{svc.name}</div>
                        <div style={{ fontSize: 13, color: C.textLight }}>{svc.description}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sel ? C.primary : C.textMuted, padding: "4px 12px", borderRadius: 8, background: sel ? `${C.primary}10` : C.bgCardAlt }}>{sel ? "Selected" : "Tap to add"}</div>
                  </div>

                  {sel && (
                    <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.borderLight}` }}>
                      {/* Tier selector for tiered services (e.g. Gutter Guard Installation) */}
                      {svc.tiers && svc.tiers.length > 0 && (
                        <div style={{ paddingTop: 16, marginBottom: 12 }}>
                          <label style={s.label}>Service Level</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {svc.tiers.map((tier) => {
                              const isActive = (d.selectedTier || svc.tiers[0].id) === tier.id;
                              return (
                                <div key={tier.id} onClick={() => updateDetail(svc.id, "selectedTier", tier.id)}
                                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, border: `2px solid ${isActive ? C.primary : C.border}`, background: isActive ? `${C.primary}08` : C.white, cursor: "pointer", transition: "all 0.2s" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isActive ? C.primary : C.border}`, background: isActive ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.white }} />}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? C.primary : C.text }}>{tier.label}</div>
                                      <div style={{ fontSize: 12, color: C.textLight }}>{tier.description}</div>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? C.primary : C.textMid }}>{isActive ? "\u2713 Selected" : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Window cleaning: sq ft input + window type selector */}
                      {svc.id === "window_cleaning" && svc.windowTypes && (
                        <div style={{ paddingTop: 16 }}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={s.label}>Home Square Footage</label>
                            <input type="number" placeholder="e.g. 2000" value={d.sqft || ""} onChange={(e) => updateDetail(svc.id, "sqft", Math.max(0, Number(e.target.value)))} style={s.input} />
                            {d.sqft > 0 && (
                              <div style={{ marginTop: 6, fontSize: 12, color: C.textLight }}>
                                Estimated windows: ~{getEstimatedWindows(d.sqft, svc.windowsPerSqFt)} (based on WI home averages)
                              </div>
                            )}
                          </div>
                          <label style={s.label}>Window Type</label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                            {svc.windowTypes.map((wt) => {
                              const isActive = (d.windowType || "casement") === wt.id;
                              return (
                                <div key={wt.id} onClick={() => updateDetail(svc.id, "windowType", wt.id)}
                                  style={{ padding: "14px 12px", borderRadius: 14, border: `2px solid ${isActive ? C.primary : C.border}`, background: isActive ? `${C.primary}08` : C.white, cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}>
                                  <WindowTypeSVG type={wt.id} active={isActive} />
                                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? C.primary : C.text, marginTop: 8 }}>{wt.label}</div>
                                  <div style={{ fontSize: 11, color: C.textLight, marginTop: 2, lineHeight: 1.3 }}>{wt.description}</div>
                                  {isActive && <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginTop: 6 }}>{"\u2713"} Selected</div>}
                                  {wt.id === "combination" && isActive && (
                                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e", lineHeight: 1.4 }}>
                                      Storm windows often require an onsite estimate for accurate pricing. <a href="tel:+19205634101" style={{ color: "#b45309", fontWeight: 700 }}>Call (920) 563-4101</a> for a free quote.
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Door count question */}
                          {svc.doorPrice && (
                            <div style={{ marginTop: 16 }}>
                              <label style={s.label}>How many glass doors need cleaning? <span style={{ fontWeight: 400, color: C.textLight }}>(sliding, French, storm doors)</span></label>
                              <input type="number" placeholder="0" value={d.doors || ""} onChange={(e) => updateDetail(svc.id, "doors", Math.max(0, Number(e.target.value)))} style={{ ...s.input, maxWidth: 120 }} />
                              {d.doors > 0 && <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{d.doors} door{d.doors > 1 ? "s" : ""}</div>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Standard numeric inputs (non-window-cleaning services) */}
                      {!(svc.id === "window_cleaning" && svc.windowTypes) && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, paddingTop: svc.tiers ? 0 : 16 }}>
                          {svc.perSqFt > 0 && <div><label style={s.label}>Square Footage</label><input type="number" placeholder="e.g. 1500" value={d.sqft || ""} onChange={(e) => updateDetail(svc.id, "sqft", Math.max(0, Number(e.target.value)))} style={s.input} /></div>}
                          {svc.perWindow > 0 && !svc.windowTypes && <div><label style={s.label}>Number of Windows</label><input type="number" placeholder="e.g. 20" value={d.windows || ""} onChange={(e) => updateDetail(svc.id, "windows", Math.max(0, Number(e.target.value)))} style={s.input} /></div>}
                          {(svc.perLinFt > 0 || (svc.tiers && svc.tiers.length > 0)) && <div><label style={s.label}>Linear Feet of Gutters</label><input type="number" placeholder="e.g. 150" value={d.linearFt || ""} onChange={(e) => updateDetail(svc.id, "linearFt", Math.max(0, Number(e.target.value)))} style={s.input} />{d.linearFt > 0 && (details.pressure_washing?.sqft || details.window_cleaning?.sqft) ? <div style={{ marginTop: 4, fontSize: 11, color: C.textLight }}>{"\u{2139}\u{FE0F}"} Estimated from your home size — adjust if needed</div> : null}</div>}
                        </div>
                      )}

                      {/* Condition questions (e.g. gutter cleaning) */}
                      {svc.conditionQuestions && svc.conditionQuestions.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <label style={s.label}>Property Conditions</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {svc.conditionQuestions.map((q) => {
                              const checked = d.conditions?.[q.id] || false;
                              return (
                                <div key={q.id} onClick={() => updateDetail(svc.id, "conditions", { ...(d.conditions || {}), [q.id]: !checked })}
                                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1px solid ${checked ? C.accent : C.border}`, background: checked ? `${C.accent}08` : C.white, cursor: "pointer", transition: "all 0.2s" }}>
                                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 13, flexShrink: 0 }}>{checked ? "\u2713" : ""}</div>
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: checked ? C.accent : C.text }}>{q.label}</span>
                                  </div>
                                  <span style={{ fontSize: 12, color: C.textLight }}></span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Per-service package picker */}
                      <div style={{ marginTop: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                          Service Level for {svc.name}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["standard", "premium", "platinum"].map(pkgKey => {
                            // Skip platinum for services with maxTier: "premium"
                            if (svc.maxTier === "premium" && pkgKey === "platinum") return null;
                            const pkg = config.packages[pkgKey];
                            if (!pkg) return null;
                            const isActive = getServicePackage(svc.id) === pkgKey;
                            return (
                              <button key={pkgKey} onClick={(e) => { e.stopPropagation(); setServicePackage(svc.id, pkgKey); }}
                                style={{
                                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                                  border: `2px solid ${isActive ? (pkg.color || C.primary) : C.border}`,
                                  background: isActive ? (pkg.color || C.primary) : C.white,
                                  color: isActive ? "#fff" : C.textMid,
                                  fontSize: 12, fontWeight: 700, transition: "all 0.2s",
                                  textAlign: "center",
                                }}>
                                {pkg.label}
                                {pkg.popular && !isActive && <span style={{ display: "block", fontSize: 9, fontWeight: 600, color: C.textLight }}>Popular</span>}
                              </button>
                            );
                          })}
                        </div>
                        {svc.tierFeatures?.[getServicePackage(svc.id)] && (
                          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: `${(config.packages[getServicePackage(svc.id)]?.color || C.primary)}10`, border: `1px solid ${(config.packages[getServicePackage(svc.id)]?.color || C.primary)}30` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: config.packages[getServicePackage(svc.id)]?.color || C.primary, marginBottom: 3 }}>
                              {config.packages[getServicePackage(svc.id)]?.label} — What's Included:
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                              {svc.tierFeatures[getServicePackage(svc.id)]}
                            </div>
                          </div>
                        )}
                      </div>

                      {svc.extras && svc.extras.length > 0 && (() => {
                        const tierOrder = ["standard", "premium", "platinum"];
                        const currentPkgForService = getServicePackage(svc.id);
                        const availableExtras = svc.extras.filter((ext) => {
                          if (!ext.minPackage) return true;
                          return tierOrder.indexOf(currentPkgForService) >= tierOrder.indexOf(ext.minPackage);
                        });
                        if (availableExtras.length === 0) return null;
                        return (
                          <div style={{ marginTop: 12 }}>
                            <label style={s.label}>Add-Ons</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {availableExtras.map((ext) => {
                                const a = (selectedExtras[svc.id] || []).includes(ext.id);
                                return <button key={ext.id} onClick={() => toggleExtra(svc.id, ext.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${a ? C.primary : C.border}`, background: a ? `${C.primary}12` : C.white, color: a ? C.primary : C.textMid, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{a ? "\u2713 " : "+ "}{ext.label}</button>;
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>


          {bundleDiscount > 0 && (
            <div style={{ marginTop: 20, padding: "20px 24px", background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)", border: "2px solid #86efac", borderRadius: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>{bundleDiscount}%</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>
                  {appliedBundle && seasonalBundle ? seasonalBundle.name : "Bundle Discount!"}
                </div>
                <div style={{ fontSize: 14, color: "#166534", marginTop: 2 }}>
                  {"\u{1F389}"} {selectedServices.length} services selected  - saving you {bundleDiscount}%
                </div>
              </div>
            </div>
          )}

          {/* Smart Cascade Upsell  - triggered when House Washing is selected */}
          {upsellOffers.length > 0 && (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {"\u{1F4A1}"} Recommended Add-Ons
              </div>
              {upsellOffers.map((offer) => (
                <div key={offer.id} style={{
                  background: offer.bgColor, border: `2px solid ${offer.borderColor}`,
                  borderRadius: 16, padding: "16px 20px", overflow: "hidden",
                  animation: "slideUp 0.4s ease-out",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{offer.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: offer.color }}>Add {offer.name}?</span>
                        {upsellDiscount > 0 ? (
                          <span style={{ padding: "2px 8px", borderRadius: 8, background: offer.color, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                            Save {upsellDiscount}%!
                          </span>
                        ) : selectedServices.length >= 1 ? (
                          <span style={{ padding: "2px 8px", borderRadius: 8, background: `${offer.color}15`, color: offer.color, fontSize: 11, fontWeight: 700 }}>
                            Bundle & Save!
                          </span>
                        ) : null}
                      </div>
                      <p style={{ fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                        {offer.tagline}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => handleAcceptUpsell(offer.id)} style={{
                        padding: "10px 20px", borderRadius: 10,
                        background: offer.color, color: "#fff", border: "none",
                        cursor: "pointer", fontWeight: 800, fontSize: 14,
                        transition: "transform 0.2s",
                      }}>
                        Yes, Add It!
                      </button>
                      <button onClick={() => handleDismissUpsell(offer.id)} style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: "transparent", color: C.textLight,
                        border: `1px solid ${C.border}`, cursor: "pointer",
                        fontSize: 13, fontWeight: 600,
                      }}>
                        No thanks
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Photos */}
      {step === 2 && (
        <div>
          <h1 style={s.h1}>{"\u{1F4F7}"} Upload Photos</h1>
          <p style={{ color: C.textLight, marginBottom: 24, fontSize: 15 }}>Photos help us see the job and give you a more accurate quote!</p>
          <div style={s.card}>
            <PhotoUploader photos={customerPhotos} onPhotosChange={setCustomerPhotos} label="Property Photos (optional but recommended!)" maxPhotos={10} />
            <div style={{ marginTop: 16, padding: 16, background: C.bgCardAlt, borderRadius: 12, border: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Tips for great photos:</div>
              <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.8 }}>
                {"\u2022"} Wide shots of the full area to be cleaned{"\n"}
                {"\u2022"} Close-ups of problem areas (stains, moss, damage){"\n"}
                {"\u2022"} Hard-to-reach spots or obstacles{"\n"}
                {"\u2022"} Natural daylight gives the clearest results
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Submit — clean sales flow: selections → big price → trust → submit */}
      {step === 3 && (
        <div>
          <h1 style={s.h1}>Your Instant Quote</h1>
          <p style={{ color: C.textLight, marginBottom: 24, fontSize: 15 }}>Here's your personalized price based on your property details.</p>

          {/* Street view on review page */}
          {streetViewUrl && (
            <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
              <img src={streetViewUrl} alt="Your property" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
              <div style={{ padding: "10px 16px", background: C.white, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{"\u{1F4CD}"}</span>
                <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{contact.address}</span>
              </div>
            </div>
          )}


          {/* THE BIG PRICE — hero moment of the entire flow */}
          <div style={{
            marginBottom: 24,
            padding: "32px 24px",
            background: `linear-gradient(135deg, ${C.primary}08, ${C.primary}15)`,
            border: `2px solid ${C.primary}30`,
            borderRadius: 20,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textMid, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Your Quote</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.primary, lineHeight: 1.1 }}>{fmt(totalPrice())}</div>
            <div style={{ fontSize: 14, color: C.textMid, marginTop: 8 }}>
              {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} included
            </div>
            {bundleDiscount > 0 && (
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, background: "#f0fdf4", border: "1px solid #86efac" }}>
                <span style={{ fontSize: 14 }}>{"\u{1F389}"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{bundleDiscount}% bundle discount applied!</span>
              </div>
            )}
          </div>

          {/* Owner intro video — builds trust between price and breakdown */}
          {config.showOwnerVideo && config.ownerVideoUrl && (() => {
            // Parse YouTube/Vimeo URLs into embed URLs
            const url = config.ownerVideoUrl
            let embedUrl = null
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
            if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
            else if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
            else if (url.endsWith('.mp4') || url.includes('.mp4')) embedUrl = url

            if (!embedUrl) return null
            const isDirectVideo = embedUrl.endsWith('.mp4') || embedUrl.includes('.mp4')

            return (
              <div style={{ ...s.card, marginBottom: 20, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 24px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{"\u{1F3AC}"}</span>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>A Message From {config.businessName || "Our Team"}</h4>
                </div>
                <div style={{ position: "relative", paddingBottom: isDirectVideo ? "auto" : "56.25%", height: isDirectVideo ? "auto" : 0 }}>
                  {isDirectVideo ? (
                    <video controls style={{ width: "100%", display: "block" }} preload="metadata">
                      <source src={embedUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <iframe
                      src={embedUrl}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Owner introduction"
                    />
                  )}
                </div>
              </div>
            )
          })()}

          {/* Services included — show price per service, but NOT how it was calculated */}
          <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px 12px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>What's Included</h3>
            </div>
            {selectedServices.map((svcId) => {
              const svc = config.services.find((s) => s.id === svcId);
              if (!svc) return null;
              const svcPkg = getServicePackage(svcId);
              const pkg = config.packages[svcPkg];
              const baseServicePrice = svcPrice(svcId, svc.hasPackagePricing ? svcPkg : undefined);
              const pkgMult = svc.hasPackagePricing ? 1 : (config.packages[svcPkg]?.multiplier || 1);
              const price = Math.round(baseServicePrice * pkgMult);
              const tierLabel = svc.tierFeatures?.[svcPkg];
              return (
                <div key={svcId} style={{ padding: "12px 24px", borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{svc.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{svc.name}</div>
                        {tierLabel && <div style={{ fontSize: 12, color: C.textLight, marginTop: 1 }}>{tierLabel}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmt(price)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pkg.color || C.primary, background: `${pkg.color || C.primary}10`, padding: "2px 8px", borderRadius: 10 }}>{pkg?.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {bundleDiscount > 0 && (
              <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.borderLight}`, background: "#f0fdf4" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{"\u{1F389}"} Bundle discount ({bundleDiscount}%)</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Saving {bundleDiscount}%!</span>
                </div>
              </div>
            )}

            {/* Property summary row */}
            <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.borderLight}`, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.textMid, padding: "3px 8px", background: C.bgSoft, borderRadius: 6 }}>
{"\u{1F3E1} Residential"}
              </span>
              <span style={{ fontSize: 11, color: C.textMid, padding: "3px 8px", background: C.bgSoft, borderRadius: 6 }}>
                {globalStories === 1 ? "1 Story" : globalStories === 2 ? "2 Stories" : "3+ Stories"}
              </span>
              {customerPhotos.length > 0 && (
                <span style={{ fontSize: 11, color: C.textMid, padding: "3px 8px", background: C.bgSoft, borderRadius: 6 }}>
                  {"\u{1F4F7}"} {customerPhotos.length} photo{customerPhotos.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* National Average Price Comparison */}
          <div style={{ ...s.card, marginTop: 20, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px 12px", borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{"\u{1F4CA}"}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>How Your Quote Compares</h4>
              </div>
              <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>Your price vs. national averages</p>
            </div>
            {selectedServices.map((svcId) => {
              const svc = config.services.find((sv) => sv.id === svcId)
              const avg = NATIONAL_AVERAGES[svcId]
              if (!svc || !avg) return null
              // Use the same package-adjusted price the customer actually sees
              const svcPkg = getServicePackage(svcId)
              const baseP = svcPrice(svcId, svc.hasPackagePricing ? svcPkg : undefined)
              const pkgMult = svc.hasPackagePricing ? 1 : (config.packages[svcPkg]?.multiplier || 1)
              const price = Math.round(baseP * pkgMult)
              if (price <= 0) return null
              const range = avg.high - avg.low
              const position = Math.min(100, Math.max(0, ((price - avg.low) / range) * 100))
              const isGoodValue = price <= avg.low + range * 0.5
              return (
                <div key={svcId} style={{ padding: "14px 24px", borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{svc.icon} {avg.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{fmt(price)}</span>
                      {isGoodValue && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 10, border: "1px solid #bbf7d0" }}>Great value</span>
                      )}
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg, #bbf7d0, #fde68a, #fecaca)", overflow: "visible", position: "relative" }}>
                      <div style={{ position: "absolute", left: `${Math.min(96, Math.max(2, position))}%`, top: "50%", transform: "translate(-50%, -50%)", width: 18, height: 18, borderRadius: "50%", background: C.white, border: `3px solid ${C.primary}`, boxShadow: "0 1px 6px rgba(0,0,0,0.15)", zIndex: 2 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: C.textLight }}>{fmt(avg.low)}</span>
                      <span style={{ fontSize: 10, color: C.textLight }}>National avg range</span>
                      <span style={{ fontSize: 10, color: C.textLight }}>{fmt(avg.high)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* What Happens Next */}
          <div style={{ ...s.card, marginTop: 20, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px 12px", borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{"\u{1F4CB}"}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>What Happens Next</h4>
              </div>
              <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>Here's how we turn this quote into a sparkling clean home</p>
            </div>
            <div style={{ padding: "14px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "\u{1F4DE}", text: "We'll reach out to confirm your details and schedule a convenient time" },
                { icon: "\u{1F50D}", text: "Quick on-site walkthrough to finalize the scope and provide your exact price" },
                { icon: "\u2728", text: "Our crew arrives, does the work, and walks you through the results" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{step.icon}</span>
                  <span style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u2705"}</span>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.4 }}>
                <strong>Quote locked in.</strong> We honor this quote for 30 days.
              </div>
            </div>
            <div style={{ padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u{1F512}"}</span>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.4 }}>
                <strong>No hidden fees.</strong> Final pricing confirmed at your free on-site walkthrough.
              </div>
            </div>
            <div style={{ padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u{2B50}"}</span>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.4 }}>
                <strong>100% satisfaction guaranteed</strong> or we'll make it right.
              </div>
            </div>
          </div>

          {/* Submit button — big, prominent, action-oriented */}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button
              onClick={submitQuote}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "18px 40px",
                borderRadius: 14,
                background: C.gradient,
                color: C.white,
                border: "none",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(59,156,255,0.3)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.03)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              Lock In My Price
            </button>
            <span style={{ fontSize: 12, color: C.textLight }}>No payment required. We'll reach out to schedule your service.</span>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 40, color: C.white }}>{"\u2713"}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Quote Submitted!</h1>
          <p style={{ color: C.textMid, fontSize: 16, maxWidth: 480, margin: "0 auto 28px" }}>Thanks, {contact.name}! Your quote request has been received. We'll follow up within 24 hours.</p>
                    <button onClick={resetQuote} style={s.btnSecondary}>Start a New Quote</button>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.borderLight}` }}>
          <button onClick={back} disabled={step === 0} style={{ ...s.btnSecondary, color: step === 0 ? C.borderLight : C.textMid, borderColor: step === 0 ? C.borderLight : C.border, cursor: step === 0 ? "default" : "pointer" }}>Back</button>
          <button
            onClick={() => { if (step === 0) validateContactAndProceed(); else if (step === 3) submitQuote(); else next(); }}
            disabled={!canProceed()}
            style={{ ...s.btnPrimary, background: canProceed() ? C.gradient : C.bgDark, color: canProceed() ? C.white : C.textLight, cursor: canProceed() ? "pointer" : "default", boxShadow: canProceed() ? "0 4px 16px rgba(59,156,255,0.25)" : "none" }}
          >
            {step === 0 ? "Continue" : step === 2 ? "See My Quote" : step === 3 ? "Submit Quote" : "Continue"}
          </button>
        </div>
      )}

      {/* Expose step for parent header */}
      <StepExposer step={step} stepLabels={stepLabels} />
    </>
  );
}

// This is a trick to let the parent read current step for the header stepper
// In a real app you'd use context or lift state up  - but this keeps things simple
function StepExposer() {
  return null; // No-op; parent manages its own step display via view state
}
