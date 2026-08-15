import React from "react";

const TONES = {
  default: { bg: "#EEF1EE", fg: "var(--ink)" },
  success: { bg: "#E7F3EB", fg: "var(--sage)" },
  warn: { bg: "#FDF2E0", fg: "var(--amber-deep)" },
  danger: { bg: "#F8E9EC", fg: "var(--rose)" },
};

export default function Badge({ children, tone = "default" }) {
  const t = TONES[tone] || TONES.default;
  return (
    <span
      className="f-body"
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}
