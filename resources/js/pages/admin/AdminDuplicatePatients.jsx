import React, { useEffect, useState } from "react";
import { Users, GitMerge, X } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listDuplicateFlags, dismissDuplicateFlag, mergeDuplicateFlag } from "../../services/patientDuplicateService.js";

/** FR62 (proposed): possible-duplicate patient review — dismiss or merge, never automatic. */
export default function AdminDuplicatePatients() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setFlags(await listDuplicateFlags());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDismiss(flag) {
    setBusyId(flag.id);
    setError("");
    try {
      await dismissDuplicateFlag(flag.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleMerge(flag, keepPatientId) {
    setBusyId(flag.id);
    setError("");
    try {
      await mergeDuplicateFlag(flag.id, keepPatientId);
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
        Possible Duplicate Patients
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR62 · Fuzzy match on name, date of birth and contact number — authorised review required before merge
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <LoadingState label="Loading flagged records…" />
      ) : flags.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <Users size={28} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No pending duplicate flags.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {flags.map((f) => (
            <Card key={f.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>Match score: {f.score}%</div>
                <Badge tone={f.score >= 80 ? "danger" : "warn"}>Likely duplicate</Badge>
              </div>

              <div className="grid-fluid" style={{ "--col-min": "170px", "--grid-gap": "12px" }}>
                {[f.patient, f.matchedPatient].map((p, i) => (
                  <div key={p.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}>
                    <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{p.globalId}</div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5, marginTop: 2 }}>{p.name}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                      DOB: {new Date(p.dob).toLocaleDateString("en-AU")}
                    </div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{p.contact}</div>
                    <div style={{ marginTop: 8 }}>
                      <Button small variant="dark" icon={GitMerge} disabled={busyId === f.id} onClick={() => handleMerge(f, p.id)}>
                        Keep this one
                      </Button>
                    </div>
                    <div className="f-body" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                      {i === 0 ? "Newly flagged record" : "Existing matched record"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <Button small variant="ghost" icon={X} disabled={busyId === f.id} onClick={() => handleDismiss(f)}>
                  Not a duplicate — dismiss
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
