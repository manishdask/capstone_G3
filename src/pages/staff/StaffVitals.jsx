import React, { useEffect, useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listPatients, getMedicalRecords } from "../../services/patientService.js";
import { createMedicalRecord } from "../../services/staffService.js";

const DEFAULT_VITALS = { bp: "", hr: "", temp: "", spo2: "" };

export default function StaffVitals({ user }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await listPatients({ search: q.trim() }));
      } catch (err) {
        setError(err.message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  if (selected) {
    return <VitalsForm user={user} patient={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <ScreenHeader title="Record vitals" subtitle="Search a patient to begin (FR24)" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={() => setError("")} /></div>}
      <div style={{ padding: "0 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", background: "#fff" }}>
          <Search size={15} color="var(--muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. patient name or SGH-PT-000005"
            className="f-mono"
            style={{ border: "none", outline: "none", fontSize: 12.5, width: "100%", background: "transparent" }}
          />
        </div>
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!q.trim() && (
          <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "20px 10px" }}>
            Start typing a patient's name or ID to record their vitals.
          </div>
        )}
        {searching && <LoadingState label="Searching…" />}
        {q.trim() && !searching && results.length === 0 && (
          <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "20px 10px" }}>
            No patient matches "{q}".
          </div>
        )}
        {results.map((p) => (
          <Card key={p._id} style={{ cursor: "pointer" }}>
            <div onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={p.name} size={38} />
              <div style={{ flex: 1 }}>
                <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{p.id}</div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VitalsForm({ user, patient, onBack }) {
  const [vitals, setVitals] = useState(DEFAULT_VITALS);
  const [lastRecorded, setLastRecorded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMedicalRecords(patient._id)
      .then((res) => {
        const latest = (res.data || []).find((r) => r.record_type === "vitals");
        if (latest) setLastRecorded(latest);
      })
      .catch(() => {});
  }, [patient._id]);

  function setField(key, value) {
    setSaved(false);
    setVitals((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await createMedicalRecord(user.staffId, {
        patient_id: patient._id,
        record_type: "vitals",
        content: `BP: ${vitals.bp || "—"}, HR: ${vitals.hr || "—"}, Temp: ${vitals.temp || "—"}, SpO2: ${vitals.spo2 || "—"}`,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
          <ChevronLeft size={16} />
          <span className="f-body" style={{ fontSize: 13 }}>Back to search</span>
        </button>
      </div>
      <ScreenHeader title={patient.name} subtitle={`${patient.id} · FR24 · Nurse observations`} />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={() => setError("")} /></div>}
      <div style={{ padding: "0 18px 20px" }}>
        <Card>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <Avatar name={patient.name} size={40} />
            <div style={{ flex: 1 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 14 }}>{patient.name}</div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {patient.gender} · DOB {patient.dob} · {patient.branch} Branch
              </div>
            </div>
          </div>

          {lastRecorded && (
            <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10, background: "var(--mist)", padding: 8, borderRadius: 8 }}>
              Last recorded {new Date(lastRecorded.created_at).toLocaleString("en-AU")}: {lastRecorded.content}
            </div>
          )}

          {[["Blood pressure", "bp", "e.g. 128/82 mmHg"], ["Heart rate", "hr", "e.g. 76 bpm"], ["Temperature", "temp", "e.g. 36.8°C"], ["SpO₂", "spo2", "e.g. 98%"]].map(([label, key, placeholder]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <span className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
              <input
                value={vitals[key]}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={placeholder}
                className="f-mono"
                style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", fontSize: 12.5, width: 150, textAlign: "right" }}
              />
            </div>
          ))}

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <Button small variant="dark" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save vitals"}</Button>
            {saved && <span className="f-body" style={{ fontSize: 11.5, color: "var(--sage)" }}>Saved</span>}
          </div>
        </Card>
      </div>
    </div>
  );
}
