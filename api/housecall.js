/**
 * Vercel Serverless Function: Housecall Pro Integration
 *
 * Receives a CleanBid lead and:
 * 1. Searches for existing customer by email (avoids duplicates!)
 * 2. Creates customer if not found
 * 3. Creates an estimate with line items and pricing
 *
 * Environment variable required: HOUSECALL_PRO_API_KEY
 */

const HCP_BASE = "https://api.housecallpro.com";

async function hcpFetch(path, options = {}) {
  const apiKey = process.env.HOUSECALL_PRO_API_KEY;
  if (!apiKey) throw new Error("HOUSECALL_PRO_API_KEY not set");

  const res = await fetch(`${HCP_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
      ...options.headers,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`HCP API ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Search for an existing customer by email to avoid duplicates.
 * Falls back to phone search if no email match.
 */
async function findCustomer(email, phone) {
  // Search by email first
  if (email) {
    const result = await hcpFetch(`/customers?q=${encodeURIComponent(email)}&page_size=5`);
    const customers = result.customers || [];
    const match = customers.find(
      (c) => c.email && c.email.toLowerCase() === email.toLowerCase()
    );
    if (match) return match;
  }

  // Fall back to phone search
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    const result = await hcpFetch(`/customers?q=${encodeURIComponent(cleanPhone)}&page_size=5`);
    const customers = result.customers || [];
    const match = customers.find((c) => {
      const cPhone = (c.mobile_number || c.home_number || "").replace(/\D/g, "");
      return cPhone && cPhone === cleanPhone;
    });
    if (match) return match;
  }

  return null;
}

/**
 * Create a new customer in Housecall Pro.
 */
async function createCustomer(lead) {
  const nameParts = lead.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "";

  const body = {
    first_name: firstName,
    last_name: lastName,
    email: lead.email,
    mobile_number: lead.phone.replace(/\D/g, ""),
    notifications_enabled: true,
    company_name: lead.projectType === "commercial" ? lead.name : undefined,
  };

  // Add address if provided
  if (lead.address) {
    body.addresses = [
      {
        street: lead.address,
        type: "service",
      },
    ];
  }

  const result = await hcpFetch("/customers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result;
}

/**
 * Create an estimate in Housecall Pro linked to a customer.
 */
async function createEstimate(customerId, lead, services) {
  // Build line items from the selected services with pricing
  const lineItems = lead.services.map((svcId) => {
    const svc = services.find((s) => s.id === svcId);
    const price = lead.servicePrices?.[svcId] || 0;
    return {
      name: svc ? svc.name : svcId,
      description: svc ? svc.description || "" : "",
      unit_price: price * 100, // HCP uses cents
      quantity: 1,
      kind: "service",
    };
  });

  // Build a note with all the context
  const noteLines = [
    `CleanBid Quote — ${lead.package} package`,
    `Total: $${(lead.total || 0).toFixed(2)}`,
    "",
    `All package options:`,
    lead.allPackagePrices
      ? Object.entries(lead.allPackagePrices)
          .map(([k, v]) => `  ${k}: $${v.toFixed(2)}${k === lead.package ? " (selected)" : ""}`)
          .join("\n")
      : "",
    "",
    lead.notes ? `Customer notes: ${lead.notes}` : "",
    lead.leadSource ? `Lead source: ${lead.leadSource}` : "",
    lead.photos?.length ? `${lead.photos.length} photo(s) uploaded` : "",
    `Project type: ${lead.projectType || "residential"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const body = {
    customer_id: customerId,
    message: noteLines,
    line_items: lineItems,
  };

  // Add address if we have one
  if (lead.address) {
    body.note = `Service address: ${lead.address}`;
  }

  const result = await hcpFetch("/estimates", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lead, services } = req.body;

    if (!lead || !lead.name || !lead.email) {
      return res.status(400).json({ error: "Missing lead data (name, email required)" });
    }

    // Step 1: Search for existing customer (avoid duplicates!)
    let customer = await findCustomer(lead.email, lead.phone);
    let customerCreated = false;

    // Step 2: Create customer if not found
    if (!customer) {
      customer = await createCustomer(lead);
      customerCreated = true;
    }

    const customerId = customer.id;

    // Step 3: Create the estimate
    const estimate = await createEstimate(customerId, lead, services);

    return res.status(200).json({
      success: true,
      customerId,
      customerCreated,
      estimateId: estimate.id,
      message: customerCreated
        ? `New customer + estimate created in Housecall Pro`
        : `Estimate added to existing customer in Housecall Pro`,
    });
  } catch (err) {
    console.error("Housecall Pro error:", err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message,
      details: err.data || null,
    });
  }
}
