import { useState, useEffect, useRef, useCallback } from "react";
import C from "../config/colors";
import s from "../config/styles";

// ââ Lightweight QR Code Generator (no external dependencies) ââ
// Generates QR Code matrix using simple encoding
// Uses the QR Server API for reliable QR generation via canvas

const QR_SIZE = 280;
const SOURCES = [
  { id: "yardsign", label: "Yard Sign", icon: "\u{1F3E0}" },
  { id: "flyer", label: "Flyer / Door Hanger", icon: "\u{1F4C4}" },
  { id: "businesscard", label: "Business Card", icon: "\u{1F4C7}" },
  { id: "truck", label: "Truck / Vehicle Wrap", icon: "\u{1F69A}" },
  { id: "invoice", label: "Invoice / Receipt", icon: "\u{1F9FE}" },
  { id: "custom", label: "Custom", icon: "\u270F\uFE0F" },
];

export default function QRCodePanel({ tenantSlug, businessName }) {
  const [selectedSource, setSelectedSource] = useState("yardsign");
  const [customSource, setCustomSource] = useState("");
  const [qrLoaded, setQrLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const source = selectedSource === "custom" ? customSource : selectedSource;

  // Build the quoting URL with UTM tracking
  const baseUrl = tenantSlug
    ? `https://${tenantSlug}.mybidquick.com`
    : window.location.origin;

  const quotingUrl = source
    ? `${baseUrl}?utm_source=${encodeURIComponent(source)}&utm_medium=print&utm_campaign=qr`
    : baseUrl;

  // Use Google Charts QR API (free, no key needed, reliable)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(quotingUrl)}&margin=8&format=png`;

  const handleDownloadPNG = useCallback(() => {
    const link = document.createElement("a");
    link.download = `${tenantSlug || "mybidquick"}-qr-${source || "quote"}.png`;
    link.href = qrApiUrl;
    // Fetch as blob to avoid CORS issues
    fetch(qrApiUrl)
      .then((r) => r.blob())
      .then((blob) => {
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        // Fallback: open in new tab
        window.open(qrApiUrl, "_blank");
      });
  }, [qrApiUrl, tenantSlug, source]);

  const handleDownloadSVG = useCallback(() => {
    const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(quotingUrl)}&margin=8&format=svg`;
    fetch(svgUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.download = `${tenantSlug || "mybidquick"}-qr-${source || "quote"}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        window.open(svgUrl, "_blank");
      });
  }, [quotingUrl, tenantSlug, source]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard?.writeText(quotingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [quotingUrl]);

  return (
    <div>
      {/* Header Card */}
      <div style={s.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>{"\u{1F4F1}"}</span>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
              QR Code Generator
            </h3>
            <p style={{ fontSize: 13, color: C.textLight, margin: 0, marginTop: 2 }}>
              Print-ready QR codes for yard signs, flyers & more
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: QR Preview */}
        <div style={{ ...s.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: QR_SIZE + 40,
              height: QR_SIZE + 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              borderRadius: 16,
              border: `2px solid ${C.border}`,
              marginBottom: 16,
              position: "relative",
            }}
          >
            <img
              ref={imgRef}
              src={qrApiUrl}
              alt="QR Code"
              width={QR_SIZE}
              height={QR_SIZE}
              style={{ borderRadius: 8 }}
              onLoad={() => setQrLoaded(true)}
              onError={() => setQrLoaded(false)}
              crossOrigin="anonymous"
            />
          </div>

          <p
            style={{
              fontSize: 12,
              color: C.textLight,
              textAlign: "center",
              maxWidth: 300,
              wordBreak: "break-all",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {quotingUrl}
          </p>

          {/* Download Buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={handleDownloadPNG} style={s.btnPrimary}>
              {"\u2B07\uFE0F"} Download PNG
            </button>
            <button onClick={handleDownloadSVG} style={{ ...s.btnSecondary, fontWeight: 700 }}>
              {"\u2B07\uFE0F"} Download SVG
            </button>
            <button
              onClick={handleCopyUrl}
              style={{
                ...s.btnSecondary,
                fontWeight: 700,
                background: copied ? C.bgAccent : C.white,
                color: copied ? C.secondaryDark : C.textMid,
                borderColor: copied ? C.secondary : C.border,
              }}
            >
              {copied ? "\u2705 Copied!" : "\u{1F4CB} Copy URL"}
            </button>
          </div>
        </div>

        {/* Right: Source Selection */}
        <div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              Where will this QR code go?
            </h3>
            <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>
              Pick a source so you can track which signs & materials generate the most leads.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SOURCES.map((src) => (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${selectedSource === src.id ? C.primary : C.border}`,
                    background: selectedSource === src.id ? `${C.primary}10` : C.white,
                    color: selectedSource === src.id ? C.primaryDark : C.text,
                    fontSize: 14,
                    fontWeight: selectedSource === src.id ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{src.icon}</span>
                  {src.label}
                </button>
              ))}
            </div>

            {selectedSource === "custom" && (
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Custom Source Name</label>
                <input
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="e.g. neighborhood-event"
                  style={s.input}
                />
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div style={{ ...s.card, background: C.bgAccent, borderColor: C.secondary }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.secondaryDark, marginBottom: 8 }}>
              {"\u{1F4A1}"} Pro Tips
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: C.textMid,
                lineHeight: 1.8,
              }}
            >
              <li>Use <strong>SVG</strong> for print (yard signs, wraps) â infinite resolution</li>
              <li>Use <strong>PNG</strong> for digital (flyers, PDFs, social media)</li>
              <li>Each source gets its own UTM tag so you can see which materials bring in leads</li>
              <li>Test scan before printing â make sure it loads your quoting page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
