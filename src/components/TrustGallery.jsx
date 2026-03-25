import { useState } from "react";
import C from "../config/colors";

const BEFORE_AFTER = [
  {
    id: "siding",
    label: "Vinyl Siding",
    service: "House Washing",
    before: "/gallery/siding_before.jpg",
    after: "/gallery/siding_after.jpg",
  },
  {
    id: "house",
    label: "Full Exterior",
    service: "House Washing",
    before: "/gallery/house_before.jpg",
    after: "/gallery/house_after.jpg",
  },
  {
    id: "concrete",
    label: "Sidewalk",
    service: "Concrete Cleaning",
    before: "/gallery/concrete_before.jpg",
    after: "/gallery/concrete_after.jpg",
  },
];

const ACTION_SHOTS = [
  { src: "/gallery/action_washing.jpg", caption: "Professional house washing" },
  { src: "/gallery/action_windows.jpg", caption: "Window cleaning crew" },
  { src: "/gallery/truck_side.jpg", caption: "Cloute concrete cleaning" },
];

const REVIEWS = [
  { name: "Deborah Biddle", location: "Google Review", stars: 5, text: "Cloute cleaned our windows and washed our home and concrete patio. The staff were courteous, professional and did a fantastic job!" },
  { name: "Nathan Freie", location: "Google Review", stars: 5, text: "Tim and his crew are professional and do an excellent job. They walked our property before and after — our house looks brand new." },
  { name: "Tywana German", location: "Google Review", stars: 5, text: "Tim and his staff were extremely easy to work with. They arrived on time, prepared, and the house looked amazing when they were done." },
];

export default function TrustGallery({ config }) {
  // If tenant has gallery disabled, don't render
  if (config?.gallery?.enabled === false) return null;
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const pair = BEFORE_AFTER[activeSlide];

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
          See the Cloute Difference
        </h2>
        <p style={{ fontSize: 15, color: C.textLight, maxWidth: 500, margin: "0 auto" }}>
          Real results from real Wisconsin homes. Drag the slider to compare before & after.
        </p>
      </div>

      {/* Before/After Slider */}
      <div style={{ maxWidth: 600, margin: "0 auto 20px" }}>
        {/* Slide selector pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          {BEFORE_AFTER.map((item, i) => (
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
              ⟨⟩
            </div>
          </div>

          {/* Labels */}
          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 3 }}>BEFORE</div>
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(16,185,129,0.85)", color: "#fff", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 3 }}>AFTER</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.textLight }}>
          {pair.service} · {pair.label}
        </div>
      </div>

      {/* Reviews — compact horizontal strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>⭐</span>
        <span style={{ fontWeight: 800, color: "#b45309", fontSize: 15 }}>4.9</span>
        <span style={{ color: C.textLight, fontSize: 13 }}>from 439 Google reviews</span>
      </div>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 0 8px" }}>
        {REVIEWS.map((r, i) => (
          <div key={i} style={{ minWidth: 240, flex: "0 0 auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: C.shadow }}>
            <div style={{ display: "flex", gap: 1, marginBottom: 6 }}>
              {Array.from({ length: r.stars }).map((_, s) => (
                <span key={s} style={{ color: "#f59e0b", fontSize: 12 }}>★</span>
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
