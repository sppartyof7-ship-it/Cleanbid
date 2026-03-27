import { useState } from "react";
import C from "../config/colors";

/* ââ Per-tenant gallery & review content ââ */
const TENANT_GALLERY = {
  cloute: {
    beforeAfter: [
      { id: "siding", label: "Vinyl Siding", service: "House Washing", before: "/gallery/siding_before.jpg", after: "/gallery/siding_after.jpg" },
      { id: "house", label: "Full Exterior", service: "House Washing", before: "/gallery/house_before.jpg", after: "/gallery/house_after.jpg" },
      { id: "concrete", label: "Sidewalk", service: "Concrete Cleaning", before: "/gallery/concrete_before.jpg", after: "/gallery/concrete_after.jpg" },
    ],
    reviews: [
      { name: "Deborah Biddle", location: "Google Review", stars: 5, text: "Cloute cleaned our windows and washed our home and concrete patio. The staff were courteous, professional and did a fantastic job!" },
      { name: "Nathan Freie", location: "Google Review", stars: 5, text: "Tim and his crew are professional and do an excellent job. They walked our property before and after â our house looks brand new." },
      { name: "Tywana German", location: "Google Review", stars: 5, text: "Tim and his staff were extremely easy to work with. They arrived on time, prepared, and the house looked amazing when they were done." },
    ],
    rating: "4.9",
    reviewCount: 439,
  },
  cornerstone: {
    beforeAfter: [
      { id: "siding", label: "Vinyl Siding", service: "House Washing", before: "/gallery/siding_before.jpg", after: "/gallery/siding_after.jpg" },
      { id: "house", label: "Full Exterior", service: "House Washing", before: "/gallery/house_before.jpg", after: "/gallery/house_after.jpg" },
      { id: "windows", label: "Windows", service: "Window Cleaning", before: "/gallery/concrete_before.jpg", after: "/gallery/concrete_after.jpg" },
    ],
    reviews: [
      { name: "Rachel M.", location: "Google Review", stars: 5, text: "Cornerstone did an amazing job on our house wash. The siding looks brand new and the crew was super professional." },
      { name: "Tom K.", location: "Google Review", stars: 5, text: "Best window cleaning service in Madison. They were on time, thorough, and left everything spotless. Highly recommend!" },
      { name: "Lisa P.", location: "Google Review", stars: 5, text: "Noah and his team pressure washed our entire exterior and cleaned all the gutters. Incredible attention to detail." },
    ],
    rating: "4.8",
    reviewCount: 87,
  },
};

/* Backwards-compat defaults */
const BEFORE_AFTER = TENANT_GALLERY.cloute.beforeAfter;
const REVIEWS = TENANT_GALLERY.cloute.reviews;

export default function TrustGallery({ config }) {
  // If tenant has gallery disabled, don't render
  if (config?.gallery?.enabled === false) return null;
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  // Pick tenant-specific gallery content, fall back to Cloute
  const tenantId = config?.id || "cloute";
  const gallery = TENANT_GALLERY[tenantId] || TENANT_GALLERY.cloute;
  const slides = gallery.beforeAfter;
  const reviews = gallery.reviews;
  const businessName = config?.businessName || "Cloute";

  const pair = slides[activeSlide] || slides[0];

  const handleSliderMove = (e, container) => {
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section Title */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6 }}>
          See the {businessName} Difference
        </h2>
        <p style={{ fontSize: 15, color: C.textLight, maxWidth: 500, margin: "0 auto" }}>
          Real results from real Wisconsin homes. Drag the slider to compare before & after.
        </p>
      </div>

      {/* Before/After Slider */}
      <div style={{ maxWidth: 600, margin: "0 auto 20px" }}>
        {/* Slide selector pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          {slides.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setActiveSlide(i); setSliderPos(50); }}
              style={{
                padding: "6px 16px", borderRadius: 20, border: `1px solid ${i === activeSlide ? C.primary : C.border}`,
              background: i === activeSlide ? `${C.primary}12` : C.white, color: i === activeSlide ? C.primary : C.textMid,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Slider container */}
        <div
          style={{ position: "relative", width: "100%", paddingBottom: "66%", borderRadius: 16, overflow: "hidden", cursor: "ew-resize", boxShadow: C.shadowHover, border: `2px solid ${C.border}` }}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onMouseMove={(e) => dragging && handleSliderMove(e, e.currentTarget)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onTouchMove={(e) => handleSliderMove(e, e.currentTarget)}
        >
          {/* After (full image behind) */}
          <img src={pair.after} alt="After" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />

          {/* Before (clipped by slider) */}
          <div style={{ position: "absolute", top: 0, left: 0, width: `${sliderPos}%`, height: "100%", overflow: "hidden" }}>
            <img src={pair.before} alt="Before" style={{ position: "absolute", top: 0, left: 0, width: `${100 / (sliderPos / 100)}%`, height: "100%", objectFit: "cover", maxWidth: "none" }} />
          </div>

          {/* Slider line */}
          <div style={{ position: "absolute", top: 0, left: `${sliderPos}%`, transform: "translateX(-50%)", width: 3, height: "100%", background: C.white, boxShadow: "0 0 8px rgba(0,0,0,0.4)", zIndex: 2 }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 40, height: 40, borderRadius: "50%", background: C.white, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.primary, userSelect: "none" }}>
              â¨â©
            </div>
          </div>

          {/* Labels */}
          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 3 }}>BEFORE</div>
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(16,185,129,0.85)", color: "#fff", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 3 }}>AFTER</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.textLight }}>
          {pair.service} Â· {pair.label}
        </div>
      </div>

      {/* Reviews â compact horizontal strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>â­</span>
        <span style={{ fontWeight: 800, color: "#b45309", fontSize: 15 }}>{gallery.rating}</span>
        <span style={{ color: C.textLight, fontSize: 13 }}>from {gallery.reviewCount} Google reviews</span>
      </div>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 0 8px" }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ minWidth: 240, flex: "0 0 auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: C.shadow }}>
            <div style={{ display: "flex", gap: 1, marginBottom: 6 }}>
              {Array.from({ length: r.stars }).map((_, s) => (
                <span key={s} style={{ color: "#f59e0b", fontSize: 12 }}>â</span>
              ))}
            </div>
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.4, marginBottom: 8 }}>"{r.text}"</p>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
