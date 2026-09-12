import { apiFetch, toQuery } from "./api.js";

function normalizeDept(raw) {
  return { id: raw.id, branchId: raw.branch_id, name: raw.name, status: raw.status };
}

function normalizeService(raw) {
  return { id: raw.id, branchId: raw.branch_id, name: raw.name, price: raw.price, status: raw.status };
}

/** FR60: branch-scoped department management. */
export async function listDepartments(params = {}) {
  const res = await apiFetch(`/departments${toQuery(params)}`);
  return res.data.map(normalizeDept);
}

export async function createDepartment(branchId, name) {
  const res = await apiFetch("/departments", { method: "POST", body: { branch_id: branchId, name } });
  return normalizeDept(res.data);
}

export async function updateDepartment(id, payload) {
  const res = await apiFetch(`/departments/${id}`, { method: "PUT", body: payload });
  return normalizeDept(res.data);
}

export async function deactivateDepartment(id) {
  await apiFetch(`/departments/${id}`, { method: "DELETE" });
}

/** FR60: branch-scoped service price list. */
export async function listServices(params = {}) {
  const res = await apiFetch(`/services${toQuery(params)}`);
  return res.data.map(normalizeService);
}

export async function createService(branchId, name, price) {
  const res = await apiFetch("/services", { method: "POST", body: { branch_id: branchId, name, price } });
  return normalizeService(res.data);
}

export async function updateService(id, payload) {
  const res = await apiFetch(`/services/${id}`, { method: "PUT", body: payload });
  return normalizeService(res.data);
}

export async function deactivateService(id) {
  await apiFetch(`/services/${id}`, { method: "DELETE" });
}
