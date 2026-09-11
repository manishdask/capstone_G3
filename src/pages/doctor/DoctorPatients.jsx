import React, { useEffect, useState } from "react";
import { Search, ChevronRight, ChevronLeft, FlaskConical, Pill, Check, FileText, ShieldAlert } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listPatients, getMedicalRecords } from "../../services/patientService.js";
import { listMedicines } from "../../services/pharmacyService.js";
import { createMedicalRecord, createPrescription } from "../../services/staffService.js";
import { requestLabTest } from "../../services/labService.js";
import { listAppointments } from "../../services/appointmentService.js";
import { requestBreakGlass } from "../../services/breakGlassService.js";

const TESTS = ["Full Blood Count", "Lipid Profile", "ECG Stress Test", "Chest X-Ray", "Urinalysis"];

export default function DoctorPatients({ user }) {
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
    return <PatientDetail user={user} patient={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <ScreenHeader title="Patient search" subtitle="Search by name or unique patient ID (FR23)" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={() => setError("")} /></div>}
      <div style={{ padding: "0 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", background: "#fff" }}>
          <Search size={15} color="var(--muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Shah or SGH-PT-000005"
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

function PatientDetail({ user, patient, onBack }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [note, setNote] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const [showPrcForm, setShowPrcForm] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [prcSuccess, setPrcSuccess] = useState(false);
  const [prcSubmitting, setPrcSubmitting] = useState(false);

  const [showLabForm, setShowLabForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState("");
  const [labAppointmentId, setLabAppointmentId] = useState("");
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [labSuccess, setLabSuccess] = useState(false);
  const [labSubmitting, setLabSubmitting] = useState(false);

  const [showBgForm, setShowBgForm] = useState(false);
  const [bgReason, setBgReason] = useState("");
  const [bgSuccess, setBgSuccess] = useState(false);
  const [bgSubmitting, setBgSubmitting] = useState(false);

  const [error, setError] = useState("");

  async function loadRecords() {
    setLoadingRecords(true);
    try {
      const res = await getMedicalRecords(patient._id);
      setRecords(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    loadRecords();
    listMedicines({ branch_id: patient.branchId }).then(setMedicines).catch(() => setMedicines([]));
    // FR31: a lab order carries the visit it belongs to, which is what lets
    // BillingService bill it onto that visit's invoice. Without a linked
    // appointment the order is a walk-in and is never invoiced.
    listAppointments({ per_page: 50 })
      .then((all) => setPatientAppointments(all.filter((a) => a.patientRecordId === patient._id)))
      .catch(() => setPatientAppointments([]));
  }, [patient._id]);

  async function saveNote() {
    if (!note.trim() && !diagnosis.trim()) return;
    setSavingNote(true);
    setError("");
    try {
      await createMedicalRecord(user.staffId, {
        patient_id: patient._id,
        record_type: "consultation",
        diagnosis: diagnosis.trim() || undefined,
        treatment_notes: note.trim() || undefined,
      });
      setNote("");
      setDiagnosis("");
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
      loadRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handlePrescribe(e) {
    e.preventDefault();
    if (!selectedMed || !dosage.trim() || !frequency.trim()) return;
    setPrcSubmitting(true);
    setError("");
    try {
      await createPrescription(user.staffId, {
        patient_id: patient._id,
        items: [{ medicine_id: Number(selectedMed), dosage: dosage.trim(), frequency: frequency.trim() }],
      });
      setPrcSuccess(true);
      setSelectedMed(""); setDosage(""); setFrequency("");
      setTimeout(() => { setShowPrcForm(false); setPrcSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setPrcSubmitting(false);
    }
  }

  async function handleRequestLab(e) {
    e.preventDefault();
    if (!selectedTest) return;
    setLabSubmitting(true);
    setError("");
    try {
      await requestLabTest({
        patient_id: patient._id,
        branch_id: patient.branchId,
        test_type: selectedTest,
        appointment_id: labAppointmentId ? Number(labAppointmentId) : null,
      });
      setLabSuccess(true);
      setSelectedTest("");
      setLabAppointmentId("");
      setTimeout(() => { setShowLabForm(false); setLabSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLabSubmitting(false);
    }
  }

  async function handleRequestBreakGlass(e) {
    e.preventDefault();
    if (!bgReason.trim()) return;
    setBgSubmitting(true);
    setError("");
    try {
      await requestBreakGlass(patient._id, bgReason.trim());
      setBgSuccess(true);
      setBgReason("");
      setTimeout(() => { setShowBgForm(false); setBgSuccess(false); }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBgSubmitting(false);
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
      <ScreenHeader title={patient.name} subtitle={`${patient.id} · Treatment notes (FR23)`} />

      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={() => setError("")} /></div>}

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
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

          <div className="f-body" style={{ fontSize: 12, color: "var(--rose)", marginBottom: 12 }}>
            Allergies: {patient.allergies}
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Add consultation note</div>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnosis (optional)"
              className="f-body"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12.5, marginBottom: 6 }}
            />
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Treatment notes..."
              className="f-body"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: 8, fontSize: 12.5, resize: "none" }}
            />
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <Button small variant="dark" onClick={saveNote} disabled={savingNote}>
                {savingNote ? "Saving…" : "Save note"}
              </Button>
              {noteSaved && <span className="f-body" style={{ fontSize: 11.5, color: "var(--sage)" }}>Note saved</span>}
            </div>
          </div>
        </Card>

        <div className="grid-fluid" style={{ "--col-min": "130px", "--grid-gap": "10px" }}>
          <Button variant="ghost" small icon={Pill} onClick={() => { setShowPrcForm(!showPrcForm); setShowLabForm(false); setShowBgForm(false); }}>
            Write Prescription
          </Button>
          <Button variant="ghost" small icon={FlaskConical} onClick={() => { setShowLabForm(!showLabForm); setShowPrcForm(false); setShowBgForm(false); }}>
            Request Lab Test
          </Button>
        </div>

        <Button variant="ghost" small icon={ShieldAlert} onClick={() => { setShowBgForm(!showBgForm); setShowPrcForm(false); setShowLabForm(false); }}>
          Emergency (Break-Glass) Access
        </Button>

        {showBgForm && (
          <Card style={{ background: "var(--tint-amber)", border: "1px solid var(--line-amber)" }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Request Emergency Access (FR51)</div>
            <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
              Use this only when normal access isn't sufficient for an emergency. A mandatory reason is logged, an alert is raised immediately, and the grant is reviewed retrospectively.
            </div>
            {bgSuccess ? (
              <div className="f-body" style={{ color: "var(--sage)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={16} /> Emergency access granted for 30 minutes. Logged for review.
              </div>
            ) : (
              <form onSubmit={handleRequestBreakGlass}>
                <textarea
                  rows={3}
                  value={bgReason}
                  onChange={(e) => setBgReason(e.target.value)}
                  placeholder="Reason for emergency access (minimum 10 characters)..."
                  className="f-body"
                  style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: 8, fontSize: 12.5, resize: "none", marginBottom: 8 }}
                  required
                  minLength={10}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button small variant="danger" type="submit" disabled={bgSubmitting || bgReason.trim().length < 10}>
                    {bgSubmitting ? "Requesting…" : "Grant Emergency Access"}
                  </Button>
                  <Button small variant="ghost" onClick={() => setShowBgForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {showPrcForm && (
          <Card style={{ background: "var(--tint-neutral)", border: "none" }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Prescribe Medication (FR28)</div>
            {prcSuccess ? (
              <div className="f-body" style={{ color: "var(--sage)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={16} /> Prescription recorded &amp; sent to pharmacy.
              </div>
            ) : (
              <form onSubmit={handlePrescribe}>
                <div style={{ marginBottom: 8 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Select Medicine</label>
                  <select value={selectedMed} onChange={(e) => setSelectedMed(e.target.value)} className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} required>
                    <option value="">Choose medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Dosage</label>
                  <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 tablet" className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Frequency</label>
                  <input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Once daily after food" className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} required />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button small variant="dark" type="submit" disabled={prcSubmitting}>{prcSubmitting ? "Saving…" : "Submit"}</Button>
                  <Button small variant="ghost" onClick={() => setShowPrcForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {showLabForm && (
          <Card style={{ background: "var(--tint-neutral)", border: "none" }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Request Pathology / Imaging (FR31)</div>
            {labSuccess ? (
              <div className="f-body" style={{ color: "var(--sage)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={16} /> Diagnostic request dispatched to lab desk.
              </div>
            ) : (
              <form onSubmit={handleRequestLab}>
                <div style={{ marginBottom: 10 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Lab Test Type</label>
                  <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} required>
                    <option value="">Choose diagnostic test</option>
                    {TESTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>Link to visit (bills the test to that visit)</label>
                  <select value={labAppointmentId} onChange={(e) => setLabAppointmentId(e.target.value)} className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}>
                    <option value="">Walk-in — not linked to a visit (not invoiced)</option>
                    {patientAppointments.map((a) => (
                      <option key={a.id} value={a.id}>{a.date} · {a.time} · {a.status}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button small variant="dark" type="submit" disabled={labSubmitting}>{labSubmitting ? "Sending…" : "Request Test"}</Button>
                  <Button small variant="ghost" onClick={() => setShowLabForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        <div>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> Past notes
          </div>
          {loadingRecords ? (
            <LoadingState label="Loading history…" />
          ) : records.length === 0 ? (
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 12 }}>
              No notes on file yet.
            </div>
          ) : (
            records.map((r) => (
              <Card key={r.id} style={{ marginBottom: 8 }}>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {new Date(r.created_at).toLocaleDateString("en-AU")} · {r.record_type}
                </div>
                {r.diagnosis && <div className="f-body" style={{ fontSize: 12.5, marginTop: 4 }}><strong>Diagnosis:</strong> {r.diagnosis}</div>}
                {r.treatment_notes && <div className="f-body" style={{ fontSize: 12.5, marginTop: 2 }}>{r.treatment_notes}</div>}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
