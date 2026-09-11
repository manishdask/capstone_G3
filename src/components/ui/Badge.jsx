import React from "react";

const TONES = {
  default: { bg: "var(--tint-neutral)", fg: "var(--ink)" },
  success: { bg: "var(--tint-success)", fg: "var(--sage)" },
  warn: { bg: "var(--tint-amber)", fg: "var(--amber-deep)" },
  danger: { bg: "var(--tint-alert)", fg: "var(--rose)" },
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
