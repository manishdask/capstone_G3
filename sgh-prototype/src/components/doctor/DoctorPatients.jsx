import React, { useState } from "react";
import { Search, ChevronRight, ChevronLeft, FlaskConical, Pill, Check } from "lucide-react";
import Card from "../ui/Card.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

const DEFAULT_NOTE = "Blood pressure stable at 128/82. Continue current medication, review in 4 weeks.";

const MOCK_MEDICINES = ["Amoxicillin 500mg", "Atorvastatin 20mg", "Salbutamol Inhaler", "Metformin 500mg"];
const MOCK_TESTS = ["Full Blood Count", "Lipid Profile", "ECG Stress Test", "Chest X-Ray"];

export default function DoctorPatients({ patients = [], vitals = {}, onAddLabRequest, onAddPrescription }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState({});
  const [saved, setSaved] = useState(false);

  // Forms states
  const [showPrcForm, setShowPrcForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState("");
  const [dosage, setDosage] = useState("");
  const [prcSuccess, setPrcSuccess] = useState(false);

  const [showLabForm, setShowLabForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState("");
  const [labSuccess, setLabSuccess] = useState(false);

  const matches = q.trim()
    ? patients.filter(
        (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  function selectPatient(p) {
    setSelected(p);
    setSaved(false);
    setShowPrcForm(false);
    setShowLabForm(false);
    setPrcSuccess(false);
    setLabSuccess(false);
  }

  function saveNote() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handlePrescribe(e) {
    e.preventDefault();
    if (!selectedMed || !dosage.trim()) return;
    onAddPrescription(selected, selectedMed, dosage.trim());
    setPrcSuccess(true);
    setSelectedMed("");
    setDosage("");
    setTimeout(() => {
      setShowPrcForm(false);
      setPrcSuccess(false);
    }, 2000);
  }

  function handleRequestLab(e) {
    e.preventDefault();
    if (!selectedTest) return;
    onAddLabRequest(selected, selectedTest);
    setLabSuccess(true);
    setSelectedTest("");
    setTimeout(() => {
      setShowLabForm(false);
      setLabSuccess(false);
    }, 2000);
  }

  if (selected) {
    const note = notes[selected.id] ?? DEFAULT_NOTE;
    const v = vitals[selected.id] ?? { bp: "--", hr: "--", temp: "--", spo2: "--" };

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
        <ScreenHeader title={selected.name} subtitle={`${selected.id} · Treatment notes (FR23)`} />
        
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Patient Details Card */}
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
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11.5, marginBottom: 8 }} className="f-mono">
              <div>Vitals: BP <strong>{v.bp}</strong> · HR <strong>{v.hr}</strong></div>
              <div>Temp <strong>{v.temp}</strong> · SpO₂ <strong>{v.spo2}</strong></div>
            </div>

            <div className="f-body" style={{ fontSize: 12, color: "var(--rose)", marginBottom: 12 }}>
              Allergies: {selected.allergies}
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>Consultation Clinical Notes</div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => { setNotes((n) => ({ ...n, [selected.id]: e.target.value })); setSaved(false); }}
                className="f-body"
                style={{ width: "100%", marginTop: 6, border: "1px solid var(--line)", borderRadius: 10, padding: 8, fontSize: 12.5, resize: "none" }}
              />
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <Button small variant="dark" onClick={saveNote}>Save note</Button>
                {saved && <span className="f-body" style={{ fontSize: 11.5, color: "var(--sage)" }}>Notes saved</span>}
              </div>
            </div>
          </Card>

          {/* Action Buttons Panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Button variant="ghost" small icon={Pill} onClick={() => { setShowPrcForm(!showPrcForm); setShowLabForm(false); }}>
              Write Prescription
            </Button>
            <Button variant="ghost" small icon={FlaskConical} onClick={() => { setShowLabForm(!showLabForm); setShowPrcForm(false); }}>
              Request Lab Test
            </Button>
          </div>

          {/* Prescription Form */}
          {showPrcForm && (
            <Card style={{ background: "#EEF1EE", border: "none" }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                Prescribe Medication (FR28)
              </div>
              {prcSuccess ? (
                <div className="f-body" style={{ color: "var(--sage)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={16} /> Prescription recorded &amp; sent to pharmacy.
                </div>
              ) : (
                <form onSubmit={handlePrescribe}>
                  <div style={{ marginBottom: 8 }}>
                    <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Select Medicine</label>
                    <select
                      value={selectedMed}
                      onChange={(e) => setSelectedMed(e.target.value)}
                      className="f-body"
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}
                      required
                    >
                      <option value="">Choose medicine</option>
                      {MOCK_MEDICINES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Dosage Instructions</label>
                    <input
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 1 tablet daily after breakfast"
                      className="f-body"
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button small variant="dark" type="submit">Submit</Button>
                    <Button small variant="ghost" onClick={() => setShowPrcForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* Lab Test Form */}
          {showLabForm && (
            <Card style={{ background: "#EEF1EE", border: "none" }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                Request Pathology / Imaging (FR31)
              </div>
              {labSuccess ? (
                <div className="f-body" style={{ color: "var(--sage)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={16} /> Diagnostic request dispatched to lab desk.
                </div>
              ) : (
                <form onSubmit={handleRequestLab}>
                  <div style={{ marginBottom: 10 }}>
                    <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Lab Test Type</label>
                    <select
                      value={selectedTest}
                      onChange={(e) => setSelectedTest(e.target.value)}
                      className="f-body"
                      style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}
                      required
                    >
                      <option value="">Choose diagnostic test</option>
                      {MOCK_TESTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button small variant="dark" type="submit">Request Test</Button>
                    <Button small variant="ghost" onClick={() => setShowLabForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Patient search" subtitle="Search by name or unique patient ID" />
      <div style={{ padding: "0 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", background: "#fff" }}>
          <Search size={15} color="var(--muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Ravi or SGH-PT-88213"
            className="f-mono"
            style={{ border: "none", outline: "none", fontSize: 12.5, width: "100%", background: "transparent" }}
          />
        </div>
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!q.trim() && (
          <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "20px 10px" }}>
            Start typing a patient's name or ID to find their file.
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