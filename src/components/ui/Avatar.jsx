import React from "react";

export default function Avatar({ name, size = 40, bg = "var(--ink)" }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
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
