import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

export default function AdminAudit({ logs = [] }) {
  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Audit compliance log
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        NFR12 · Real-time tracking of security logins, database modifications, and configurations
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {logs.length === 0 ? (
          <div className="f-body" style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
            No logs available.
          </div>
        ) : (
          logs.map((a, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < logs.length - 1 ? "1px solid var(--line)" : "none" }}
            >
              {a.outcome === "Denied" ? <AlertTriangle size={16} color="var(--rose)" /> : <ShieldCheck size={16} color="var(--sage)" />}
              <div style={{ flex: 1 }}>
                <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>
                  {a.action}
                </div>
                <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", wordBreak: "break-all" }}>
                  {a.user} → {a.target}
                </div>
              </div>
              <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {a.time}
              </div>
              <Badge tone={a.outcome === "Denied" ? "danger" : "success"}>{a.outcome}</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
