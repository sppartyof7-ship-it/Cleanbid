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

  const serviceNames = lead.services
    .map((svcId) => config.services.find((sv) => sv.id === svcId)?.name || svcId)
    .join(", ");

  const packageLabel = config.packages[lead.package]?.label || lead.package;

  const message = [
    `New Lead from ${config.businessName || "CleanBid"}!`,
    ``,
    `Customer: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    `Project Type: ${lead.projectType || "residential"}`,
    ``,
    `Services: ${serviceNames}`,
    `Package: ${packageLabel}`,
    `Quote Total: ${fmt(lead.total)}`,
    ``,
    lead.notes ? `Notes: ${lead.notes}` : null,
    lead.leadSource ? `Lead Source: ${lead.leadSource}` : null,
    lead.photos?.length ? `Photos Uploaded: ${lead.photos.length}` : null,
    ``,
    `Date: ${lead.date}`,
  ]
    .filter(Boolean)
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
