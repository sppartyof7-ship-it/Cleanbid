import { fmt } from "./helpers";

/**
 * Send a lead notification email via Web3Forms (free, no backend needed).
 * Get your access key at https://web3forms.com — just enter your email.
 */
export async function sendLeadNotification(lead, config) {
  const accessKey = config.web3formsKey;
  if (!accessKey) {
    console.warn("No Web3Forms access key set — skipping email notification.");
    return { ok: false, reason: "no_key" };
  }

  // Build service list with icons and individual prices
  const serviceLines = lead.services.map((svcId) => {
    const svc = config.services.find((sv) => sv.id === svcId);
    const price = lead.servicePrices?.[svcId];
    const priceStr = price != null ? ` — ${fmt(price)}` : "";
    return svc ? `  ${svc.icon} ${svc.name}${priceStr}` : `  • ${svcId}`;
  });

  const serviceNames = lead.services
    .map((svcId) => config.services.find((sv) => sv.id === svcId)?.name || svcId)
    .join(", ");

  // All 3 package options with prices
  const selectedPkg = lead.package;
  const packageLines = Object.entries(config.packages).map(([key, pkg]) => {
    const price = lead.allPackagePrices?.[key] || lead.total;
    const marker = key === selectedPkg ? " ◀ SELECTED" : "";
    return `  ${pkg.label}: ${fmt(price)}${marker}`;
  });

  const message = [
    `========================================`,
    `  NEW LEAD from ${config.businessName || "CleanBid"}`,
    `========================================`,
    ``,
    `CUSTOMER INFO`,
    `  Name:    ${lead.name}`,
    `  Email:   ${lead.email}`,
    `  Phone:   ${lead.phone}`,
    lead.address ? `  Address: ${lead.address}` : null,
    `  Type:    ${lead.projectType || "residential"}`,
    ``,
    `SERVICES REQUESTED`,
    ...serviceLines,
    ``,
    `PACKAGE OPTIONS`,
    ...packageLines,
    ``,
    `----------------------------------------`,
    `  CUSTOMER CHOSE: ${config.packages[selectedPkg]?.label || selectedPkg} — ${fmt(lead.total)}`,
    `----------------------------------------`,
    ``,
    lead.notes ? `NOTES\n  ${lead.notes}` : null,
    lead.notes ? `` : null,
    lead.leadSource ? `LEAD SOURCE: ${lead.leadSource}` : null,
    lead.photos?.length ? `PHOTOS UPLOADED: ${lead.photos.length}` : null,
    ``,
    `Date: ${lead.date}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New Lead: ${lead.name} — ${fmt(lead.total)} (${serviceNames})`,
        from_name: config.businessName || "CleanBid",
        message,
      }),
    });
    const data = await res.json();
    return { ok: data.success, data };
  } catch (err) {
    console.error("Failed to send lead notification email:", err);
    return { ok: false, error: err.message };
  }
}
