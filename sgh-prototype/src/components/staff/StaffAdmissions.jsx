import React, { useState } from "react";
import { UserCheck, UserX, Plus } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

export default function StaffAdmissions({ admissions, patients, onAdmit, onDischarge }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [ward, setWard] = useState("");
  const [bed, setBed] = useState("");
  const [error, setError] = useState("");

  function handleAdmit(e) {
    e.preventDefault();
    if (!patientId) {
      setError("Please select a patient.");
      return;
    }
    if (!ward.trim()) {
      setError("Please input a ward.");
      return;
    }
    if (!bed.trim()) {
      setError("Please input a bed number.");
      return;
    }

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      setError("Patient not found.");
      return;
    }

    setError("");
    onAdmit({
      patientId,
      patientName: patient.name,
      ward: ward.trim(),
      bed: bed.trim(),
    });
    
    // Reset form
    setPatientId("");
    setWard("");
    setBed("");
    setShowAddForm(false);
  }

  return (
    <div>
      <ScreenHeader title="Ward & Admissions" subtitle="In-patient admissions and bed tracking" />
      
      <div style={{ padding: "0 18px 14px" }}>
        {!showAddForm ? (
          <Button full icon={Plus} onClick={() => setShowAddForm(true)}>
            Admit a new patient
          </Button>
        ) : (
          <Card style={{ background: "#EEF1EE", border: "none" }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              New In-patient Admission
            </div>
            <form onSubmit={handleAdmit}>
              <div style={{ marginBottom: 10 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Select Patient
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="">Choose Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                    Ward Unit
                  </label>
                  <input
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. ICU, General A"
                    className="f-body"
                    style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                    Bed Number
                  </label>
                  <input
                    value={bed}
                    onChange={(e) => setBed(e.target.value)}
                    placeholder="e.g. Bed 12"
                    className="f-body"
                    style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                  />
                </div>
              </div>

              {error && (
                <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <Button small variant="dark" type="submit">
                  Admit Patient
                </Button>
                <Button small variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)" }}>
          Currently Admitted Patients ({admissions.filter(a => a.status === "Admitted").length})
        </div>
        
        {admissions.length === 0 ? (
          <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 20 }}>
            No active admissions.
          </div>
        ) : (
          admissions.map((a) => (
            <Card key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="f-display" style={{ fontWeight: 700, fontSize: 14 }}>
                    {a.patientName}
                  </div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    {a.patientId} · {a.id}
                  </div>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--ink)", marginTop: 6 }}>
                    Ward: <strong>{a.ward}</strong> · Bed: <strong>{a.bed}</strong>
                  </div>
                  <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    Admitted: {a.admitDate} {a.dischargeDate && `· Discharged: ${a.dischargeDate}`}
                  </div>
                </div>
                <Badge tone={a.status === "Admitted" ? "success" : "neutral"}>{a.status}</Badge>
              </div>
              
              {a.status === "Admitted" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button small variant="danger" icon={UserX} onClick={() => onDischarge(a.id)}>
                    Discharge
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
