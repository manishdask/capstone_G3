import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Download, ShieldAlert, KeyRound, Users, Search } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listAuditLogs, exportAuditLogsCsv, listSecurityAlerts } from "../../services/auditService.js";

const EMPTY_FILTERS = { action: "", object_type: "", outcome: "", from: "", to: "" };

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [exporting, setExporting] = useState(false);

  const [alerts, setAlerts] = useState(null);
  const [alertsError, setAlertsError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      setLogs(await listAuditLogs(params));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    setAlertsError("");
    try {
      setAlerts(await listSecurityAlerts());
    } catch (err) {
      setAlertsError(err.message);
    }
  }

  useEffect(() => {
    load();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      await exportAuditLogsCsv(params);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Audit compliance log
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR55/56 · NFR12 · Actor, action, object and outcome logged on every sensitive write — filterable, exportable, alerted
      </div>

      <SecurityAlertsPanel alerts={alerts} error={alertsError} onRetry={loadAlerts} />

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 10 }}>
          <input placeholder="Action contains…" value={filters.action} onChange={(e) => setFilter("action", e.target.value)} className="f-body" style={{ padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }} />
          <input placeholder="Object type" value={filters.object_type} onChange={(e) => setFilter("object_type", e.target.value)} className="f-body" style={{ padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }} />
          <select value={filters.outcome} onChange={(e) => setFilter("outcome", e.target.value)} className="f-body" style={{ padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }}>
            <option value="">Any outcome</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} className="f-body" style={{ padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }} />
          <input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} className="f-body" style={{ padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button small variant="dark" icon={Search} onClick={load}>Apply Filters</Button>
          <Button small variant="ghost" onClick={() => { setFilters(EMPTY_FILTERS); load(); }}>Clear</Button>
          <Button small variant="ghost" icon={Download} onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </Card>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <LoadingState label="Loading audit trail…" />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {logs.length === 0 ? (
            <div className="f-body" style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
              No logs match these filters.
            </div>
          ) : (
            logs.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < logs.length - 1 ? "1px solid var(--line)" : "none" }}>
                {a.outcome === "Denied" ? <AlertTriangle size={16} color="var(--rose)" /> : <ShieldCheck size={16} color="var(--sage)" />}
                <div style={{ flex: 1 }}>
                  <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>{a.action}</div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", wordBreak: "break-all" }}>{a.user} → {a.target}</div>
                </div>
                <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{a.time}</div>
                <Badge tone={a.outcome === "Denied" ? "danger" : "success"}>{a.outcome}</Badge>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

function SecurityAlertsPanel({ alerts, error, onRetry }) {
  if (error) {
    return <div style={{ marginBottom: 14 }}><ErrorState message={error} onRetry={onRetry} /></div>;
  }
  if (!alerts) return null;

  const { repeatedFailedLogins, privilegedChanges, unusualRecordAccess } = alerts;
  const total = repeatedFailedLogins.length + privilegedChanges.length + unusualRecordAccess.length;

  if (total === 0) {
    return (
      <Card style={{ marginBottom: 14, background: "#E7F3EB", border: "1px solid #CFE6D6" }}>
        <div className="f-body" style={{ fontSize: 12.5, color: "var(--sage)", display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={15} /> No automated security alerts right now (FR56).
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 14, background: "#FDF2E0", border: "1px solid #F2E0B8" }}>
      <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, color: "var(--amber-deep)" }}>
        <ShieldAlert size={16} /> Automated Security Alerts (FR56) — {total}
      </div>

      {repeatedFailedLogins.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="f-body" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <KeyRound size={12} /> Repeated failed logins ({repeatedFailedLogins.length})
          </div>
          {repeatedFailedLogins.map((r, i) => (
            <div key={i} className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)", padding: "3px 0" }}>
              {r.actorEmail || r.ipAddress || "Unknown"} — {r.attempts} failed attempts, last at {new Date(r.latestAt).toLocaleString("en-AU")}
            </div>
          ))}
        </div>
      )}

      {unusualRecordAccess.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="f-body" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={12} /> Unusual patient record access ({unusualRecordAccess.length})
          </div>
          {unusualRecordAccess.map((r, i) => (
            <div key={i} className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)", padding: "3px 0" }}>
              {r.actorEmail} touched {r.distinctRecords} distinct patient records in the last hour
            </div>
          ))}
        </div>
      )}

      {privilegedChanges.length > 0 && (
        <div>
          <div className="f-body" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldAlert size={12} /> Privileged changes, last 24h ({privilegedChanges.length})
          </div>
          {privilegedChanges.slice(0, 8).map((r, i) => (
            <div key={i} className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)", padding: "3px 0" }}>
              {r.actorEmail} — {r.action} {r.outcome === "failure" ? "(failed)" : ""}
            </div>
          ))}
          {privilegedChanges.length > 8 && (
            <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              + {privilegedChanges.length - 8} more — filter the log below by action or date range.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
