import { SERVICES_WITH_STORIES } from "../config/defaults";

/**
 * Calculate tiered/bracket sqft price (like tax brackets).
 * Each tier only applies to the sqft WITHIN that bracket.
 * Example tiers: [{ upTo: 1500, rate: 0.12 }, { upTo: 2500, rate: 0.08 }, ...]
 * The last tier's rate applies to everything above its upTo.
 */
export function calculateTieredSqFt(sqft, pricingTiers) {
  if (!sqft || sqft <= 0 || !pricingTiers || pricingTiers.length === 0) return 0;

  let remaining = sqft;
  let total = 0;
  let prevCap = 0;

  for (let i = 0; i < pricingTiers.length; i++) {
    const tier = pricingTiers[i];
    const cap = tier.upTo || Infinity;
    const bracket = Math.min(remaining, cap - prevCap);
    if (bracket <= 0) break;
    total += bracket * tier.rate;
    remaining -= bracket;
    prevCap = cap;
    if (remaining <= 0) break;
  }

  // If there's still sqft left beyond the last defined tier, use the last tier's rate
  if (remaining > 0) {
    total += remaining * pricingTiers[pricingTiers.length - 1].rate;
  }

  return total;
}

/**
 * Calculate the price for a single service.
 * This is the SINGLE source of truth for pricing â no more duplicated logic!
 *
 * Supports two sqft pricing modes:
 *   1. Flat rate:   perSqFt > 0 (legacy, simple)
 *   2. Tiered rate: pricingTiers array (bracket pricing â bigger homes pay less per ft)
 */
export function calculateServicePrice(svc, details, selectedExtras, globalPriceAdj, globalStories) {
  if (!svc) return 0;

  const applyGlobal = (price) => price * (1 + globalPriceAdj / 100);
  const d = details || {};

  // Handle tier-based services (like gutter guard installation)
  if (svc.tiers && svc.tiers.length > 0) {
    const selectedTier = svc.tiers.find((t) => t.id === (d.selectedTier || svc.tiers[0].id)) || svc.tiers[0];
    let total = (d.linearFt || 0) * applyGlobal(selectedTier.perLinFt);
    if (SERVICES_WITH_STORIES.includes(svc.id)) {
      if (globalStories === 2) total *= 1.25;
      else if (globalStories >= 3) total *= 1.5;
    }
    return total;
  }

  // Handle window cleaning with window types (sq ft â estimated windows â type pricing)
  if (svc.id === "window_cleaning" && svc.windowTypes && d.sqft) {
    const estimatedWindows = Math.round(d.sqft * (svc.windowsPerSqFt || 0.0125));
    const windowType = svc.windowTypes.find((wt) => wt.id === (d.windowType || "casement")) || svc.windowTypes[0];

    let total;
    if (windowType.pricePerWindow) {
      total = estimatedWindows * applyGlobal(windowType.pricePerWindow);
    } else {
      total = estimatedWindows * applyGlobal(svc.perWindow) * (windowType.multiplier || 1);
    }

    const extras = selectedExtras || [];
    extras.forEach((extId) => {
      const ext = svc.extras.find((e) => e.id === extId);
      if (ext) total += estimatedWindows * applyGlobal(ext.price);
    });

    if (SERVICES_WITH_STORIES.includes(svc.id)) {
      if (globalStories === 2) total *= 1.25;
      else if (globalStories >= 3) total *= 1.5;
    }
    return total;
  }

  // --- Standard service pricing ---
  let total = applyGlobal(svc.basePrice);

  // SqFt pricing: use tiered brackets if available, otherwise flat rate
  if (svc.pricingTiers && svc.pricingTiers.length > 0) {
    total += calculateTieredSqFt(d.sqft || 0, svc.pricingTiers.map(t => ({ ...t, rate: applyGlobal(t.rate) })));
  } else if (svc.perSqFt) {
    total += (d.sqft || 0) * applyGlobal(svc.perSqFt);
  }

  if (svc.perWindow) total += (d.windows || 0) * applyGlobal(svc.perWindow);
  if (svc.perLinFt) total += (d.linearFt || 0) * applyGlobal(svc.perLinFt);

  // Add extras
  const extras = selectedExtras || [];
  extras.forEach((extId) => {
    const ext = svc.extras.find((e) => e.id === extId);
    if (ext) total += applyGlobal(ext.price);
  });

  // Add condition question surcharges (e.g. gutter cleaning conditions)
  if (svc.conditionQuestions && d.conditions) {
    svc.conditionQuestions.forEach((q) => {
      if (d.conditions[q.id]) {
        total += applyGlobal(q.priceAdj);
      }
    });
  }

  // Apply stories multiplier for eligible services
  if (SERVICES_WITH_STORIES.includes(svc.id)) {
    if (globalStories === 2) total *= 1.25;
    else if (globalStories >= 3) total *= 1.5;
  }

  return total;
}

/**
 * Calculate total base price across all selected services.
 */
export function calculateTotalBase(selectedServices, allServices, allDetails, allExtras, globalPriceAdj, globalStories) {
  return selectedServices.reduce((total, svcId) => {
    const svc = allServices.find((sv) => sv.id === svcId);
    return total + calculateServicePrice(svc, allDetails[svcId], allExtras[svcId], globalPriceAdj, globalStories);
  }, 0);
}

/**
 * Get the discount percentage based on bundle or service count.
 */
export function getDiscountPercent(selectedServices, bundleDiscounts, appliedBundle, seasonalBundle) {
  if (appliedBundle && seasonalBundle) {
    return seasonalBundle.discount;
  }
  const count = selectedServices.length;
  if (count >= 3) return bundleDiscounts[3] || 10;
  if (count >= 2) return bundleDiscounts[2] || 5;
  return 0;
}

/**
 * Get the final price for a package tier.
 */
export function getPackagePrice(basePrice, discountPercent, packageMultiplier) {
  const discounted = basePrice * (1 - discountPercent / 100);
  return discounted * packageMultiplier;
}

/**
 * Get estimated window count from square footage (for display).
 */
export function getEstimatedWindows(sqft, windowsPerSqFt) {
  return Math.round((sqft || 0) * (windowsPerSqFt || 0.0125));
}

/**
 * Estimate gutter linear footage from house square footage.
 * Industry standard: perimeter â 4 Ã â(sqft), gutters run ~1.1x perimeter.
 * Example: 2000 sqft â ~197 linear ft
 */
export function estimateGutterLinearFt(sqft) {
  if (!sqft || sqft <= 0) return 0;
  return Math.round(1.1 * Math.sqrt(sqft) * 4);
}
