/**
 * Send a lead to Housecall Pro via our Vercel serverless function.
 * The serverless function handles:
 *   1. Searching for existing customer (avoids duplicates)
 *   2. Creating customer if new
 *   3. Creating an estimate with line items + pricing
 */
export async function sendToHousecallPro(lead, services) {
  try {
    const res = await fetch("/api/housecall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead, services }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("Housecall Pro sync failed:", data);
      return { ok: false, error: data.error || "Unknown error", details: data.details };
    }

    console.log("Housecall Pro sync:", data.message);
    return { ok: true, ...data };
  } catch (err) {
    console.error("Housecall Pro sync error:", err);
    return { ok: false, error: err.message };
  }
}
