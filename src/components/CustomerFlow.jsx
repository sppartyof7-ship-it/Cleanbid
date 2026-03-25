import { useState, useMemo } from "react";
import C from "../config/colors";
import s from "../config/styles";
import { SERVICES_WITH_STORIES } from "../config/defaults";
import { fmt, isValidEmail, isValidPhone } from "../utils/helpers";
import { calculateServicePrice, calculateTotalBase, getDiscountPercent, getPackagePrice, getEstimatedWindows } from "../utils/pricing";
import Badge from "./Badge";
import CountdownTimer from "./CountdownTimer";
import PhotoUploader from "./PhotoUploader";
import AddressAutocomplete from "./AddressAutocomplete";
import TrustGallery from "./TrustGallery";
import PriceBreakdown from "./PriceBreakdown";

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
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [details, setDetails] = useState({});
  const [selectedExtras, setSelectedExtras] = useState({});
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [contact, setContact] = useState({
    name: "", email: "", phone: "", address: "", notes: "", leadSource: "", projectType: "residential",
  });
  const [appliedBundle, setAppliedBundle] = useState(null);
  const [globalStories, setGlobalStories] = useState(1);
  const [customerPhotos, setCustomerPhotos] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const enabledServices = config.services.filter((sv) => sv.enabled);

  // --- Pricing (uses shared pricing engine — no duplication!) ---
  const basePrice = useMemo(
    () => calculateTotalBase(selectedServices, config.services, details, selectedExtras, config.globalPriceAdjustment, globalStories),
    [selectedServices, details, selectedExtras, config, globalStories]
  );

  const seasonalBundle = config.seasonalBundles.find(
    (b) => b.active && b.services.every((sid) => selectedServices.includes(sid)) && new Date(b.endDate) > new Date()
  );

  const bundleDiscount = getDiscountPercent(selectedServices, config.bundleDiscounts, appliedBundle, seasonalBundle);

  const svcPrice = (svcId) => {
    const svc = config.services.find((sv) => sv.id === svcId);
    return calculateServicePrice(svc, details[svcId], selectedExtras[svcId], config.globalPriceAdjustment, globalStories);
  };

  const pkgPrice = (pkg) => getPackagePrice(basePrice, bundleDiscount, config.packages[pkg].multiplier);

  // --- Helpers ---
  const toggleService = (id) =>
    setSelectedServices((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

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
    if (step === 1) return selectedServices.length > 0;
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
        acc[svcId] = svcPrice(svcId);
        return acc;
      }, {}),
      package: selectedPackage,
      total: pkgPrice(selectedPackage),
      allPackagePrices: {
        basic: pkgPrice("basic"),
        standard: pkgPrice("standard"),
        premium: pkgPrice("premium"),
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
    next();
  };

  const resetQuote = () => {
    setStep(0);
    setSelectedServices([]);
    setDetails({});
    setSelectedExtras({});
    setSelectedPackage("standard");
    setContact({ name: "", email: "", phone: "", address: "", notes: "", leadSource: "", projectType: "residential" });
    setAppliedBundle(null);
    setCustomerPhotos([]);
    setGlobalStories(1);
    setValidationErrors({});
  };

  const stepLabels = ["Your Info", "Services & Details", "Photos", "Your Quote"];

  return (
    <>
      {/* STEP 0: Contact Info (first!) */}
      {step === 0 && (
        <div>
          <TrustGallery config={config} />
          <h1 style={s.h1}>Let's get started!</h1>
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
        </div>
      )}

      {/* Marketing Banners — on step 1 (services) */}
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

          {/* Global property info */}
          <div style={s.card}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={s.label}>Project Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["residential", "commercial"].map((t) => (
                    <button key={t} onClick={() => setContact((c) => ({ ...c, projectType: t }))}
                      style={{ padding: "8px 20px", borderRadius: 10, border: `1px solid ${contact.projectType === t ? C.primary : C.border}`, background: contact.projectType === t ? `${C.primary}12` : C.white, color: contact.projectType === t ? C.primary : C.textMid, fontSize: 14, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                      {t === "residential" ? "\u{1F3E1}" : "\u{1F3E2}"} {t}
                    </button>
                  ))}
                </div>
              </div>
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
                                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? C.primary : C.textMid }}>{isActive ? "✓ Selected" : ""}</div>
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
                                  {isActive && <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginTop: 6 }}>✓ Selected</div>}
                                  {wt.id === "combination" && isActive && (
                                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e", lineHeight: 1.4 }}>
                                      Storm windows often require an onsite estimate for accurate pricing. <a href="tel:+19205634101" style={{ color: "#b45309", fontWeight: 700 }}>Call (920) 563-4101</a> for a free quote.
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Standard numeric inputs (non-window-cleaning services) */}
                      {!(svc.id === "window_cleaning" && svc.windowTypes) && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, paddingTop: svc.tiers ? 0 : 16 }}>
                          {svc.perSqFt > 0 && <div><label style={s.label}>Square Footage</label><input type="number" placeholder="e.g. 1500" value={d.sqft || ""} onChange={(e) => updateDetail(svc.id, "sqft", Math.max(0, Number(e.target.value)))} style={s.input} /></div>}
                          {svc.perWindow > 0 && !svc.windowTypes && <div><label style={s.label}>Number of Windows</label><input type="number" placeholder="e.g. 20" value={d.windows || ""} onChange={(e) => updateDetail(svc.id, "windows", Math.max(0, Number(e.target.value)))} style={s.input} /></div>}
                          {(svc.perLinFt > 0 || (svc.tiers && svc.tiers.length > 0)) && <div><label style={s.label}>Linear Feet of Gutters</label><input type="number" placeholder="e.g. 150" value={d.linearFt || ""} onChange={(e) => updateDetail(svc.id, "linearFt", Math.max(0, Number(e.target.value)))} style={s.input} /></div>}
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

                      {svc.extras && svc.extras.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <label style={s.label}>Add-Ons</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {svc.extras.map((ext) => {
                              const a = (selectedExtras[svc.id] || []).includes(ext.id);
                              return <button key={ext.id} onClick={() => toggleExtra(svc.id, ext.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${a ? C.primary : C.border}`, background: a ? `${C.primary}12` : C.white, color: a ? C.primary : C.textMid, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{a ? "\u2713 " : "+ "}{ext.label}</button>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {bundleDiscount > 0 && (
            <div style={{ marginTop: 16, padding: "12px 20px", background: C.bgAccent, border: "1px solid #bbf7d0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u{1F389}"}</span>
              <span style={{ color: C.secondaryDark, fontWeight: 600, fontSize: 14 }}>
                {appliedBundle && seasonalBundle ? `${seasonalBundle.name}: ${bundleDiscount}% off!` : `Bundle Discount: ${bundleDiscount}% off for ${selectedServices.length} services!`}
              </span>
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

      {/* STEP 3: Quote + Submit */}
      {step === 3 && (
        <div>
          <h1 style={s.h1}>Here's your custom quote!</h1>
          <p style={{ color: C.textLight, marginBottom: 24, fontSize: 15 }}>Choose the package that fits your needs, then submit to lock in your price.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {Object.entries(config.packages).map(([key, pkg]) => {
              const price = pkgPrice(key);
              const act = selectedPackage === key;
              const pkgColor = key === "basic" ? C.textMid : key === "standard" ? C.primary : C.accent;
              return (
                <div key={key} onClick={() => setSelectedPackage(key)} style={{ background: act ? `${pkgColor}08` : C.white, border: `2px solid ${act ? pkgColor : C.border}`, borderRadius: 20, padding: 28, cursor: "pointer", transition: "all 0.2s", transform: act ? "scale(1.03)" : "scale(1)", position: "relative", boxShadow: act ? C.shadowHover : C.shadow }}>
                  {pkg.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.gradient, color: C.white, fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, textTransform: "uppercase" }}>Most Popular</div>}
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: pkgColor, marginBottom: 4 }}>{pkg.label}</h3>
                  <p style={{ fontSize: 13, color: C.textLight, marginBottom: 20 }}>{pkg.tag}</p>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 4 }}>{fmt(price)}</div>
                  {bundleDiscount > 0 && <div style={{ fontSize: 12, color: C.secondaryDark, marginBottom: 16 }}>Includes {bundleDiscount}% discount</div>}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {(pkg.features || []).map((item, i) => <li key={i} style={{ padding: "6px 0", fontSize: 14, color: C.textMid, display: "flex", gap: 8 }}><span style={{ color: pkgColor }}>{"\u2713"}</span>{item}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Transparent Pricing Breakdown — ClouteBid's differentiator */}
          <div style={{ marginTop: 24 }}>
            <PriceBreakdown
              selectedServices={selectedServices}
              config={config}
              details={details}
              selectedExtras={selectedExtras}
              globalStories={globalStories}
              svcPrice={svcPrice}
              bundleDiscount={bundleDiscount}
              basePrice={basePrice}
              selectedPackage={selectedPackage}
              pkgPrice={pkgPrice}
              contact={contact}
            />
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 40, color: C.white }}>{"\u2713"}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Quote Submitted!</h1>
          <p style={{ color: C.textMid, fontSize: 16, maxWidth: 480, margin: "0 auto 28px" }}>Thanks, {contact.name}! Your quote for {fmt(pkgPrice(selectedPackage))} has been received. We'll follow up within 24 hours.</p>
          {config.followUp.enabled && (
            <div style={{ ...s.card, maxWidth: 500, margin: "0 auto 24px", textAlign: "left" }}>
              <h4 style={{ ...s.label, marginBottom: 12 }}>What happens next</h4>
              {config.followUp.sequences.filter((sq) => sq.active).map((sq, i) => (
                <div key={sq.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: C.textMid }}><Badge color={sq.type === "sms" ? C.secondary : C.primary}>{sq.type}</Badge> {sq.delay}</span>
                </div>
              ))}
            </div>
          )}
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
// In a real app you'd use context or lift state up — but this keeps things simple
function StepExposer() {
  return null; // No-op; parent manages its own step display via view state
}
