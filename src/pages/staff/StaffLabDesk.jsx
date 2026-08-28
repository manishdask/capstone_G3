import React, { useEffect, useState } from "react";
import { FlaskConical, Check } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listLabOrders, uploadLabResult, releaseLabResult } from "../../services/labService.js";

export default function StaffLabDesk({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [resultText, setResultText] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrders(await listLabOrders({ branch_id: user?.branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.branchId]);

  async function handleComplete(orderId) {
    if (!resultText.trim()) {
      setFormError("Please input the laboratory report findings.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const result = await uploadLabResult(orderId, { resultDetails: resultText.trim(), file });
      await releaseLabResult(result.id);
      setSelectedId(null);
      setResultText("");
      setFile(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading lab desk…" />;

  const pending = orders.filter((l) => l.status !== "Ready");
  const completed = orders.filter((l) => l.status === "Ready");

  return (
    <div>
      <ScreenHeader title="Lab & Diagnostics Desk" subtitle="Record findings and upload reports" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
            Pending Test Requests ({pending.length})
          </div>

          {pending.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 16 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>No pending lab or imaging requests.</div>
            </Card>
          ) : (
            pending.map((l) => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{l.test}</div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                      Patient: <strong>{l.patientName}</strong> ({l.patientId})
                    </div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      Requested by: {l.requestedBy}
                    </div>
                  </div>
                  <Badge tone="danger">{l.status}</Badge>
                </div>

                {selectedId === l.id ? (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                    <label className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                      Laboratory Findings / Observations
                    </label>
                    <textarea
                      rows={3}
                      value={resultText}
                      onChange={(e) => setResultText(e.target.value)}
                      placeholder="Enter quantitative values and diagnostic summary..."
                      className="f-body"
                      style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12, resize: "none" }}
                    />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="f-body"
                      style={{ marginTop: 8, fontSize: 12 }}
                    />
                    {formError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, marginTop: 4 }}>{formError}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Button small variant="dark" icon={Check} disabled={submitting} onClick={() => handleComplete(l.id)}>
                        {submitting ? "Finalizing…" : "Finalize & Sign"}
                      </Button>
                      <Button small variant="ghost" onClick={() => { setSelectedId(null); setFormError(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <Button small icon={FlaskConical} onClick={() => { setSelectedId(l.id); setResultText(""); setFile(null); setFormError(""); }}>
                      Enter Findings
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <div>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
            Completed Reports ({completed.length})
          </div>

          {completed.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 16 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>No completed lab tests yet.</div>
            </Card>
          ) : (
            completed.map((l) => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{l.test}</div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>Patient: <strong>{l.patientName}</strong></div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      Result: <span style={{ color: "var(--sage)", fontWeight: 500 }}>{l.result}</span>
                    </div>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Released on: {l.date}</div>
                  </div>
                  <Badge tone="success">{l.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
