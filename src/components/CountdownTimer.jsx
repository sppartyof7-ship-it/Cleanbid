import { useState, useEffect } from "react";
import C from "../config/colors";

function calcTimeLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownTimer({ endDate }) {
  const [time, setTime] = useState(() => calcTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTime(calcTimeLeft(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const segments = [
    ["d", "Days"],
    ["h", "Hrs"],
    ["m", "Min"],
    ["s", "Sec"],
  ];

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {segments.map(([key, label]) => (
        <div key={key} style={{ textAlign: "center" }}>
          <div
            style={{
              background: "#fff3f3",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "6px 10px",
              minWidth: 40,
              fontSize: 20,
              fontWeight: 800,
              color: "#dc2626",
            }}
          >
            {time[key] ?? 0}
          </div>
          <div
            style={{
              fontSize: 9,
              color: C.textLight,
              marginTop: 4,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
