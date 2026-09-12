import { apiFetch, toQuery } from "./api.js";
import { normalizeMedicine, normalizePrescription } from "./adapters.js";

export async function listMedicines(params = {}) {
  const res = await apiFetch(`/medicines${toQuery({ per_page: 100, ...params })}`);
  return res.data.map(normalizeMedicine);
}

export async function listLowStock(params = {}) {
  const res = await apiFetch(`/medicines/low-stock${toQuery(params)}`);
  return res.data.map(normalizeMedicine);
}

export async function createMedicine(payload) {
  const res = await apiFetch("/medicines", { method: "POST", body: payload });
  return normalizeMedicine(res.data);
}

/** FR60: branch-scoped management of inventory thresholds/pricing on an existing medicine. */
export async function updateMedicine(medicineId, payload) {
  const res = await apiFetch(`/medicines/${medicineId}`, { method: "PUT", body: payload });
  return normalizeMedicine(res.data);
}

/** FR29: restock request (purchase order transaction). */
export async function requestRestock(medicineId, quantity) {
  const res = await apiFetch(`/medicines/${medicineId}/purchase-order`, {
    method: "POST",
    body: { quantity },
  });
  return res.data;
}

export async function listPrescriptions(params = {}) {
  const res = await apiFetch(`/prescriptions${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizePrescription);
}

/**
 * FR28/FR30: dispenses one prescription item; backend blocks expired/insufficient stock.
 * FR63 (proposed): backend also warns/blocks on a possible allergy conflict —
 * pass `overrideReason` to proceed past that warning once acknowledged.
 */
export async function dispensePrescriptionItem(prescriptionId, prescriptionItemId, overrideReason) {
  const res = await apiFetch(`/prescriptions/${prescriptionId}/dispense`, {
    method: "POST",
    body: { prescription_item_id: prescriptionItemId, override_reason: overrideReason || undefined },
  });
  return normalizeMedicine(res.data);
}

export async function updatePrescriptionStatus(prescriptionId, status) {
  const res = await apiFetch(`/prescriptions/${prescriptionId}/status`, {
    method: "PATCH",
    body: { status },
  });
  return normalizePrescription(res.data);
}
