import React from "react";
import ChatbotWidget from "../ui/ChatbotWidget.jsx";

// Wraps Patient/Doctor/Staff screens in a phone mockup, because the SRS
// (Section 2.5) requires these roles to be a native mobile app, not a website.
export default function PhoneFrame({ children, tabs, active, onTab, role, user }) {
  return (
    <div className="phone-shell">
      <div
        className="phone-frame"
        style={{
          background: "var(--ink-deep)",
          boxShadow: "0 30px 60px -20px rgba(11,36,34,.35)",
        }}
      >
        <div className="phone-screen" style={{ background: "var(--mist)" }}>
          {/* Dynamic island / notch */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(120px, 34%)",
              height: 26,
              background: "var(--ink-deep)",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              zIndex: 10,
            }}
          />
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 26 }}>{children}</div>
          <div style={{ display: "flex", borderTop: "1px solid var(--line)", background: "var(--surface)", padding: "8px 6px 14px", flexShrink: 0 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                style={{
                  // min-width:0 lets a 6-tab bar compress on a 320px screen
                  // instead of forcing the row wider than the phone screen.
                  flex: "1 1 0",
                  minWidth: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "6px 2px",
                  color: active === t.key ? "var(--ink)" : "var(--on-dark-muted)",
                }}
              >
                <t.icon size={19} strokeWidth={active === t.key ? 2.4 : 1.8} />
                <span className="f-body phone-tab-label" style={{ fontWeight: active === t.key ? 700 : 500 }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* Chatbot — patient role only. Rendered INSIDE the phone's screen
              container (which is position:relative) so ChatbotWidget's own
              absolute bottom/right anchors to the phone screen just above the
              tab bar — not to the browser viewport as it did before. */}
          {role === "patient" && (
            <ChatbotWidget userName={user?.name} />
          )}
        </div>
      </div>
    </div>
  );
}
