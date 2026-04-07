import C from "./colors";

// Services that get a "stories" multiplier (ground-level services don't)
export const SERVICES_WITH_STORIES = [
  "pressure_washing",
  "window_cleaning",
  "roof_cleaning",
  "gutter_cleaning",
  "gutter_guard_install",
];

/**
 * Build the default config, optionally merging tenant overrides.
 * Called once at app boot with the resolved tenant.
 */
export function buildDefaultConfig(tenant) {
  const cfg = { ...BASE_CONFIG, services: BASE_CONFIG.services.map((s) => ({ ...s })) };

  if (tenant) {
    if (tenant.businessName) cfg.businessName = tenant.businessName;
    if (tenant.adminPassword) cfg.adminPassword = tenant.adminPassword;
    if (tenant.web3formsKey) cfg.web3formsKey = tenant.web3formsKey;
    if (tenant.googlePlacesApiKey) cfg.googlePlacesApiKey = tenant.googlePlacesApiKey;
    if (tenant.leadSources) cfg.leadSources = tenant.leadSources;
    if (tenant.marketing) cfg.marketing = { ...cfg.marketing, ...tenant.marketing };
    if (tenant.phone) cfg.phone = tenant.phone;
    if (tenant.email) cfg.contactEmail = tenant.email;
    if (tenant.tagline) cfg.tagline = tenant.tagline;
    if (tenant.logoLetter) cfg.logoLetter = tenant.logoLetter;
    if (tenant.logoImage) cfg.logoImage = tenant.logoImage;
    if (tenant.id) cfg.tenantId = tenant.id;
    if (tenant.supabaseId) cfg.supabaseId = tenant.supabaseId;
    cfg.housecallProEnabled = tenant.housecallProEnabled ?? true;
    if (tenant.storiesMultipliers) cfg.storiesMultipliers = { ...cfg.storiesMultipliers, ...tenant.storiesMultipliers };
    if (tenant.minimumCharges) cfg.minimumCharges = { ...cfg.minimumCharges, ...tenant.minimumCharges };
    if (tenant.featureToggles) cfg.featureToggles = { ...cfg.featureToggles, ...tenant.featureToggles };
    if (tenant.gallery) cfg.gallery = tenant.gallery;
    if (tenant.ownerVideoUrl !== undefined) cfg.ownerVideoUrl = tenant.ownerVideoUrl;
    if (tenant.showOwnerVideo !== undefined) cfg.showOwnerVideo = tenant.showOwnerVideo;

    if (tenant.disabledServices?.length) {
      cfg.services = cfg.services.map((svc) => ({
        ...svc,
        enabled: tenant.disabledServices.includes(svc.id) ? false : svc.enabled,
      }));
    }
  }

  return cfg;
}

const BASE_CONFIG = {
  configVersion: 6,  // Bump this when default pricing changes — forces localStorage refresh
  businessName: "MyBidQuick",
  adminPassword: "admin123",
  globalPriceAdjustment: 0,
  web3formsKey: "6cf87767-154f-42e1-8920-4988ef3cf5a3",
  googlePlacesApiKey: "AIzaSyAnLy1iRt0_fkMJqyBxrC0meEJD0qpshvU",
  tenantId: "cloute",
  logoLetter: "C",
  tagline: "Instant Cleaning Service Quotes",
  phone: "(920) 563-4101",
  contactEmail: "",
  housecallProEnabled: true,
  gallery: { enabled: true },
  leadSources: [
    "Google Search",
    "Facebook / Instagram",
    "Friend / Referral",
    "Nextdoor",
    "Yard Sign",
    "Saw Our Truck / Trailer",
    "Repeat Customer",
    "Thumbtack / Angi / HomeAdvisor",
    "Other",
  ],
  services: [
    {
      id: "pressure_washing",
      name: "House Washing",
      icon: "\u{1F3E0}",
      description: "House / Siding Wash",
      basePrice: 125,
      perSqFt: 0.15,
      sqftTiers: [
        { upTo: 2000, rate: 1.0 },
        { upTo: 3000, rate: 0.67 },
        { upTo: 99999, rate: 0.47 },
      ],
      perWindow: 0,
      perLinFt: 0,
      enabled: true,
      tierFeatures: {
        standard: "Soft wash siding — surface clean & rinse",
        premium: "Soft wash siding + window frames + exterior eaves rinsed",
        platinum: "Soft wash siding + frames + exterior eaves + foundation perimeter rinse + walkway spot-treatment",
      },
      extras: [
        { id: "garage", label: "Detached Garage", price: 85 },
        { id: "aluminum", label: "Aluminum Siding", price: 50 },
        { id: "eifs_stucco_wood", label: "EIFS / Stucco / Wood Siding", price: 75 },
      ],
    },
    {
      id: "window_cleaning",
      name: "Window Cleaning",
      icon: "\u{1FA9F}",
      description: "Professional window cleaning \u2014 choose your level",
      basePrice: 0,
      perSqFt: 0,
      perWindow: 5.5,
      perLinFt: 0,
      enabled: true,
      windowsPerSqFt: 0.0125,
      hasPackagePricing: true,
      doorPrice: 8,
      tierFeatures: {
        standard: "Exterior windows only — outsides cleaned & streak-free",
        premium: "Interior & exterior — both sides of every window cleaned (tracks not included). Includes 7-day rain guarantee",
        platinum: "Detailed interior & exterior — windows + tracks, sills, screens & frames. Includes 7-day rain guarantee",
      },
      windowTypes: [
        {
          id: "casement", label: "Casement", multiplier: 1.0,
          description: "Single pane, hinged on one side, cranks open", windowImage: "casement",
          priceByPackage: { standard: 5.5, premium: 12, platinum: 18 },
        },
        {
          id: "single_hung", label: "Single Hung", multiplier: 1.3,
          description: "One sash slides up & down, top pane is fixed", windowImage: "single_hung",
          priceByPackage: { standard: 7, premium: 14, platinum: 21 },
        },
        {
          id: "double_hung", label: "Double Hung", multiplier: 1.6,
          description: "Two sashes that slide up & down, tilt-in for cleaning", windowImage: "double_hung",
          priceByPackage: { standard: 8, premium: 16, platinum: 24 },
        },
        {
          id: "combination", label: "Combination / Storm", multiplier: 2.0,
          description: "Inner window + outer storm pane — extra glass to clean", windowImage: "combination",
          priceByPackage: { standard: 14, premium: 28, platinum: 38 },
        },
      ],
      extras: [
        { id: "screen_cleaning", label: "Screen Cleaning", pricePerUnit: 3, unit: "screen", minPackage: "premium", description: "Remove, wash & reinstall each screen" },
      ],
    },
    {
      id: "deck_cleaning",
      name: "Deck Cleaning",
      icon: "\u{1FAB5}",
      description: "Wood & composite deck restoration",
      basePrice: 75,
      perSqFt: 0.40,
      perWindow: 0,
      perLinFt: 0,
      enabled: true,
      maxTier: "premium",
      tierFeatures: {
        standard: "Surface wash & debris removal",
        premium: "Deep clean + brightening treatment to restore natural wood color",
        platinum: "Deep clean + brightening treatment to restore natural wood color",
      },
      extras: [
        { id: "railings", label: "Railing Detail Clean", price: 65 },
        { id: "stairs", label: "Stairs", pricePerUnit: 45, unit: "flight", description: "Per flight of stairs" },
      ],
    },
    {
      id: "concrete_cleaning",
      name: "Concrete Cleaning",
      icon: "\u{1F9F1}",
      description: "Driveways, garage floors & walkways",
      basePrice: 75,
      perSqFt: 0.20,
      perWindow: 0,
      perLinFt: 0,
      enabled: true,
      maxTier: "premium",
      tierFeatures: {
        standard: "Surface pressure wash",
        premium: "Deep clean + edge detail + spot degreasing",
        platinum: "Deep clean + edge detail + spot degreasing",
      },
      extras: [
        { id: "oil_stain", label: "Oil Stain Treatment", price: 50, disclaimer: "Heavy stains may require an in-person assessment. Full removal is not guaranteed — results vary by stain age and surface type." },
        { id: "edging", label: "Edging & Detail Work", price: 40 },
      ],
    },
    {
      id: "roof_cleaning",
      name: "Roof Cleaning",
      icon: "\u{1F9F9}",
      description: "Soft wash moss & algae removal",
      basePrice: 150,
      perSqFt: 0.10,
      perWindow: 0,
      perLinFt: 0,
      enabled: true,
      tierFeatures: {
        standard: "Soft wash visible roof surfaces",
        premium: "Full roof + ridge caps + vent areas",
        platinum: "Full roof + ridges + vents + moss treatment + 6-month warranty",
      },
      extras: [
        { id: "moss_treatment", label: "Moss Prevention Treatment", price: 150 },
        { id: "chimney", label: "Chimney Wash", price: 75 },
        { id: "solar_panels", label: "Solar Panel Cleaning", price: 100 },
      ],
    },
    {
      id: "gutter_cleaning",
      name: "Gutter Cleaning",
      icon: "\u{1F327}\u{FE0F}",
      description: "Exterior gutter cleanout & downspout check",
      basePrice: 50,
      perSqFt: 0,
      perWindow: 0,
      perLinFt: 0.85,
      enabled: true,
      maxTier: "premium",
      tierFeatures: {
        standard: "Hand clean exterior gutters, check downspouts — flush only if plugged",
        premium: "Full exterior gutter cleanout & power flush all downspouts",
        platinum: "Full exterior gutter cleanout & power flush all downspouts",
      },
      conditionQuestions: [
        { id: "plugged_downspouts", label: "Are any downspouts plugged?", priceAdj: 35 },
        { id: "trees_growing", label: "Trees or debris growing out of gutters?", priceAdj: 50 },
        { id: "has_gutter_guards", label: "Do you have existing gutter guards?", priceAdj: 25 },
      ],
      extras: [
        { id: "downspout_clearing", label: "Downspout Clearing", price: 65 },
      ],
    },
    {
      id: "gutter_guard_install",
      name: "Gutter Guard Installation",
      icon: "\u{1F6E1}\u{FE0F}",
      description: "Professional gutter guard installation - priced per linear foot",
      basePrice: 0,
      perSqFt: 0,
      perWindow: 0,
      perLinFt: 12.99,
      enabled: true,
      maxTier: "premium",
      tierFeatures: {
        standard: "Gutter guard installation",
        premium: "Full interior gutter cleaning & power flush downspouts + gutter guard installation",
        platinum: "Full interior gutter cleaning & power flush downspouts + gutter guard installation",
      },
      tiers: [
        { id: "standard", label: "Gutter Guard Install", perLinFt: 12.99, description: "Gutter guard installation only" },
        { id: "premium", label: "Gutter Cleaning + Guard Install", perLinFt: 14.99, description: "Premium gutter cleaning plus guard installation" },
      ],
      extras: [],
    },
  ],
  packages: {
    standard: {
      label: "Standard",
      multiplier: 1.0,
      color: C.textMid,
      tag: "Quality service at a great price",
      features: [
        "Standard cleaning products",
        "Post-job walkthrough & cleanup",
        "Email receipt & summary",
      ],
    },
    premium: {
      label: "Premium",
      multiplier: 1.25,
      color: C.primary,
      tag: "Our most popular choice",
      popular: true,
      features: [
        "Upgraded cleaning products",
        "Before & after photos",
        "Pre-job property assessment",
        "7-day spot re-treatment guarantee",
      ],
    },
    platinum: {
      label: "Platinum",
      multiplier: 1.55,
      color: C.accent,
      tag: "The ultimate clean",
      features: [
        "Premium restoration-grade products",
        "Full property inspection report",
        "Priority scheduling",
        "60-day satisfaction guarantee",
      ],
    },
  },
  upsell: {
    enabled: true,
    triggerService: "pressure_washing",
    offerServices: ["window_cleaning", "gutter_cleaning"],
    discountPercent: 15,
  },
  storiesMultipliers: { 2: 1.12, 3: 1.21 },
  minimumCharges: {
    window_cleaning: 75,
    gutter_guard_install: 200,
    gutter_cleaning: 75,
  },
  featureToggles: { googleCalendar: false },
  bundleDiscounts: { 2: 10, 3: 15, 4: 20, 5: 25 },
  seasonalBundles: [
    {
      id: "spring_refresh",
      name: "Spring Refresh Bundle",
      services: ["pressure_washing", "window_cleaning", "gutter_cleaning"],
      discount: 15,
      active: true,
      endDate: "2026-05-31",
      tagline: "Get your home spring-ready!",
    },
  ],
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
  // Owner intro video — shown on quote results page to build trust
  // Supports YouTube, Vimeo, or direct MP4 URLs
  ownerVideoUrl: "",
  showOwnerVideo: false,
  followUp: {
    enabled: true,
    sequences: [
      {
        id: "1",
        delay: "Immediate",
        type: "email",
        subject: "Your Custom Quote from {{business}}",
        body: "Hi {{name}},\n\nThank you for requesting a quote!\n\nTotal: {{total}}\n\nReady to book? Reply or call us!",
        active: true,
      },
      {
        id: "2",
        delay: "2 days",
        type: "sms",
        subject: "",
        body: "Hi {{name}}! Checking in on your {{services}} quote for {{total}}. Questions? Reply here!",
        active: true,
      },
      {
        id: "3",
        delay: "5 days",
        type: "email",
        subject: "Still thinking it over?",
        body: "Hi {{name}},\n\nSpots filling up!\n\nYour quote: {{total}}\n\nBook now to lock in your price.",
        active: true,
      },
      {
        id: "4",
        delay: "14 days",
        type: "email",
        subject: "We miss you, {{name}}!",
        body: "Prices may change soon!\n\nQuote: {{total}}",
        active: false,
      },
    ],
  },
};

// Keep the default export for backward compatibility
const DEFAULT_CONFIG = BASE_CONFIG;
export default DEFAULT_CONFIG;
