import { useState } from "react";
import C from "../config/colors";

const BEFORE_AFTER = [
  {
    id: "siding",
    label: "House Siding",
    service: "Pressure Washing",
    before: "/gallery/siding_before.jpg",
    after: "/gallery/siding_after.jpg",
  },
  {
    id: "house",
    label: "Full Exterior",
    service: "Pressure Washing",
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
  { src: "/gallery/action_washing.jpg", caption: "Commercial building washing" },
  { src: "/gallery/action_windows.jpg", caption: "Window cleaning crew" },
  { src: "/gallery/truck_side.jpg", caption: "Our Cloute service truck" },
];

const REVIEWS = [
  { name: "Deborah Biddle", location: "Google Review", stars: 5, text: "TKS cleaned our windows and power washed our home and concrete patio. The staff were courteous, professional and did a fantastic job! The power wash took years of dirt off the siding and concrete." },
  { name: "Gina Idsinga", location: "Google Review", stars: 5, text: "This is the first time we hired a service to clean our windows inside and out. The TKS team is phenomenal! Communications were timely and clear. The technicians arrived on time, were very friendly, and were conscientious." },
  { name: "Tywana German", location: "Google Review", stars: 5, text: "Tim and his staff were extremely easy to work with and very professional. They arrived on time, prepared and explained the process to me. The house looked amazing when they were done." },
  { name: "Nathan Freie", location: "Google Review", stars: 5, text: "Tim and his crew are professional and do an excellent job. They took the time to walk our property before and after the power washing, and were able to show me the results. Our house looks brand new." },
  { name: "Doug Marshall", location: "Google Review", stars: 5, text: "Tim was very responsive. We asked to reschedule due to another home maintenance project, and he was very helpful. Came on the scheduled day on time." },
  { name: "Nicole Horton", location: "Google Review", stars: 5, text: "They were efficient and did an amazing job with my 3 level home. My windows were extremely dirty due to living close to the highway and nature. They did all sides of my windows." },
];

export default function TrustGallery() {
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

      {/* Action Shot Strip */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "4px 0 16px", marginBottom: 24 }}>
        {ACTION_SHOTS.map((shot, i) => (
          <div key={i} style={{ minWidth: 200, flex: "0 0 auto", borderRadius: 12, overflow: "hidden", boxShadow: C.shadow, border: `1px solid ${C.border}` }}>
            <img src={shot.src} alt={shot.caption} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
            <div style={{ padding: "8px 12px", fontSize: 12, color: C.textMid, fontWeight: 600, background: C.white }}>{shot.caption}</div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 20px" }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontWeight: 800, color: "#b45309", fontSize: 16 }}>4.9</span>
          <span style={{ color: C.textLight, fontSize: 13 }}>from 439 Google reviews</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
        {REVIEWS.map((r, i) => (
          <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", boxShadow: C.shadow }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
              {Array.from({ length: r.stars }).map((_, s) => (
                <span key={s} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
              ))}
            </div>
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.5, marginBottom: 10 }}>"{r.text}"</p>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.name}</div>
            <div style={{ fontSize: 12, color: C.textLight }}>{r.location}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
