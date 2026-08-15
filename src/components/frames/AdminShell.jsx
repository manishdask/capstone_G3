import React from "react";
import { Activity, LogOut } from "lucide-react";

// Admin renders as a full desktop dashboard, because the SRS (Section 2.4)
// says admin access is via a standard web browser, unlike the other roles.
export default function AdminShell({ children, tabs, active, onTab, onLogout, user }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      <div
        style={{
          width: "min(1100px, 92vw)",
          minHeight: 700,
          background: "var(--mist)",
          borderRadius: 20,
          border: "1px solid var(--line)",
          boxShadow: "0 30px 60px -30px rgba(11,36,34,.25)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div style={{ width: 220, background: "var(--ink)", padding: "22px 14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 22px" }}>
            <Activity size={20} color="var(--amber)" />
            <span className="f-display" style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              St George HMS
            </span>
          </div>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 10px",
                border: "none",
                background: active === t.key ? "rgba(255,255,255,.1)" : "transparent",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 3,
                color: active === t.key ? "#fff" : "#B9C7C3",
              }}
            >
              <t.icon size={16} />
              <span className="f-body" style={{ fontSize: 13, fontWeight: active === t.key ? 700 : 500 }}>
                {t.label}
              </span>
            </button>
          ))}
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 12 }}>
            {user && (
              <div style={{ padding: "0 10px 10px" }}>
                <div className="f-body" style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{user.name}</div>
                <div className="f-body" style={{ color: "#8FA39E", fontSize: 11 }}>{user.email}</div>
              </div>
            )}
            <button
              onClick={onLogout}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#B9C7C3", padding: 10 }}
            >
              <LogOut size={15} /> <span className="f-body" style={{ fontSize: 12.5 }}>Log out</span>
            </button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 26, overflowY: "auto", maxHeight: 700 }}>{children}</div>
      </div>
    </div>
  );
}