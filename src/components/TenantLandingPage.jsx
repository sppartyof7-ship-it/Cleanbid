import { useState, useEffect } from "react";
import C from "../config/colors";

/**
 * TenantLandingPage \u2014 A professional landing page for tenant websites.
 * Shows hero, services, social proof, and a CTA to enter the quoting flow.
 */
export default function TenantLandingPage({ config, onGetQuote }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pull enabled services from config
  const enabledServices = (config.services || []).filter(s => s.enabled !== false);

  // Service icons (emoji-based for simplicity)
  const serviceIcons = {
    pressure_washing: "\u{1F4A7}",
    window_cleaning: "\u{1FA9F}",
    gutter_cleaning: "\u{1F3E0}",
    roof_cleaning: "\u{1F3DA}",
    deck_cleaning: "\u{1FAB5}",
    concrete_cleaning: "\u{1F9F1}",
    gutter_guard_install: "\u{1F6E1}",
    misc: "\u{2728}",
  };

  const serviceLabels = {
    pressure_washing: "House Washing",
    window_cleaning: "Window Cleaning",
    gutter_cleaning: "Gutter Cleaning",
    roof_cleaning: "Roof Cleaning",
    deck_cleaning: "Deck & Patio Cleaning",
    concrete_cleaning: "Concrete Cleaning",
    gutter_guard_install: "Gutter Guard Installation",
    misc: "Additional Services",
  };

  const serviceDescriptions = {
    pressure_washing: "Restore your home\u2019s curb appeal with our professional soft wash and pressure washing services.",
    window_cleaning: "Crystal-clear windows inside and out \u2014 we handle every type from casement to bay windows.",
    gutter_cleaning: "Keep water flowing and protect your foundation with thorough gutter cleanouts.",
    roof_cleaning: "Safe, gentle roof cleaning that removes moss, algae, and black streaks.",
    deck_cleaning: "Bring your deck and patio back to life with deep cleaning and brightening.",
    concrete_cleaning: "Driveways, sidewalks, and patios cleaned to look brand new.",
    gutter_guard_install: "Premium gutter guards installed to keep debris out for good.",
    misc: "Custom exterior cleaning solutions tailored to your property.",
  };

  const reviewAvg = config.marketing?.reviewAverage || 4.8;
  const reviewCount = config.marketing?.reviewCount || 50;
  const socialProofCount = config.marketing?.socialProofCount || 10;

  // Testimonials
  const testimonials = [
    { name: "Sarah M.", text: "Incredible work! Our house looks brand new. The team was professional and thorough.", rating: 5 },
    { name: "James K.", text: "Best exterior cleaning company we\u2019ve ever used. Fair pricing and outstanding results.", rating: 5 },
    { name: "Emily R.", text: "Quick response, easy quoting process, and the work exceeded our expectations.", rating: 5 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ââ HERO ââ */}
      <section style={{
        background: C.gradient,
        color: C.white,
        padding: "100px 24px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          {/* Logo */}
          {config.logoImage ? (
            <img
              src={config.logoImage}
              alt={config.businessName}
              style={{ height: 70, width: "auto", objectFit: "contain", marginBottom: 24, filter: "brightness(0) invert(1)" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 800, marginBottom: 24,
            }}>
              {config.logoLetter || "C"}
            </div>
          )}

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            {config.businessName} {config.businessSubtitle || "Exterior Cleaning"}
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            opacity: 0.9,
            maxWidth: 520,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}>
            Professional exterior cleaning services for your home. Get an instant, transparent quote in under 2 minutes.
          </p>

          <button
            onClick={onGetQuote}
            style={{
              padding: "16px 40px",
              fontSize: 18,
              fontWeight: 700,
              background: C.white,
              color: C.primary,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 6px 28px rgba(0,0,0,0.2)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
          >
            Get Your Free Quote {"\u2192"}
          </button>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 36, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.9, fontSize: 14 }}>
              <span>{"\u2B50"}</span> {reviewAvg} stars ({reviewCount} reviews)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.9, fontSize: 14 }}>
              <span>{"\u26A1"}</span> Instant quotes
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.9, fontSize: 14 }}>
              <span>{"\u2705"}</span> Licensed & insured
            </div>
          </div>
        </div>
      </section>

      {/* ââ SERVICES ââ */}
      <section style={{ padding: "72px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{
            fontSize: "clamp(24px, 3.5vw, 36px)",
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}>
            Our Services
          </h2>
          <p style={{ fontSize: 16, color: C.textLight, maxWidth: 480, margin: "0 auto" }}>
            Everything your home needs to look its best, all from one trusted team.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {enabledServices.map((svc) => (
            <div
              key={svc.id}
              style={{
                background: C.bgCard,
                borderRadius: 14,
                padding: "28px 24px",
                border: `1px solid ${C.borderLight}`,
                boxShadow: C.shadow,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.shadowHover; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                {serviceIcons[svc.id] || "\u2728"}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                {serviceLabels[svc.id] || svc.name}
              </h3>
              <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.6, margin: 0 }}>
                {serviceDescriptions[svc.id] || "Professional cleaning tailored to your needs."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ââ HOW IT WORKS ââ */}
      <section style={{ padding: "64px 24px", background: C.bgDark }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}>
              How It Works
            </h2>
            <p style={{ fontSize: 16, color: C.textLight }}>
              Getting a quote is fast, easy, and completely free.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 28,
          }}>
            {[
              { step: "1", title: "Choose Your Services", desc: "Select what your home needs \u2014 house wash, windows, gutters, and more." },
              { step: "2", title: "Get Instant Pricing", desc: "See transparent pricing with tiered packages \u2014 no hidden fees, no surprises." },
              { step: "3", title: "Book Your Clean", desc: "Submit your quote and we\u2019ll reach out to schedule at your convenience." },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: C.gradient, color: C.white,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, marginBottom: 16,
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ââ TESTIMONIALS ââ */}
      {config.marketing?.showSocialProof && (
        <section style={{ padding: "72px 24px", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}>
              What Our Customers Say
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <span style={{ color: "#f59e0b", fontSize: 20 }}>{"\u2B50\u2B50\u2B50\u2B50\u2B50"}</span>
              <span style={{ fontSize: 15, color: C.textMid, fontWeight: 600 }}>{reviewAvg} out of 5</span>
              <span style={{ fontSize: 14, color: C.textLight }}>({reviewCount} reviews)</span>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 20,
          }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: C.bgCard,
                borderRadius: 14,
                padding: "24px",
                border: `1px solid ${C.borderLight}`,
                boxShadow: C.shadow,
              }}>
                <div style={{ color: "#f59e0b", fontSize: 16, marginBottom: 12 }}>
                  {Array(t.rating).fill("\u2B50").join("")}
                </div>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ââ CTA ââ */}
      <section style={{
        background: C.gradient,
        color: C.white,
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}>
            Ready for a cleaner home?
          </h2>
          <p style={{ fontSize: 17, opacity: 0.9, marginBottom: 32, lineHeight: 1.6 }}>
            Get your free, no-obligation quote in under 2 minutes. See exactly what everything costs before you commit.
          </p>
          <button
            onClick={onGetQuote}
            style={{
              padding: "16px 44px",
              fontSize: 18,
              fontWeight: 700,
              background: C.white,
              color: C.primary,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "none"; }}
          >
            Get Your Free Quote {"\u2192"}
          </button>
        </div>
      </section>

      {/* ââ FOOTER ââ */}
      <footer style={{
        background: C.text,
        color: "rgba(255,255,255,0.5)",
        padding: "36px 24px",
        textAlign: "center",
        fontSize: 13,
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            {config.logoImage ? (
              <img src={config.logoImage} alt={config.businessName} style={{ height: 24, filter: "brightness(0) invert(1)", opacity: 0.7 }} />
            ) : (
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 15 }}>{config.businessName}</span>
            )}
          </div>
          <p>{config.businessName} {config.businessSubtitle || "Exterior Cleaning"}</p>
          <p style={{ marginTop: 8 }}>{"\u00A9"} {new Date().getFullYear()} {config.businessName}. All rights reserved.</p>
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
            Powered by <a href="https://mybidquick.com" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>MyBidQuick</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
