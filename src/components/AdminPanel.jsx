import { useState } from "react";
import C from "../config/colors";
import s from "../config/styles";
import { deepClone } from "../utils/helpers";
import TabBar from "./TabBar";
import Toggle from "./Toggle";
import Badge from "./Badge";

export default function AdminPanel({ config, setConfig, onExit }) {
  const [adminTab, setAdminTab] = useState("pricing");

  const updateConfig = (path, value) => {
    setConfig((prev) => {
      const c = deepClone(prev);
      const keys = path.split(".");
      let obj = c;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return c;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={s.h1}>{"\u2699\uFE0F"} Admin Dashboard</h1>
        <button onClick={onExit} style={s.btnSecondary}>Lock & Exit</button>
      </div>

      <TabBar
        tabs={[
          { id: "pricing", icon: "\u{1F4B0}", label: "Pricing" },
          { id: "services", icon: "\u{1F6E0}\uFE0F", label: "Services" },
          { id: "bundles", icon: "\u{1F381}", label: "Bundles" },
          { id: "marketing", icon: "\u{1F4E3}", label: "Marketing" },
          { id: "followup", icon: "\u{1F4EC}", label: "Follow-Up" },
          { id: "settings", icon: "\u2699\uFE0F", label: "Settings" },
        ]}
        active={adminTab}
        onChange={setAdminTab}
      />

      {/* Pricing Tab */}
      {adminTab === "pricing" && (
        <div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Global Price Adjustment</h3>
            <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>Raise or lower ALL prices by a percentage.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <input type="range" min={-30} max={50} value={config.globalPriceAdjustment} onChange={(e) => updateConfig("globalPriceAdjustment", Number(e.target.value))} style={{ flex: 1, accentColor: C.primary }} />
              <div style={{ minWidth: 80, textAlign: "center", padding: "8px 16px", borderRadius: 10, background: config.globalPriceAdjustment > 0 ? C.bgAccent : config.globalPriceAdjustment < 0 ? "#fff1f2" : C.bgDark, color: config.globalPriceAdjustment > 0 ? C.secondaryDark : config.globalPriceAdjustment < 0 ? C.danger : C.textMid, fontWeight: 800, fontSize: 18 }}>
                {config.globalPriceAdjustment > 0 ? "+" : ""}{config.globalPriceAdjustment}%
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Package Multipliers</h3>
            <div style={s.grid2}>
              {Object.entries(config.packages).map(([key, pkg]) => (
                <div key={key} style={{ padding: 16, background: C.bgCardAlt, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <span style={{ fontWeight: 700, color: key === "basic" ? C.textMid : key === "standard" ? C.primary : C.accent }}>{pkg.label}</span>
                  <label style={{ ...s.label, marginTop: 10 }}>Multiplier</label>
                  <input type="number" step="0.05" value={pkg.multiplier} onChange={(e) => updateConfig(`packages.${key}.multiplier`, Number(e.target.value))} style={s.input} />
                  <label style={{ ...s.label, marginTop: 10 }}>Tagline</label>
                  <input value={pkg.tag} onChange={(e) => updateConfig(`packages.${key}.tag`, e.target.value)} style={s.input} />
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Bundle Discounts</h3>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>2 Services %</label>
                <input type="number" value={config.bundleDiscounts[2]} onChange={(e) => { const c = deepClone(config); c.bundleDiscounts[2] = Number(e.target.value); setConfig(c); }} style={s.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>3+ Services %</label>
                <input type="number" value={config.bundleDiscounts[3]} onChange={(e) => { const c = deepClone(config); c.bundleDiscounts[3] = Number(e.target.value); setConfig(c); }} style={s.input} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {adminTab === "services" &&
        config.services.map((svc, idx) => (
          <div key={svc.id} style={{ ...s.card, opacity: svc.enabled ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{svc.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{svc.name}</h3>
              </div>
              <Toggle checked={svc.enabled} onChange={(v) => updateConfig(`services.${idx}.enabled`, v)} label={svc.enabled ? "Active" : "Disabled"} />
            </div>
            <div style={s.grid2}>
              <div><label style={s.label}>Base Price</label><input type="number" value={svc.basePrice} onChange={(e) => updateConfig(`services.${idx}.basePrice`, Number(e.target.value))} style={s.input} /></div>
              {svc.perSqFt > 0 && <div><label style={s.label}>Per Sq Ft</label><input type="number" step="0.01" value={svc.perSqFt} onChange={(e) => updateConfig(`services.${idx}.perSqFt`, Number(e.target.value))} style={s.input} /></div>}
              {svc.perWindow > 0 && <div><label style={s.label}>Per Window</label><input type="number" step="0.5" value={svc.perWindow} onChange={(e) => updateConfig(`services.${idx}.perWindow`, Number(e.target.value))} style={s.input} /></div>}
              {svc.perLinFt > 0 && <div><label style={s.label}>Per Linear Ft</label><input type="number" step="0.1" value={svc.perLinFt} onChange={(e) => updateConfig(`services.${idx}.perLinFt`, Number(e.target.value))} style={s.input} /></div>}
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Add-Ons</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {svc.extras.map((ext, ei) => (
                  <div key={ext.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.bgCardAlt, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.textMid }}>{ext.label}</span>
                    <input type="number" value={ext.price} onChange={(e) => updateConfig(`services.${idx}.extras.${ei}.price`, Number(e.target.value))} style={{ ...s.input, width: 70, padding: "4px 8px", fontSize: 13 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

      {/* Bundles Tab */}
      {adminTab === "bundles" && (
        <div>
          {config.seasonalBundles.map((bundle, bi) => (
            <div key={bundle.id} style={{ ...s.card, borderLeft: `3px solid ${bundle.active ? C.primary : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{bundle.name}</h3>
                <Toggle checked={bundle.active} onChange={(v) => updateConfig(`seasonalBundles.${bi}.active`, v)} label={bundle.active ? "Live" : "Off"} />
              </div>
              <div style={s.grid2}>
                <div><label style={s.label}>Name</label><input value={bundle.name} onChange={(e) => updateConfig(`seasonalBundles.${bi}.name`, e.target.value)} style={s.input} /></div>
                <div><label style={s.label}>Discount %</label><input type="number" value={bundle.discount} onChange={(e) => updateConfig(`seasonalBundles.${bi}.discount`, Number(e.target.value))} style={s.input} /></div>
                <div><label style={s.label}>End Date</label><input type="date" value={bundle.endDate} onChange={(e) => updateConfig(`seasonalBundles.${bi}.endDate`, e.target.value)} style={s.input} /></div>
                <div><label style={s.label}>Tagline</label><input value={bundle.tagline} onChange={(e) => updateConfig(`seasonalBundles.${bi}.tagline`, e.target.value)} style={s.input} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Services</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {config.services.map((svc) => {
                    const inB = bundle.services.includes(svc.id);
                    return (
                      <button key={svc.id} onClick={() => { const c = deepClone(config); c.seasonalBundles[bi].services = inB ? c.seasonalBundles[bi].services.filter((x) => x !== svc.id) : [...c.seasonalBundles[bi].services, svc.id]; setConfig(c); }}
                        style={{ padding: "6px 12px", borderRadius: 16, border: `1px solid ${inB ? C.primary : C.border}`, background: inB ? `${C.primary}12` : C.white, color: inB ? C.primary : C.textLight, fontSize: 12, cursor: "pointer" }}>
                        {svc.icon} {svc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { const c = deepClone(config); c.seasonalBundles.push({ id: `b_${Date.now()}`, name: "New Bundle", services: [], discount: 10, active: false, endDate: "2026-12-31", tagline: "Limited time!" }); setConfig(c); }} style={s.btnPrimary}>+ Add Bundle</button>
        </div>
      )}

      {/* Marketing Tab */}
      {adminTab === "marketing" && (
        <div>
          {[
            { key: "showUrgencyTimer", title: "Urgency Timer", fields: [{ k: "urgencyMessage", l: "Message", t: "text" }, { k: "urgencyEndDate", l: "End Date", t: "date" }] },
            { key: "showSocialProof", title: "Social Proof", fields: [{ k: "socialProofCount", l: "People Count", t: "number" }] },
            { key: "showLimitedOffer", title: "Limited-Time Offer", fields: [{ k: "limitedOfferText", l: "Offer Text", t: "text" }] },
            { key: "showReviewBadge", title: "Review Badge", fields: [{ k: "reviewCount", l: "Count", t: "number" }, { k: "reviewAverage", l: "Rating", t: "number" }] },
          ].map((sec) => (
            <div key={sec.key} style={s.card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{sec.title}</h3>
              <Toggle checked={config.marketing[sec.key]} onChange={(v) => updateConfig(`marketing.${sec.key}`, v)} label={config.marketing[sec.key] ? "Enabled" : "Disabled"} />
              {config.marketing[sec.key] && (
                <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                  {sec.fields.map((f) => (
                    <div key={f.k} style={{ flex: 1, minWidth: 180 }}>
                      <label style={s.label}>{f.l}</label>
                      <input type={f.t} step={f.t === "number" ? "0.1" : undefined} value={config.marketing[f.k]} onChange={(e) => updateConfig(`marketing.${f.k}`, f.t === "number" ? Number(e.target.value) : e.target.value)} style={s.input} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Follow-Up Tab */}
      {adminTab === "followup" && (
        <div>
          <p style={{ color: C.textLight, fontSize: 14, marginBottom: 20 }}>
            Variables: {"{{name}}"}, {"{{business}}"}, {"{{total}}"}, {"{{services}}"}
          </p>
          {config.followUp.sequences.map((seq, si) => (
            <div key={seq.id} style={{ ...s.card, borderLeft: `3px solid ${seq.active ? (seq.type === "sms" ? C.secondary : C.primary) : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge color={seq.type === "sms" ? C.secondary : C.primary}>{seq.type}</Badge>
                  <span style={{ color: C.textLight, fontSize: 13 }}>After: {seq.delay}</span>
                </div>
                <Toggle checked={seq.active} onChange={(v) => updateConfig(`followUp.sequences.${si}.active`, v)} label="" />
              </div>
              <div style={{ ...s.grid2, marginBottom: 12 }}>
                <div><label style={s.label}>Delay</label><input value={seq.delay} onChange={(e) => updateConfig(`followUp.sequences.${si}.delay`, e.target.value)} style={s.input} /></div>
                <div>
                  <label style={s.label}>Type</label>
                  <select value={seq.type} onChange={(e) => updateConfig(`followUp.sequences.${si}.type`, e.target.value)} style={s.input}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              {seq.type === "email" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={s.label}>Subject</label>
                  <input value={seq.subject} onChange={(e) => updateConfig(`followUp.sequences.${si}.subject`, e.target.value)} style={s.input} />
                </div>
              )}
              <div>
                <label style={s.label}>Body</label>
                <textarea value={seq.body} onChange={(e) => updateConfig(`followUp.sequences.${si}.body`, e.target.value)} rows={3} style={{ ...s.input, resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>
          ))}
          <button onClick={() => { const c = deepClone(config); c.followUp.sequences.push({ id: `${Date.now()}`, delay: "7 days", type: "email", subject: "Following up", body: "Hi {{name}},\n\nChecking in about your quote for {{total}}.", active: false }); setConfig(c); }} style={s.btnPrimary}>+ Add Step</button>
        </div>
      )}

      {/* Settings Tab */}
      {adminTab === "settings" && (
        <div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Business Settings</h3>
            <div style={s.grid2}>
              <div><label style={s.label}>Business Name</label><input value={config.businessName} onChange={(e) => updateConfig("businessName", e.target.value)} style={s.input} /></div>
              <div><label style={s.label}>Admin Password</label><input type="password" value={config.adminPassword} onChange={(e) => updateConfig("adminPassword", e.target.value)} style={s.input} /></div>
            </div>
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Lead Sources</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {config.leadSources.map((src, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: C.bgCardAlt, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.textMid }}>
                  {src}
                  <button onClick={() => { const c = deepClone(config); c.leadSources.splice(i, 1); setConfig(c); }} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 14, padding: 0, marginLeft: 4 }}>{"\u00D7"}</button>
                </div>
              ))}
            </div>
            <input placeholder="Add lead source + Enter" style={s.input} onKeyDown={(e) => { if (e.key === "Enter" && e.target.value) { const c = deepClone(config); c.leadSources.push(e.target.value); setConfig(c); e.target.value = ""; } }} />
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Lead Email Notifications</h3>
            <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>Get an email every time a customer submits a quote. Get your free access key at <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" style={{ color: C.primary }}>web3forms.com</a> — just enter the email address below.</p>
            <div style={s.grid2}>
              <div><label style={s.label}>Notification Email</label><input type="email" placeholder="tim.sullivan@clouteinc.com" value={config.notificationEmail || ""} onChange={(e) => updateConfig("notificationEmail", e.target.value)} style={s.input} /></div>
              <div><label style={s.label}>Web3Forms Access Key</label><input type="text" placeholder="Paste your access key here" value={config.web3formsKey || ""} onChange={(e) => updateConfig("web3formsKey", e.target.value)} style={s.input} /></div>
            </div>
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Export Config</h3>
            <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(config, null, 2))} style={s.btnPrimary}>Copy Config to Clipboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
