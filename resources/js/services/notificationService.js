import { apiFetch, toQuery } from "./api.js";
import { formatDate, formatDateTime } from "./adapters.js";

/**
 * FR20: in-app notifications. The backend scopes every response to the signed-in
 * user, so there is no recipient id to pass — and nothing here filters client
 * side.
 */
function normalize(raw) {
  return {
    id: raw.id,
    template: raw.template,
    message: raw.message,
    relatedType: raw.related_type,
    relatedId: raw.related_id,
    read: raw.read_at != null,
    date: formatDate(raw.created_at),
    time: formatDateTime(raw.created_at),
  };
}

export async function listNotifications(params = {}) {
  const res = await apiFetch(`/notifications${toQuery({ per_page: 30, ...params })}`);
  return {
    items: (res.data || []).map(normalize),
    unread: res.meta?.unread ?? 0,
  };
}

export async function markNotificationRead(id) {
  await apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  await apiFetch("/notifications/read-all", { method: "POST" });
}

/**
 * Admin/branch-manager view of delivery health: which channels are failing and
 * exactly what configuration is still missing (e.g. no SMS provider set).
 */
export async function getNotificationHealth() {
  const res = await apiFetch("/notifications/health");
  return res.data;
}
