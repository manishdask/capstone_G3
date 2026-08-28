import { apiFetch, toQuery } from "./api.js";
import { normalizeBranch } from "./adapters.js";

/** Unauthenticated — used by the registration form's branch picker. */
export async function listPublicBranches() {
  const res = await apiFetch("/public/branches");
  return res.data.map((b) => ({ id: b.id, name: b.name, state: b.state }));
}

export async function listBranches(params = {}) {
  const res = await apiFetch(`/branches${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeBranch);
}

export async function getBranchStatistics(branchId) {
  const res = await apiFetch(`/branches/${branchId}/statistics`);
  return res.data;
}

export async function createBranch(payload) {
  const res = await apiFetch("/branches", { method: "POST", body: payload });
  return normalizeBranch(res.data);
}

/** FR6: admin updates branch details (name/state/address/contact/capacity). */
export async function updateBranch(branchId, payload) {
  const res = await apiFetch(`/branches/${branchId}`, { method: "PUT", body: payload });
  return normalizeBranch(res.data);
}

/** FR6: deactivates (not hard-deletes) a branch — preserves historical references. */
export async function deactivateBranch(branchId) {
  return apiFetch(`/branches/${branchId}`, { method: "DELETE" });
}

/** FR6: reactivate a previously deactivated branch. */
export async function reactivateBranch(branchId) {
  const res = await apiFetch(`/branches/${branchId}`, { method: "PUT", body: { status: "active" } });
  return normalizeBranch(res.data);
}

export async function assignStaffToBranch(branchId, staffId) {
  const res = await apiFetch(`/branches/${branchId}/assign-staff`, {
    method: "POST",
    body: { staff_id: staffId },
  });
  return res.data;
}
