/**
 * Tenant config: Cloute Inc / TKS Exterior Cleaning
 * URL: cleanbid.vercel.app (or future custom domain)
 */
const CLOUTE = {
  id: "cloute",
  businessName: "ClouteBid",
  tagline: "Instant Cleaning Service Quotes",
  phone: "(920) 563-4101",
  email: "tim.sullivan@clouteinc.com",
  adminPassword: "admin123",

  // API keys
  web3formsKey: "6cf87767-154f-42e1-8920-4988ef3cf5a3",
  googlePlacesApiKey: "AIzaSyAnLy1iRt0_fkMJqyBxrC0meEJD0qpshvU",
  housecallProEnabled: true,

  // Branding
  colors: {
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
  },

  // Logo icon letter(s) for the header
  logoLetter: "C",

  // Lead sources
  leadSources: [
    "Google",
    "Social Media: Facebook / Instagram",
    "Friend / Referral",
    "Saw Our Truck",
    "Repeat Customer",
    "Other",
  ],

  // Gallery photos (paths relative to /public/gallery/)
  gallery: {
    enabled: true,
    // Uses existing gallery images in public/gallery/
  },

  // Marketing defaults
  marketing: {
    showUrgencyTimer: true,
    urgencyMessage: "Spring booking slots filling fast!",
    urgencyEndDate: "2026-04-15",
    showSocialProof: true,
    socialProofCount: 47,
    showLimitedOffer: true,
    limitedOfferText: "Book this week & get a FREE gutter inspection",
    showReviewBadge: true,
    reviewCount: 238,
    reviewAverage: 4.9,
  },

  // Owner intro video — paste a YouTube or Vimeo URL here
  // Tim: record a 30-60 sec video and paste the link
  ownerVideoUrl: "",
  showOwnerVideo: false,
};

export default CLOUTE;
