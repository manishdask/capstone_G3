import React from "react";

export default function ScreenHeader({ title, subtitle, right }) {
  return (
    <div style={{ padding: "22px 18px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)" }}>
            {title}
          </div>
          {subtitle && (
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </div>
  );
}
