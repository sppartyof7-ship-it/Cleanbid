import C from "../config/colors";

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: C.bgDark,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: active === tab.id ? C.white : "transparent",
            color: active === tab.id ? C.primary : C.textLight,
            boxShadow: active === tab.id ? C.shadow : "none",
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
