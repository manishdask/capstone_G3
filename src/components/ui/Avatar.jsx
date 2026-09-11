import React from "react";

export default function Avatar({ name, size = 40, bg = "var(--ink)" }) {
  // Callers pass names straight off API records, which can be blank when a
  // relation didn't load — splitting undefined would take down the whole screen.
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return (
    <div
      className="f-display"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
