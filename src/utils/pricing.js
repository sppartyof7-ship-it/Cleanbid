import { SERVICES_WITH_STORIES } from "../config/defaults";

/**
 * Calculate tiered per-sqft cost.
 * Larger homes get a declining rate so quotes stay competitive.
 * Tiers: 0-2000 sqft at full rate, 2001-3000 at 67%, 3001+ at 47%.
 */
function tieredSqFtCost(sqft, perSqFt, tiers) {
  const t = tiers || [
    { upTo: 2000, rate: 1.0 },
    { upTo: 3000, rate: 0.67 },
    { upTo: 99999, rate: 0.47 },
  ];
  let remaining = sqft;
  let cost = 0;
  let prev = 0;
  for (const tier of t) {
    const band = Math.min(remaining, tier.upTo - prev);
    if (band <= 0) break;
    cost += band * perSqFt * tier.rate;
    remaining -= band;
    prev = tier.upTo;
  }
  return cost;
}

/**
 * Calculate the price for a single service.
 * This is the SINGLE source of truth for pricing â no more duplicated logic!
 *
 * @param {string} packageKey - Optional. If the service has per-package pricing
 *   (like window cleaning), this determines which price tier to use.
 *   Pass "standard", "premium", or "platinum". Falls back to "standard" / base price.
 */
export function calculateServicePrice(svc, details, selectedExtras, globalPriceAdj, globalStories, packageKey) {
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

  // Handle window cleaning with per-package pricing
  if (svc.id === "window_cleaning" && svc.windowTypes && d.sqft) {
    const estimatedWindows = Math.round(d.sqft * (svc.windowsPerSqFt || 0.0125));
    const windowType = svc.windowTypes.find((wt) => wt.id === (d.windowType || "casement")) || svc.windowTypes[0];
    const pkg = packageKey || "standard";

    let perWindowPrice;
    if (windowType.priceByPackage && windowType.priceByPackage[pkg]) {
      // Per-package pricing (new system: each tier has its own price)
      perWindowPrice = windowType.priceByPackage[pkg];
    } else if (windowType.pricePerWindow) {
      // Legacy flat per-window price
      perWindowPrice = windowType.pricePerWindow;
    } else {
      // Legacy base Ã multiplier
      perWindowPrice = svc.perWindow * (windowType.multiplier || 1);
    }

    let total = estimatedWindows * applyGlobal(perWindowPrice);

    // Add doors
    if (d.doors && svc.doorPrice) {
      total += d.doors * applyGlobal(svc.doorPrice);
    }

    // Add extras (screen cleaning is per-unit, others per-window)
    const extras = selectedExtras || [];
    extras.forEach((extId) => {
      const ext = svc.extras.find((e) => e.id === extId);
      if (!ext) return;
      // Skip extras that require a higher package tier
      if (ext.minPackage) {
        const tierOrder = ["standard", "premium", "platinum"];
        if (tierOrder.indexOf(pkg) < tierOrder.indexOf(ext.minPackage)) return;
      }
      if (ext.pricePerUnit) {
        // Per-unit pricing (e.g. screen cleaning: $3/screen, default = window count)
        const unitCount = d[ext.unit + "s"] || d[ext.unit + "Count"] || estimatedWindows;
        total += unitCount * applyGlobal(ext.pricePerUnit);
      } else {
        total += estimatedWindows * applyGlobal(ext.price);
      }
    });

    // Stories multiplier
    if (SERVICES_WITH_STORIES.includes(svc.id)) {
      if (globalStories === 2) total *= 1.25;
      else if (globalStories >= 3) total *= 1.5;
    }
    return total;
  }

  let total = applyGlobal(svc.basePrice);

  if (svc.perSqFt) total += tieredSqFtCost(d.sqft || 0, applyGlobal(svc.perSqFt), svc.sqftTiers);
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
  const d = bundleDiscounts || {};
  if (count >= 5) return d[5] ?? 25;
  if (count >= 4) return d[4] ?? 20;
  if (count >= 3) return d[3] ?? 15;
  if (count >= 2) return d[2] ?? 10;
  return 0;
}

/**
 * Get the final price for a package tier (legacy â applies one multiplier to total).
 */
export function getPackagePrice(basePrice, discountPercent, packageMultiplier) {
  const discounted = basePrice * (1 - discountPercent / 100);
  return discounted * packageMultiplier;
}

/**
 * Calculate the total package price across all services, respecting per-service
 * package pricing (like window cleaning) while using the global multiplier for
 * everything else.
 *
 * Services with `hasPackagePricing: true` calculate their own price for each
 * package tier. All other services use: basePrice Ã globalMultiplier.
 */
export function calculateTotalPackagePrice(
  selectedServices, allServices, allDetails, allExtras,
  globalPriceAdj, globalStories, discountPercent, packageKey, packageMultiplier
) {
  let total = 0;

  selectedServices.forEach((svcId) => {
    const svc = allServices.find((sv) => sv.id === svcId);
    if (!svc) return;

    if (svc.hasPackagePricing) {
      // This service has its own per-package prices (e.g. window cleaning)
      // Calculate directly with the packageKey â no global multiplier needed
      const svcPrice = calculateServicePrice(svc, allDetails[svcId], allExtras[svcId], globalPriceAdj, globalStories, packageKey);
      total += svcPrice;
    } else {
      // Standard service â calculate base price, then apply global multiplier
      const svcBase = calculateServicePrice(svc, allDetails[svcId], allExtras[svcId], globalPriceAdj, globalStories);
      total += svcBase * packageMultiplier;
    }
  });

  // Apply bundle discount to the total
  return total * (1 - discountPercent / 100);
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
