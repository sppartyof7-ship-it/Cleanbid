// ═══════════════════════════════════════════════════════════════════════
// COLOR PALETTE — Tenant-aware
// ═══════════════════════════════════════════════════════════════════════

// Default Cloute colors (used if no tenant override)
const DEFAULT_COLORS = {
  bg: "#f0f7ff",
  bgCard: "#ffffff",
  bgCardAlt: "#f8fbff",
  bgDark: "#e8f1fd",
  bgAccent: "#eef7ee",
  border: "#d4e4f7",
  borderLight: "#e8f0fa",
  primary: "#3b9cff",
  primaryDark: "#2b7de9",
  secondary: "#6dd19e",
  secondaryDark: "#4db87e",
  accent: "#a78bfa",
  accentDark: "#7c5fd6",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#1e3a5f",
  textMid: "#4a6d94",
  textLight: "#7a9bbc",
  textMuted: "#a3bdd4",
  white: "#ffffff",
  gradient: "linear-gradient(135deg, #3b9cff, #6dd19e)",
  shadow: "0 2px 12px rgba(59,156,255,0.1)",
  shadowHover: "0 4px 20px rgba(59,156,255,0.18)",
};

// Mutable reference — set once at app boot via setTenantColors()
let C = { ...DEFAULT_COLORS };

/**
 * Apply tenant colors. Call this once at app initialization.
 * After this, every `import C from "./colors"` gets the tenant's palette.
 */
export function setTenantColors(tenantColors) {
  if (!tenantColors) return;
  Object.assign(C, tenantColors);
}

export default C;
