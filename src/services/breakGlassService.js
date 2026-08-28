import { apiFetch, toQuery } from "./api.js";

function normalizePatientRef(p) {
  if (!p) return null;
  return { id: p.id, globalId: p.global_patient_id, name: `${p.first_name} ${p.last_name}` };
}

function normalizeUserRef(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email };
}

function normalize(raw) {
  return {
    id: raw.id,
    reason: raw.reason,
    grantedAt: raw.granted_at,
    expiresAt: raw.expires_at,
    revokedAt: raw.revoked_at,
    status: raw.status,
    reviewedAt: raw.reviewed_at,
    reviewNotes: raw.review_notes,
    requester: normalizeUserRef(raw.requester),
    patient: normalizePatientRef(raw.patient),
    reviewer: normalizeUserRef(raw.reviewer),
  };
}

/** FR51: request emergency (break-glass) access to a patient record. */
export async function requestBreakGlass(patientId, reason) {
  const res = await apiFetch("/break-glass", { method: "POST", body: { patient_id: patientId, reason } });
  return normalize(res.data);
}

/** FR51: Admin/Branch Manager review queue. */
export async function listBreakGlassSessions(params = {}) {
  const res = await apiFetch(`/break-glass${toQuery(params)}`);
  return res.data.map(normalize);
}

export async function revokeBreakGlassSession(id) {
  const res = await apiFetch(`/break-glass/${id}/revoke`, { method: "POST" });
  return normalize(res.data);
}

export async function reviewBreakGlassSession(id, reviewNotes) {
  const res = await apiFetch(`/break-glass/${id}/review`, { method: "POST", body: { review_notes: reviewNotes } });
  return normalize(res.data);
}
