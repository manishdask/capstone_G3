import { apiFetch, toQuery } from "./api.js";

function normalizePatientRef(p) {
  if (!p) return null;
  return { id: p.id, globalId: p.global_patient_id, name: `${p.first_name} ${p.last_name}`, dob: p.date_of_birth, contact: p.contact_number, branchId: p.branch_id };
}

function normalize(raw) {
  return {
    id: raw.id,
    score: raw.score,
    status: raw.status,
    notes: raw.notes,
    patient: normalizePatientRef(raw.patient),
    matchedPatient: normalizePatientRef(raw.matched_patient),
  };
}

/** FR62: pending (or filtered) possible-duplicate flags. */
export async function listDuplicateFlags(params = {}) {
  const res = await apiFetch(`/patient-duplicates${toQuery(params)}`);
  return res.data.map(normalize);
}

export async function dismissDuplicateFlag(id) {
  const res = await apiFetch(`/patient-duplicates/${id}/dismiss`, { method: "POST" });
  return normalize(res.data);
}

/** Reassigns every clinical/financial record from the losing patient to primaryPatientId. */
export async function mergeDuplicateFlag(id, primaryPatientId) {
  const res = await apiFetch(`/patient-duplicates/${id}/merge`, {
    method: "POST",
    body: { primary_patient_id: primaryPatientId },
  });
  return normalize(res.data);
}
