import React, { useEffect, useState } from "react";
import { UserX, Plus, ArrowRightLeft, Activity, ChevronDown, ChevronUp } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listPatients } from "../../services/patientService.js";
import {
  listBeds, listAdmissions, admitPatient, transferAdmission, dischargeAdmission,
  listObservations, addObservation,
} from "../../services/admissionService.js";

const EMPTY_VITALS = { temperature_celsius: "", pulse_bpm: "", respiratory_rate: "", blood_pressure: "", spo2_percent: "", notes: "" };

/** FR52-FR54 (proposed): admit/transfer/discharge, real-time bed allocation, ward observation log. */
export default function StaffAdmissions({ user }) {
  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [bedId, setBedId] = useState("");
  const [admitting, setAdmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [adm, bedList, pts] = await Promise.all([
        listAdmissions({ branch_id: user?.branchId, status: "admitted" }),
        listBeds({ branch_id: user?.branchId }),
        listPatients({}),
      ]);
      setAdmissions(adm);
      setBeds(bedList);
      setPatients(pts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.branchId]);

  const availableBeds = beds.filter((b) => b.status === "available");

  async function handleAdmit(e) {
    e.preventDefault();
    if (!patientId || !bedId) { setError("Please select a patient and a bed."); return; }
    setAdmitting(true);
    setError("");
    try {
      await admitPatient(patientId, Number(bedId));
      setPatientId(""); setBedId(""); setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdmitting(false);
    }
  }

  return (
    <div>
      <ScreenHeader title="Ward & Admissions" subtitle="FR52-54 · In-patient admissions, bed allocation, ward observations" />

      <div style={{ padding: "0 18px 14px" }}>
        {error && <ErrorState message={error} onRetry={load} />}

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
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Select Patient</label>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required>
                  <option value="">Choose Patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Available Bed</label>
                <select value={bedId} onChange={(e) => setBedId(e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required>
                  <option value="">Choose bed ({availableBeds.length} available)</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>{b.ward} — Room {b.room}, Bed {b.bed}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button small variant="dark" type="submit" disabled={admitting}>{admitting ? "Admitting…" : "Admit Patient"}</Button>
                <Button small variant="ghost" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)" }}>
          Currently Admitted Patients ({admissions.length})
        </div>

        {loading ? (
          <LoadingState label="Loading admissions…" />
        ) : admissions.length === 0 ? (
          <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 20 }}>
            No active admissions.
          </div>
        ) : (
          admissions.map((a) => (
            <AdmissionCard key={a.id} admission={a} beds={beds} user={user} onChanged={load} setError={setError} />
          ))
        )}
      </div>
    </div>
  );
}

function AdmissionCard({ admission, beds, user, onChanged, setError }) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [targetBed, setTargetBed] = useState("");
  const [busy, setBusy] = useState(false);
  const [showObs, setShowObs] = useState(false);
  const [observations, setObservations] = useState([]);
  const [loadingObs, setLoadingObs] = useState(false);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [savingVitals, setSavingVitals] = useState(false);

  const availableBeds = beds.filter((b) => b.status === "available" && b.id !== admission.bed?.id);
  const canRecordVitals = user?.staffType === "nurse" || user?.staffType === "doctor";

  async function loadObservations() {
    setLoadingObs(true);
    try {
      setObservations(await listObservations(admission.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingObs(false);
    }
  }

  function toggleObs() {
    const next = !showObs;
    setShowObs(next);
    if (next && observations.length === 0) loadObservations();
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!targetBed) return;
    setBusy(true);
    setError("");
    try {
      await transferAdmission(admission.id, Number(targetBed));
      setShowTransfer(false);
      setTargetBed("");
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDischarge() {
    setBusy(true);
    setError("");
    try {
      await dischargeAdmission(admission.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveVitals(e) {
    e.preventDefault();
    setSavingVitals(true);
    setError("");
    try {
      const payload = {};
      for (const [k, v] of Object.entries(vitals)) {
        if (v !== "") payload[k] = k === "notes" || k === "blood_pressure" ? v : Number(v);
      }
      await addObservation(admission.id, payload);
      setVitals(EMPTY_VITALS);
      loadObservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingVitals(false);
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14 }}>{admission.patient?.name}</div>
          <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{admission.patient?.globalId} · ADM-{admission.id}</div>
          <div className="f-body" style={{ fontSize: 12, color: "var(--ink)", marginTop: 6 }}>
            Ward: <strong>{admission.bed?.ward}</strong> · Room {admission.bed?.room}, Bed {admission.bed?.bed}
          </div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            Admitted {new Date(admission.admittedAt).toLocaleString("en-AU")} by {admission.admittingStaff?.name}
          </div>
        </div>
        <Badge tone="success">Admitted</Badge>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <Button small variant="ghost" icon={ArrowRightLeft} onClick={() => setShowTransfer(!showTransfer)}>Transfer</Button>
        <Button small variant="danger" icon={UserX} onClick={handleDischarge} disabled={busy}>
          {busy ? "Working…" : "Discharge"}
        </Button>
        <Button small variant="ghost" icon={Activity} onClick={toggleObs}>
          Observations {showObs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Button>
      </div>

      {showTransfer && (
        <form onSubmit={handleTransfer} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <select value={targetBed} onChange={(e) => setTargetBed(e.target.value)} className="f-body" style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }} required>
            <option value="">Choose new bed ({availableBeds.length} available)</option>
            {availableBeds.map((b) => (
              <option key={b.id} value={b.id}>{b.ward} — Room {b.room}, Bed {b.bed}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <Button small variant="dark" type="submit" disabled={busy}>{busy ? "Transferring…" : "Confirm Transfer"}</Button>
            <Button small variant="ghost" type="button" onClick={() => setShowTransfer(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {showObs && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          {loadingObs ? (
            <LoadingState label="Loading observations…" />
          ) : observations.length === 0 ? (
            <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>No observations recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: canRecordVitals ? 12 : 0 }}>
              {observations.map((o) => (
                <div key={o.id} className="f-body" style={{ fontSize: 11.5, background: "#EEF1EE", borderRadius: 8, padding: "6px 9px" }}>
                  <strong>{new Date(o.observedAt).toLocaleString("en-AU")}</strong> by {o.staff?.name} —{" "}
                  {[o.temperature != null && `Temp ${o.temperature}°C`, o.pulse != null && `Pulse ${o.pulse}`, o.bloodPressure && `BP ${o.bloodPressure}`, o.spo2 != null && `SpO2 ${o.spo2}%`].filter(Boolean).join(", ")}
                  {o.notes && <div style={{ marginTop: 2, color: "var(--muted)" }}>{o.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {canRecordVitals && (
            <form onSubmit={handleSaveVitals}>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Record new observation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                <input placeholder="Temp °C" value={vitals.temperature_celsius} onChange={(e) => setVitals((v) => ({ ...v, temperature_celsius: e.target.value }))} className="f-body" style={{ padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 11.5 }} />
                <input placeholder="Pulse bpm" value={vitals.pulse_bpm} onChange={(e) => setVitals((v) => ({ ...v, pulse_bpm: e.target.value }))} className="f-body" style={{ padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 11.5 }} />
                <input placeholder="BP e.g. 120/80" value={vitals.blood_pressure} onChange={(e) => setVitals((v) => ({ ...v, blood_pressure: e.target.value }))} className="f-body" style={{ padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 11.5 }} />
                <input placeholder="SpO2 %" value={vitals.spo2_percent} onChange={(e) => setVitals((v) => ({ ...v, spo2_percent: e.target.value }))} className="f-body" style={{ padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 11.5 }} />
              </div>
              <textarea rows={2} placeholder="Notes (optional)" value={vitals.notes} onChange={(e) => setVitals((v) => ({ ...v, notes: e.target.value }))} className="f-body" style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 11.5, resize: "none", marginBottom: 8 }} />
              <Button small variant="dark" type="submit" disabled={savingVitals}>{savingVitals ? "Saving…" : "Save Observation"}</Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
