/**
 * Tenant config: Cornerstone Exterior Cleaning
 * URL: cornerstonebid.vercel.app (custom domain later)
 */
const CORNERSTONE = {
  id: "cornerstone",
  businessName: "Cornerstone",
  businessSubtitle: "Exterior Cleaning",
  tagline: "Exterior Cleaning Quotes",
  phone: "",  // TODO: Add Cornerstone phone
  email: "",  // TODO: Add Cornerstone email
  adminPassword: "admin123",

  // API keys â placeholder until set up
  web3formsKey: "",       // TODO: Create Web3Forms key for Cornerstone
  googlePlacesApiKey: "AIzaSyChuudJiPotYb4GFXKFOSZsEPOPjJqd7Q4", // Can share Google API key
  housecallProEnabled: false,  // No HCP yet

  // Branding â navy + light blue to match the logo
  colors: {
    bg: "#f0f4f8",
    bgCard: "#ffffff",
    bgCardAlt: "#f6f9fc",
    bgDark: "#e3eaf2",
    bgAccent: "#edf7ff",
    border: "#c8d6e5",
    borderLight: "#dde7f0",
    primary: "#1a2e4a",       // Dark navy from logo
    primaryDark: "#0f1f35",
    secondary: "#5cb8e4",     // Light blue from logo
    secondaryDark: "#3a9fd1",
    accent: "#5cb8e4",
    accentDark: "#3a9fd1",
    warning: "#f59e0b",
    danger: "#ef4444",
    text: "#1a2e4a",          // Navy text
    textMid: "#3d5a80",
    textLight: "#6b8db5",
    textMuted: "#98b4d4",
    white: "#ffffff",
    gradient: "linear-gradient(135deg, #1a2e4a, #5cb8e4)",
    shadow: "0 2px 12px rgba(26,46,74,0.08)",
    shadowHover: "0 4px 20px rgba(26,46,74,0.15)",
  },

  // Logo image instead of letter icon
  logoImage: "/cornerstone_logo.png",
  logoLetter: "CE",  // Fallback if image fails

  // Lead sources
  leadSources: [
    "Google",
    "Social Media: Facebook / Instagram",
    "Friend / Referral",
    "Saw Our Truck",
    "Repeat Customer",
    "Other",
  ],

  // Gallery â enabled with placeholder content
  gallery: {
    enabled: true,
  },

  // Marketing â enabled for demo
  marketing: {
    showUrgencyTimer: false,
    urgencyMessage: "",
    urgencyEndDate: "",
    showSocialProof: true,
    socialProofCount: 14,
    showLimitedOffer: false,
    limitedOfferText: "",
    showReviewBadge: true,
    reviewCount: 87,
    reviewAverage: 4.8,
  },

  // Services to disable for this tenant
  disabledServices: ["roof_cleaning", "gutter_guard_install"],
};

export default CORNERSTONE;
