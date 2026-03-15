import C from "./colors";

// Shared reusable styles
const s = {
  card: {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: C.shadow,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: C.bgCardAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.textMid,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  h1: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 4,
    color: C.text,
  },
  btnPrimary: {
    padding: "12px 32px",
    borderRadius: 12,
    border: "none",
    background: C.gradient,
    color: C.white,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(59,156,255,0.25)",
  },
  btnSecondary: {
    padding: "12px 24px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.textMid,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
};

export default s;
