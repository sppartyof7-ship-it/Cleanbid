/**
 * Tenant config: Cornerstone Wash and Window Cleaning
 * URL: TBD (custom domain later)
 */
const CORNERSTONE = {
  id: "cornerstone",
  businessName: "Cornerstone",
  tagline: "Wash & Window Cleaning Quotes",
  phone: "",  // TODO: Add Cornerstone phone
  email: "",  // TODO: Add Cornerstone email
  adminPassword: "admin123",

  // API keys — placeholder until set up
  web3formsKey: "",       // TODO: Create Web3Forms key for Cornerstone
  googlePlacesApiKey: "AIzaSyChuudJiPotYb4GFXKFOSZsEPOPjJqd7Q4", // Can share Google API key
  housecallProEnabled: false,  // No HCP yet

  // Branding — warm stone/slate palette (placeholder, Tim will customize later)
  colors: {
    bg: "#f5f3ef",
    bgCard: "#ffffff",
    bgCardAlt: "#faf8f5",
    bgDark: "#ebe7e0",
    bgAccent: "#eef3ee",
    border: "#ddd8cf",
    borderLight: "#eae6df",
    primary: "#8b6f47",
    primaryDark: "#725a38",
    secondary: "#6ba368",
    secondaryDark: "#548a51",
    accent: "#b08d57",
    accentDark: "#967640",
    warning: "#d4940a",
    danger: "#c4392a",
    text: "#3a3228",
    textMid: "#6b5f52",
    textLight: "#9b8e7f",
    textMuted: "#b8ad9f",
    white: "#ffffff",
    gradient: "linear-gradient(135deg, #8b6f47, #6ba368)",
    shadow: "0 2px 12px rgba(139,111,71,0.08)",
    shadowHover: "0 4px 20px rgba(139,111,71,0.15)",
  },

  // Logo icon letter(s) for the header
  logoLetter: "CW",

  // Lead sources
  leadSources: [
    "Google",
    "Social Media: Facebook / Instagram",
    "Friend / Referral",
    "Saw Our Truck",
    "Repeat Customer",
    "Other",
  ],

  // Gallery — disabled until Cornerstone has photos
  gallery: {
    enabled: false,
  },

  // Marketing defaults
  marketing: {
    showUrgencyTimer: false,
    urgencyMessage: "",
    urgencyEndDate: "",
    showSocialProof: false,
    socialProofCount: 0,
    showLimitedOffer: false,
    limitedOfferText: "",
    showReviewBadge: false,
    reviewCount: 0,
    reviewAverage: 0,
  },

  // Service overrides — only list differences from defaults
  // null = use default, set a value to override
  serviceOverrides: {
    // Cornerstone is wash & windows focused
    // Tim can customize which services are enabled/disabled later
  },
};

export default CORNERSTONE;
