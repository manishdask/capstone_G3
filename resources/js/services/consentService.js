import { apiFetch, toQuery } from "./api.js";

function normalizeConsent(raw) {
  return {
    id: raw.id,
    purpose: raw.purpose,
    noticeVersion: raw.notice_version,
    state: raw.state,
    changedAt: raw.changed_at,
  };
}

/** FR49: own consent history for a patient (or, for staff, a given patient_id). */
export async function listConsents(params = {}) {
  const res = await apiFetch(`/consents${toQuery(params)}`);
  return res.data.map(normalizeConsent);
}

export async function grantConsent(patientId, purpose) {
  const res = await apiFetch("/consents", { method: "POST", body: { patient_id: patientId, purpose } });
  return normalizeConsent(res.data);
}

/** Writes a withdrawal event; the original grant record is never altered. */
export async function withdrawConsent(consentId) {
  const res = await apiFetch(`/consents/${consentId}/withdraw`, { method: "POST" });
  return normalizeConsent(res.data);
}
