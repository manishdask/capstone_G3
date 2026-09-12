import React from "react";
import { Activity, LogOut } from "lucide-react";
import InstallButton from "../ui/InstallButton.jsx";

// Admin renders as a full desktop dashboard, because the SRS (Section 2.4)
// says admin access is via a standard web browser, unlike the other roles.
export default function AdminShell({ children, tabs, active, onTab, onLogout, user }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      <div
        className="admin-shell"
        style={{
          background: "var(--mist)",
          border: "1px solid var(--line)",
          boxShadow: "0 30px 60px -30px rgba(11,36,34,.25)",
        }}
      >
        <div className="admin-sidebar" style={{ background: "var(--ink)" }}>
          <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 22px" }}>
            <Activity size={20} color="var(--amber)" />
            <span className="f-display" style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              St George HMS
            </span>
          </div>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className="admin-nav-btn"
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
                color: active === t.key ? "#fff" : "var(--on-dark-faint)",
              }}
            >
              <t.icon size={16} />
              <span className="f-body" style={{ fontSize: 13, fontWeight: active === t.key ? 700 : 500 }}>
                {t.label}
              </span>
            </button>
          ))}
          <div className="admin-sidebar-footer" style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 12 }}>
            <div style={{ padding: "0 10px 10px" }}>
              <InstallButton style={{ width: "100%", justifyContent: "center", marginBottom: 10 }} />
            </div>
            {user && (
              <div className="admin-user-block" style={{ padding: "0 10px 10px" }}>
                <div className="f-body" style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{user.name}</div>
                <div className="f-body" style={{ color: "var(--on-dark-muted)", fontSize: 11 }}>{user.email}</div>
              </div>
            )}
            <button
              onClick={onLogout}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--on-dark-faint)", padding: 10, flexShrink: 0, whiteSpace: "nowrap" }}
            >
              <LogOut size={15} /> <span className="f-body" style={{ fontSize: 12.5 }}>Log out</span>
            </button>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}