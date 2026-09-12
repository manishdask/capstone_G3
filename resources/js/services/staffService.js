import { apiFetch, toQuery } from "./api.js";
import { normalizeStaff } from "./adapters.js";

/** Also used for FR16/17 doctor filtration (specialty/gender) on the patient side. */
export async function listStaff(params = {}) {
  const res = await apiFetch(`/staff${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeStaff);
}

export async function getStaff(id) {
  const res = await apiFetch(`/staff/${id}`);
  return normalizeStaff(res.data);
}

/** FR21: admin creates a doctor/staff profile + account. */
export async function createStaff(payload) {
  const res = await apiFetch("/staff", { method: "POST", body: payload });
  return normalizeStaff(res.data);
}

export async function updateStaff(id, payload) {
  const res = await apiFetch(`/staff/${id}`, { method: "PUT", body: payload });
  return normalizeStaff(res.data);
}

export async function listSchedules(staffId) {
  const res = await apiFetch(`/staff/${staffId}/schedules`);
  return res.data;
}

export async function createSchedule(staffId, payload) {
  const res = await apiFetch(`/staff/${staffId}/schedules`, { method: "POST", body: payload });
  return res.data;
}

/** FR23/FR24: doctor treatment notes or nurse vitals (record_type distinguishes them). */
export async function createMedicalRecord(doctorStaffId, payload) {
  const res = await apiFetch(`/staff/${doctorStaffId}/medical-records`, { method: "POST", body: payload });
  return res.data;
}

/** FR23/FR28: doctor writes a prescription with one or more medicine items. */
export async function createPrescription(doctorStaffId, payload) {
  const res = await apiFetch(`/staff/${doctorStaffId}/prescriptions`, { method: "POST", body: payload });
  return res.data;
}
