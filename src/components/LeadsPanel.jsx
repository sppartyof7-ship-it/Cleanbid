import { useState } from "react";
import C from "../config/colors";
import s from "../config/styles";
import { fmt } from "../utils/helpers";
import Badge from "./Badge";
import PhotoUploader from "./PhotoUploader";

export default function LeadsPanel({ leads, setLeads, config }) {
  const [leadFilter, setLeadFilter] = useState("all");
  const [expandedLead, setExpandedLead] = useState(null);
  const [repPhotos, setRepPhotos] = useState({});

  const filteredLeads = leads.filter(
    (l) => leadFilter === "all" || l.status === leadFilter
  );

  const stats = [
    { label: "Total Leads", value: leads.length, color: C.primary, bg: `${C.primary}10` },
    { label: "Pending", value: leads.filter((l) => l.status === "pending").length, color: C.warning, bg: `${C.warning}15` },
    { label: "Won", value: leads.filter((l) => l.status === "won").length, color: C.secondary, bg: C.bgAccent },
    { label: "Revenue", value: fmt(leads.filter((l) => l.status === "won").reduce((a, l) => a + l.total, 0)), color: C.accent, bg: `${C.accent}10` },
  ];

  const updateLeadStatus = (leadId, status) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  return (
    <div>
      <h1 style={{ ...s.h1, marginBottom: 20 }}>{"\u{1F4CB}"} Lead Pipeline</h1>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...s.card, textAlign: "center", marginBottom: 0, background: stat.bg }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "pending", "won", "lost"].map((f) => (
          <button
            key={f}
            onClick={() => setLeadFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
              background: leadFilter === f ? `${C.primary}15` : C.white,
              color: leadFilter === f ? C.primary : C.textLight,
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lead cards */}
      {filteredLeads.length === 0 && (
        <div style={{ ...s.card, textAlign: "center", color: C.textLight, padding: 40 }}>
          No {leadFilter === "all" ? "" : leadFilter} leads yet.
        </div>
      )}

      {filteredLeads.map((lead) => (
        <div key={lead.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{lead.name}</span>
                <Badge color={lead.status === "won" ? C.secondary : lead.status === "pending" ? C.warning : C.danger}>{lead.status}</Badge>
                {/* Residential only — commercial badge removed */}
              </div>
              <div style={{ fontSize: 13, color: C.textLight }}>{lead.email} {"\u00B7"} {lead.phone}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                {lead.services.map((sid) => config.services.find((sv) => sv.id === sid)?.icon || "").join(" ")} {"\u00B7"} {config.packages[lead.package]?.label} {"\u00B7"} {lead.date}
                {lead.leadSource && <span> {"\u00B7"} via {lead.leadSource}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(lead.total)}</div>
              {lead.status === "pending" && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, "won"); }} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: C.bgAccent, color: C.secondaryDark, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Won</button>
                  <button onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, "lost"); }} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#fff1f2", color: C.danger, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Lost</button>
                </div>
              )}
            </div>
          </div>

          {expandedLead === lead.id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
              {lead.notes && <div style={{ fontSize: 13, color: C.textMid, marginBottom: 12, fontStyle: "italic" }}>{lead.notes}</div>}
              {lead.photos?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={s.label}>Customer Photos</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {lead.photos.filter((p) => p.dataUrl).map((p) => (
                      <div key={p.id} style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={p.dataUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <PhotoUploader
                photos={repPhotos[lead.id] || []}
                onPhotosChange={(updater) =>
                  setRepPhotos((prev) => ({
                    ...prev,
                    [lead.id]: typeof updater === "function" ? updater(prev[lead.id] || []) : updater,
                  }))
                }
                label={"\u{1F4F7} Sales Rep Photos (before/after, on-site)"}
                maxPhotos={20}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
