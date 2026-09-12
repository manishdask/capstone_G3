import { apiFetch, apiDownload, toQuery } from "./api.js";
import { normalizeAuditLog } from "./adapters.js";

/** NFR12 — admin-only read access to the audit trail. FR55: filter by actor/branch/object/action/date range. */
export async function listAuditLogs(params = {}) {
  const res = await apiFetch(`/audit-logs${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeAuditLog);
}

/** FR55: export the (filtered) audit trail as CSV. */
export function exportAuditLogsCsv(params = {}) {
  return apiDownload(`/audit-logs/export.csv${toQuery(params)}`, "sgh-audit-log.csv");
}

function normalizeAlertRow(raw) {
  return {
    actorId: raw.actor_id,
    actorName: raw.actor?.name ?? raw.actor_name ?? null,
    actorEmail: raw.actor?.email ?? raw.actor_email ?? null,
    ipAddress: raw.ip_address ?? null,
    attempts: raw.attempts ?? null,
    distinctRecords: raw.distinct_records ?? null,
    latestAt: raw.latest_at ?? raw.created_at ?? null,
    action: raw.action ?? null,
    objectType: raw.object_type ?? null,
    objectId: raw.object_id ?? null,
    outcome: raw.outcome ?? null,
  };
}

/** FR56: automated alerts — repeated failed logins, privileged changes, unusual record access. */
export async function listSecurityAlerts() {
  const res = await apiFetch("/security-alerts");
  return {
    repeatedFailedLogins: res.data.repeated_failed_logins.map(normalizeAlertRow),
    privilegedChanges: res.data.privileged_changes.map(normalizeAlertRow),
    unusualRecordAccess: res.data.unusual_record_access.map(normalizeAlertRow),
  };
}
