import React from "react";
import ChatbotWidget from "../ui/ChatbotWidget.jsx";

// Wraps Patient/Doctor/Staff screens in a phone mockup, because the SRS
// (Section 2.5) requires these roles to be a native mobile app, not a website.
export default function PhoneFrame({ children, tabs, active, onTab, role, user }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      <div
        style={{
          width: 390,
          height: 780,
          borderRadius: 44,
          background: "var(--ink-deep)",
          padding: 12,
          boxShadow: "0 30px 60px -20px rgba(11,36,34,.35)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 34,
            background: "var(--mist)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Dynamic island / notch */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 26,
              background: "var(--ink-deep)",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              zIndex: 10,
            }}
          />
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 26 }}>{children}</div>
          <div style={{ display: "flex", borderTop: "1px solid var(--line)", background: "var(--surface)", padding: "8px 6px 14px" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "6px 0",
                  color: active === t.key ? "var(--ink)" : "#9CAAA6",
                }}
              >
                <t.icon size={19} strokeWidth={active === t.key ? 2.4 : 1.8} />
                <span className="f-body" style={{ fontSize: 10, fontWeight: active === t.key ? 700 : 500 }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chatbot — patient role only, mounted inside phone frame */}
        {role === "patient" && (
          <ChatbotWidget userName={user?.name} />
        )}
      </div>
    </div>
  );
}
