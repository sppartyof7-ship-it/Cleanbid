import C from "../config/colors";

export default function Badge({ children, color = C.primary }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        background: `${color}18`,
        color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </span>
  );
}
