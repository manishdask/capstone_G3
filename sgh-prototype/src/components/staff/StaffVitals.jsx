import React, { useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import Card from "../ui/Card.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";
import { PATIENTS } from "../../data/mockData.js";

const DEFAULT_VITALS = { bp: "128/82 mmHg", hr: "76 bpm", temp: "36.8°C", spo2: "98%" };

export default function StaffVitals() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [vitals, setVitals] = useState({});
  const [saved, setSaved] = useState(false);

  const matches = q.trim()
    ? PATIENTS.filter(
        (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  function selectPatient(p) {
    setSelected(p);
    setSaved(false);
  }

  function setField(key, value) {
    setSaved(false);
    setVitals((v) => ({ ...v, [selected.id]: { ...(v[selected.id] ?? DEFAULT_VITALS), [key]: value } }));
  }

  if (selected) {
    const v = vitals[selected.id] ?? DEFAULT_VITALS;
    return (
      <div>
        <div style={{ padding: "18px 18px 0" }}>
          <button
            onClick={() => setSelected(null)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "var(--muted)" }}
          >
            <ChevronLeft size={16} />
            <span className="f-body" style={{ fontSize: 13 }}>Back to search</span>
          </button>
        </div>
        <ScreenHeader title={selected.name} subtitle={`${selected.id} · FR24 · Nurse observations`} />
        <div style={{ padding: "0 18px 20px" }}>
          <Card>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <Avatar name={selected.name} size={40} />
              <div style={{ flex: 1 }}>
                <div className="f-display" style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {selected.gender} · DOB {selected.dob} · {selected.branch} Branch
                </div>
              </div>
            </div>

            {[
              ["Blood pressure", "bp"],
              ["Heart rate", "hr"],
              ["Temperature", "temp"],
              ["SpO₂", "spo2"],
            ].map(([label, key]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
                <input
                  value={v[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="f-mono"
                  style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", fontSize: 12.5, width: 120, textAlign: "right" }}
                />
              </div>
            ))}

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <Button small variant="dark" onClick={() => setSaved(true)}>Save vitals</Button>
              {saved && <span className="f-body" style={{ fontSize: 11.5, color: "var(--sage)" }}>Saved</span>}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Record vitals" subtitle="Search a patient to begin" />
      <div style={{ padding: "0 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", background: "#fff" }}>
          <Search size={15} color="var(--muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Aiden or SGH-PT-51102"
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
        {q.trim() && matches.length === 0 && (
          <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "20px 10px" }}>
            No patient matches "{q}".
          </div>
        )}
        {matches.map((p) => (
          <Card key={p.id} style={{ cursor: "pointer" }}>
            <div onClick={() => selectPatient(p)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
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