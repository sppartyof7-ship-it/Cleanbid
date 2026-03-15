import C from "../config/colors";

export default function Toggle({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: 14,
        color: C.text,
      }}
    >
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? C.secondary : C.border,
          position: "relative",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: C.white,
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "all 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      {label}
    </label>
  );
}
