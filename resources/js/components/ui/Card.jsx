import React from "react";

export default function Card({ children, style }) {
  return (
    <div
      className="rise"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
