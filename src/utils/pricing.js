import { SERVICES_WITH_STORIES } from "../config/defaults";

/**
 * Calculate the price for a single service.
 * This is the SINGLE source of truth for pricing — no more duplicated logic!
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

  // Handle window cleaning with window types (sq ft → estimated windows → type pricing)
  if (svc.id === "window_cleaning" && svc.windowTypes && d.sqft) {
    const estimatedWindows = Math.round(d.sqft * (svc.windowsPerSqFt || 0.0125));
    const windowType = svc.windowTypes.find((wt) => wt.id === (d.windowType || "casement")) || svc.windowTypes[0];

    let total;
    if (windowType.pricePerWindow) {
      // Flat per-window price (e.g. combination/storm at $40/window)
      total = estimatedWindows * applyGlobal(windowType.pricePerWindow);
    } else {
      // Base per-window price × type multiplier
      total = estimatedWindows * applyGlobal(svc.perWindow) * (windowType.multiplier || 1);
    }

    // Add extras (per window)
    const extras = selectedExtras || [];
    extras.forEach((extId) => {
      const ext = svc.extras.find((e) => e.id === extId);
      if (ext) total += estimatedWindows * applyGlobal(ext.price);
    });

    // Stories multiplier
    if (SERVICES_WITH_STORIES.includes(svc.id)) {
      if (globalStories === 2) total *= 1.25;
      else if (globalStories >= 3) total *= 1.5;
    }
    return total;
  }

  let total = applyGlobal(svc.basePrice);

  if (svc.perSqFt) total += (d.sqft || 0) * applyGlobal(svc.perSqFt);
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
