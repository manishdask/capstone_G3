import { apiFetch, toQuery } from "./api.js";
import { normalizePatient } from "./adapters.js";

export async function listPatients(params = {}) {
  const res = await apiFetch(`/patients${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizePatient);
}

/** FR11/FR12: receptionist/admin registers a patient; backend assigns the global ID. */
export async function registerPatient(payload) {
  const res = await apiFetch("/patients", { method: "POST", body: payload });
  return normalizePatient(res.data);
}

export async function updatePatient(id, payload) {
  const res = await apiFetch(`/patients/${id}`, { method: "PUT", body: payload });
  return normalizePatient(res.data);
}

export async function getMedicalRecords(patientId) {
  const res = await apiFetch(`/patients/${patientId}/medical-records`);
  return res.data;
}
