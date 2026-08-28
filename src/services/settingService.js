import { apiFetch } from "./api.js";

function normalize(raw) {
  return { key: raw.key, value: raw.value, label: raw.label, type: raw.type, updatedAt: raw.updated_at };
}

/** FR59: admin-editable system settings. */
export async function listSettings() {
  const res = await apiFetch("/settings");
  return res.data.map(normalize);
}

export async function updateSetting(key, value) {
  const res = await apiFetch(`/settings/${key}`, { method: "PUT", body: { value: String(value) } });
  return normalize(res.data);
}
