import React from "react";

// The recurring "signature" motif — an animated ECG-style pulse line.
// Used sparingly: login screen, admin overview header, patient home card.
export default function PulseDivider({ color = "var(--ink)", width = 120, height = 20 }) {
  return (
    <svg className="pulse-line" width={width} height={height} viewBox="0 0 160 20" fill="none">
      <path
        d="M0 10 H50 L58 10 L64 2 L72 18 L78 10 H160"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
