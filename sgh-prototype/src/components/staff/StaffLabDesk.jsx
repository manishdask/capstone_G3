import React, { useState } from "react";
import { FlaskConical, Check, AlertCircle } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

export default function StaffLabDesk({ labRequests, onUpdateLab }) {
  const [selectedId, setSelectedId] = useState(null);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState("");

  const pending = labRequests.filter((l) => l.status !== "Ready");
  const completed = labRequests.filter((l) => l.status === "Ready");

  function handleComplete(id) {
    if (!resultText.trim()) {
      setError("Please input the laboratory report findings.");
      return;
    }
    setError("");
    onUpdateLab(id, {
      result: resultText.trim(),
      status: "Ready",
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    });
    setSelectedId(null);
    setResultText("");
  }

  return (
    <div>
      <ScreenHeader title="Lab & Diagnostics Desk" subtitle="Record findings and upload reports" />

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
            Pending Test Requests ({pending.length})
          </div>

          {pending.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 16 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>
                No pending lab or imaging requests.
              </div>
            </Card>
          ) : (
            pending.map((l) => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {l.test}
                    </div>
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
                    {error && (
                      <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, marginTop: 4 }}>
                        {error}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Button small variant="dark" icon={Check} onClick={() => handleComplete(l.id)}>
                        Finalize & Sign
                      </Button>
                      <Button small variant="ghost" onClick={() => setSelectedId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <Button small icon={FlaskConical} onClick={() => { setSelectedId(l.id); setResultText(""); setError(""); }}>
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
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>
                No completed lab tests in this session.
              </div>
            </Card>
          ) : (
            completed.map((l) => (
              <Card key={l.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {l.test}
                    </div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                      Patient: <strong>{l.patientName}</strong>
                    </div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      Result: <span style={{ color: "var(--sage)", fontWeight: 500 }}>{l.result}</span>
                    </div>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      Completed on: {l.date}
                    </div>
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
