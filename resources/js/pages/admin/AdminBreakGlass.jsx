import React, { useEffect, useState } from "react";
import { ShieldAlert, Ban, ClipboardCheck } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listBreakGlassSessions, revokeBreakGlassSession, reviewBreakGlassSession } from "../../services/breakGlassService.js";

const STATUS_TONE = { active: "warn", expired: "default", revoked: "danger" };
const STATUS_LABEL = { active: "Active", expired: "Expired", revoked: "Revoked" };

/** FR51 (proposed): retrospective review queue for emergency (break-glass) access grants. */
export default function AdminBreakGlass() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      setSessions(await listBreakGlassSessions(filter ? { status: filter } : {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handleRevoke(s) {
    setBusyId(s.id);
    setError("");
    try {
      await revokeBreakGlassSession(s.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReview(s) {
    setBusyId(s.id);
    setError("");
    try {
      await reviewBreakGlassSession(s.id, notes[s.id] || "Reviewed — no further action required.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Break-Glass Access
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR51 · Emergency access overrides — every grant is time-boxed, alerted here, and awaits retrospective compliance review
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["", "active", "expired", "revoked"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="f-body"
            style={{ padding: "6px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid var(--line)", cursor: "pointer", background: filter === f ? "var(--ink)" : "#fff", color: filter === f ? "#fff" : "var(--ink-deep)" }}
          >
            {f ? STATUS_LABEL[f] : "All"}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <LoadingState label="Loading break-glass sessions…" />
      ) : sessions.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No sessions in this status.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((s) => (
            <Card key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <ShieldAlert size={13} color="var(--amber-deep)" />
                    <strong style={{ color: "var(--ink-deep)" }}>{s.requester?.name}</strong> accessed{" "}
                    <strong style={{ color: "var(--ink-deep)" }}>{s.patient?.name}</strong> ({s.patient?.globalId})
                  </div>
                  <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", marginTop: 6 }}>{s.reason}</div>
                  <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                    Granted {new Date(s.grantedAt).toLocaleString("en-AU")} · Expires {new Date(s.expiresAt).toLocaleString("en-AU")}
                  </div>
                  {s.reviewedAt && (
                    <div className="f-body" style={{ fontSize: 11, color: "var(--sage)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <ClipboardCheck size={12} /> Reviewed by {s.reviewer?.name} — {s.reviewNotes}
                    </div>
                  )}
                </div>
                <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </div>

              {!s.reviewedAt && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input
                    value={notes[s.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                    placeholder="Review notes"
                    className="f-body"
                    style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button small variant="dark" icon={ClipboardCheck} disabled={busyId === s.id} onClick={() => handleReview(s)}>
                      {busyId === s.id ? "Working…" : "Mark reviewed"}
                    </Button>
                    {s.status === "active" && (
                      <Button small variant="danger" icon={Ban} disabled={busyId === s.id} onClick={() => handleRevoke(s)}>
                        Revoke now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
