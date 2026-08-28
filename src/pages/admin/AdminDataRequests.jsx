import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listDataRequests, assignDataRequest, decideDataRequest } from "../../services/dataRequestService.js";

const STATUS_TONE = { pending: "warn", in_review: "warn", approved: "success", rejected: "danger" };
const STATUS_LABEL = { pending: "Pending", in_review: "In review", approved: "Approved", rejected: "Rejected" };

/** FR61 (proposed): staff review queue — identity check, assignment, decision. */
export default function AdminDataRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRequests(await listDataRequests(filter ? { status: filter } : {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handleVerifyIdentity(r) {
    setBusyId(r.id);
    setError("");
    try {
      await assignDataRequest(r.id, true);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecide(r, status) {
    setBusyId(r.id);
    setError("");
    try {
      await decideDataRequest(r.id, status, notes[r.id] || "");
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
        Patient Data Requests
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR61 · Access & correction requests — identity check, assignment and decision
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["", "pending", "in_review", "approved", "rejected"].map((f) => (
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
        <LoadingState label="Loading requests…" />
      ) : requests.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No requests in this status.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r) => (
            <Card key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                    <strong style={{ color: "var(--ink-deep)" }}>{r.patientName}</strong> ({r.patientId})
                  </div>
                  <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700, textTransform: "capitalize", marginTop: 2 }}>{r.type} request</div>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)", marginTop: 4 }}>{r.details}</div>
                  {r.assignee && (
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      Assigned to {r.assignee} · Identity {r.identityVerified ? "verified" : "not yet verified"}
                    </div>
                  )}
                  {r.decidedAt && (
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      Decided by {r.decider} on {new Date(r.decidedAt).toLocaleDateString("en-AU")}
                    </div>
                  )}
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </div>

              {r.status === "pending" && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <Button small variant="dark" icon={ShieldCheck} disabled={busyId === r.id} onClick={() => handleVerifyIdentity(r)}>
                    {busyId === r.id ? "Working…" : "Verify identity & assign to me"}
                  </Button>
                </div>
              )}

              {r.status === "in_review" && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <input
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="Decision notes (optional)"
                    className="f-body"
                    style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button small variant="dark" icon={Check} disabled={busyId === r.id} onClick={() => handleDecide(r, "approved")}>Approve</Button>
                    <Button small variant="danger" icon={X} disabled={busyId === r.id} onClick={() => handleDecide(r, "rejected")}>Reject</Button>
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
