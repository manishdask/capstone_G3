import { apiFetch, toQuery } from "./api.js";

function normalize(raw) {
  return {
    id: raw.id,
    type: raw.type,
    details: raw.details,
    identityVerified: raw.identity_verified,
    status: raw.status,
    patientId: raw.patient?.global_patient_id ?? "",
    patientName: raw.patient ? `${raw.patient.first_name} ${raw.patient.last_name}` : "",
    assignee: raw.assignee?.name ?? null,
    decisionNotes: raw.decision_notes,
    decider: raw.decider?.name ?? null,
    decidedAt: raw.decided_at,
    createdAt: raw.created_at,
  };
}

/** FR61: own requests (patient) or all requests (staff, optional ?status=). */
export async function listDataRequests(params = {}) {
  const res = await apiFetch(`/data-requests${toQuery(params)}`);
  return res.data.map(normalize);
}

export async function submitDataRequest(type, details) {
  const res = await apiFetch("/data-requests", { method: "POST", body: { type, details } });
  return normalize(res.data);
}

export async function assignDataRequest(id, identityVerified) {
  const res = await apiFetch(`/data-requests/${id}/assign`, {
    method: "POST",
    body: { identity_verified: identityVerified },
  });
  return normalize(res.data);
}

export async function decideDataRequest(id, status, decisionNotes) {
  const res = await apiFetch(`/data-requests/${id}/decide`, {
    method: "POST",
    body: { status, decision_notes: decisionNotes || undefined },
  });
  return normalize(res.data);
}
