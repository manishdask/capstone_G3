import { apiFetch, toQuery } from "./api.js";

function normalizeBed(raw) {
  if (!raw) return null;
  return { id: raw.id, branchId: raw.branch_id, ward: raw.ward, room: raw.room_number, bed: raw.bed_number, status: raw.status };
}

function normalizePatientRef(p) {
  if (!p) return null;
  return { id: p.id, globalId: p.global_patient_id, name: `${p.first_name} ${p.last_name}` };
}

function normalizeStaffRef(s) {
  if (!s) return null;
  return { id: s.id, name: s.user?.name ?? "" };
}

function normalizeAdmission(raw) {
  return {
    id: raw.id,
    status: raw.status,
    admittedAt: raw.admitted_at,
    dischargedAt: raw.discharged_at,
    dischargeSummary: raw.discharge_summary,
    transferredFromId: raw.transferred_from_id,
    patient: normalizePatientRef(raw.patient),
    bed: normalizeBed(raw.bed),
    admittingStaff: normalizeStaffRef(raw.admitting_staff),
  };
}

function normalizeObservation(raw) {
  return {
    id: raw.id,
    observedAt: raw.observed_at,
    temperature: raw.temperature_celsius,
    pulse: raw.pulse_bpm,
    respiratoryRate: raw.respiratory_rate,
    bloodPressure: raw.blood_pressure,
    spo2: raw.spo2_percent,
    notes: raw.notes,
    staff: normalizeStaffRef(raw.staff),
  };
}

/** FR53: real-time bed availability. */
export async function listBeds(params = {}) {
  const res = await apiFetch(`/beds${toQuery(params)}`);
  return res.data.map(normalizeBed);
}

/** FR60: branch-scoped management of wards/rooms/beds. */
export async function createBed(branchId, ward, roomNumber, bedNumber) {
  const res = await apiFetch("/beds", { method: "POST", body: { branch_id: branchId, ward, room_number: roomNumber, bed_number: bedNumber } });
  return normalizeBed(res.data);
}

export async function updateBed(id, payload) {
  const res = await apiFetch(`/beds/${id}`, { method: "PUT", body: payload });
  return normalizeBed(res.data);
}

/** FR52: admissions board. */
export async function listAdmissions(params = {}) {
  const res = await apiFetch(`/admissions${toQuery(params)}`);
  return res.data.map(normalizeAdmission);
}

export async function getAdmission(id) {
  const res = await apiFetch(`/admissions/${id}`);
  return normalizeAdmission(res.data);
}

export async function admitPatient(patientId, bedId) {
  const res = await apiFetch("/admissions", { method: "POST", body: { patient_id: patientId, bed_id: bedId } });
  return normalizeAdmission(res.data);
}

export async function transferAdmission(admissionId, bedId) {
  const res = await apiFetch(`/admissions/${admissionId}/transfer`, { method: "POST", body: { bed_id: bedId } });
  return normalizeAdmission(res.data);
}

export async function dischargeAdmission(admissionId, dischargeSummary) {
  const res = await apiFetch(`/admissions/${admissionId}/discharge`, {
    method: "POST",
    body: dischargeSummary ? { discharge_summary: dischargeSummary } : {},
  });
  return normalizeAdmission(res.data);
}

/** FR54: daily ward observation log. */
export async function listObservations(admissionId) {
  const res = await apiFetch(`/admissions/${admissionId}/observations`);
  return res.data.map(normalizeObservation);
}

export async function addObservation(admissionId, vitals) {
  const res = await apiFetch(`/admissions/${admissionId}/observations`, { method: "POST", body: vitals });
  return normalizeObservation(res.data);
}
