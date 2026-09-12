import { apiFetch } from "./api.js";

function normalizeDrill(raw) {
  return {
    id: raw.id,
    status: raw.status,
    verificationNotes: raw.verification_notes,
    ranAt: raw.ran_at,
  };
}

function normalizeJob(raw) {
  return {
    id: raw.id,
    type: raw.type,
    status: raw.status,
    startedAt: raw.started_at,
    endedAt: raw.ended_at,
    verificationNotes: raw.verification_notes,
    restoreDrills: (raw.restore_drills || []).map(normalizeDrill),
  };
}

/** FR57: backup job history. */
export async function listBackupJobs() {
  const res = await apiFetch("/backup-jobs");
  return res.data.map(normalizeJob);
}

/** FR57: admin-triggered manual run, on top of the scheduled daily one. */
export async function runBackupNow() {
  const res = await apiFetch("/backup-jobs", { method: "POST" });
  return normalizeJob(res.data);
}

/** FR58: verifies a completed backup can actually be restored. */
export async function runRestoreDrill(backupJobId) {
  const res = await apiFetch(`/backup-jobs/${backupJobId}/restore-drill`, { method: "POST" });
  return normalizeDrill(res.data);
}
