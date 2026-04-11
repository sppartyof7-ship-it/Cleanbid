import { useMemo } from "react";
import C from "../config/colors";
import s from "../config/styles";
import { SERVICES_WITH_STORIES } from "../config/defaults";
import { fmt } from "../utils/helpers";

/**
 * Typical premium service price ranges for exterior cleaning (2026).
 * Adjusted +25% from base national averages (Angi, HomeGuide, HomeAdvisor,
 * Thumbtack) to reflect full-service, insured, professional-grade work —
 * not bare-bones or DIY-adjacent pricing that dominates online aggregators.
 */
const NATIONAL_AVERAGES = {
  pressure_washing: { low: 313, high: 750, label: "House Washing" },
  window_cleaning: { low: 188, high: 650, label: "Window Cleaning" },
  deck_cleaning: { low: 125, high: 438, label: "Deck Cleaning" },
  concrete_cleaning: { low: 125, high: 438, label: "Concrete Cleaning" },
  roof_cleaning: { low: 313, high: 750, label: "Roof Cleaning" },
  gutter_cleaning: { low: 149, high: 293, label: "Gutter Cleaning" },
  gutter_guard_install: { low: 1313, high: 2813, label: "Gutter Guards" },
};

/**
 * PriceBreakdown — Simple, clean pricing with national average comparison.
 * Shows customers where their quote falls vs. what others pay nationally.
 */
export default function PriceBreakdown({
  selectedServices,
  config,
  details,
  selectedExtras,
  globalStories,
  svcPrice,
  bundleDiscount,
  basePrice,
  selectedPackage,
  pkgPrice,
  contact,
}) {
  // Google Street View image — shows property from the curb
  const streetViewUrl = useMemo(() => {
    if (!contact?.address || !config.googlePlacesApiKey) return null;
    const encoded = encodeURIComponent(contact.address);
    return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encoded}&key=${config.googlePlacesApiKey}`;
  }, [contact?.address, config.googlePlacesApiKey]);

  return (
    <div>
      {/* Street view of property */}
      {streetViewUrl && (
        <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
          <img
            src={streetViewUrl}
            alt="Your property"
            style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
          <div style={{ padding: "10px 16px", background: C.white, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{"\u{1F4CD}"}</span>
            <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{contact.address}</span>
          </div>
        </div>
      )}

      {/* Service line items */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px" }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Quote Summary</h4>
        </div>

        {selectedServices.map((svcId) => {
          const svc = config.services.find((sv) => sv.id === svcId);
          if (!svc) return null;
          // For services with per-package pricing (windows), show the package-specific price
          const price = svc.hasPackagePricing ? svcPrice(svcId, selectedPackage) : svcPrice(svcId);
          return (
            <div key={svcId} style={{ padding: "10px 24px", borderTop: `1px solid ${C.borderLight}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: C.textMid }}>
                  {svc.icon} {svc.name}
                  {svc.hasPackagePricing && <span style={{ fontSize: 11, color: C.textLight }}> ({config.packages[selectedPackage]?.label})</span>}
                  {SERVICES_WITH_STORIES.includes(svcId) && globalStories >= 2 ? ` (${globalStories}-story)` : ""}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(price)}</span>
              </div>
            </div>
          );
        })}

        {bundleDiscount > 0 && (
          <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.borderLight}`, background: "#f0fdf4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#16a34a", fontWeight: 600 }}>Bundle discount ({bundleDiscount}%)</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{"\u2212"}{fmt(basePrice * bundleDiscount / 100)}</span>
            </div>
          </div>
        )}

        {selectedPackage !== "standard" && (
          <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.borderLight}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.textLight }}>{config.packages[selectedPackage].label} package</span>
            </div>
          </div>
        )}

        <div style={{ padding: "16px 24px", borderTop: `2px solid ${C.primary}20`, background: `${C.primary}06` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Your Quote</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{fmt(pkgPrice(selectedPackage))}</span>
          </div>
        </div>
      </div>

      {/* National Average Price Comparison */}
      <div style={{ ...s.card, marginTop: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px 12px", borderBottom: `1px solid ${C.borderLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"\u{1F4CA}"}</span>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>How Your Quote Compares</h4>
          </div>
          <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>Your price vs. typical premium service range</p>
          <p style={{ fontSize: 10, color: C.textLight, margin: "4px 0 0", lineHeight: 1.4, fontStyle: "italic" }}>Lower online averages often exclude full service, guarantees, and professional-grade cleaning.</p>
        </div>

        {selectedServices.map((svcId) => {
          const svc = config.services.find((sv) => sv.id === svcId);
          const avg = NATIONAL_AVERAGES[svcId];
          if (!svc || !avg) return null;
          const price = svcPrice(svcId);
          if (price <= 0) return null;

          const range = avg.high - avg.low;
          const position = Math.min(100, Math.max(0, ((price - avg.low) / range) * 100));
          const isGoodValue = price <= avg.low + range * 0.5;

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

              {/* Comparison bar */}
              <div style={{ position: "relative" }}>
                <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg, #bbf7d0, #fde68a, #fecaca)`, overflow: "visible", position: "relative" }}>
                  {/* Your price marker */}
                  <div style={{
                    position: "absolute",
                    left: `${Math.min(96, Math.max(2, position))}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: C.white,
                    border: `3px solid ${C.primary}`,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
                    zIndex: 2,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: C.textLight }}>{fmt(avg.low)}</span>
                  <span style={{ fontSize: 10, color: C.textLight }}>Typical premium range</span>
                  <span style={{ fontSize: 10, color: C.textLight }}>{fmt(avg.high)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust note */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{"\u{1F512}"}</span>
        <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.5 }}>
          <strong style={{ color: C.textMid }}>No surprises.</strong> This is your price. If the actual job scope differs from what you described, we'll discuss any changes with you first.
        </div>
      </div>
    </div>
  );
}
