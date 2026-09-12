import { apiFetch, apiDownload, toQuery } from "./api.js";
import { normalizeLabOrder } from "./adapters.js";

export async function listLabOrders(params = {}) {
  const res = await apiFetch(`/lab-orders${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeLabOrder);
}

/** FR31: doctor requests a pathology/imaging test. */
export async function requestLabTest(payload) {
  const res = await apiFetch("/lab-orders", { method: "POST", body: payload });
  return res.data;
}

/** FR32: lab technician records findings (and optionally uploads a report file). */
export async function uploadLabResult(orderId, { resultDetails, file }) {
  if (file) {
    const form = new FormData();
    form.append("result_details", resultDetails);
    form.append("file", file);
    const res = await apiFetch(`/lab-orders/${orderId}/results`, {
      method: "POST",
      body: form,
      isFormData: true,
    });
    return res.data;
  }

  const res = await apiFetch(`/lab-orders/${orderId}/results`, {
    method: "POST",
    body: { result_details: resultDetails },
  });
  return res.data;
}

/** FR33: releases a verified result — triggers notifications to doctor + patient. */
export async function releaseLabResult(resultId) {
  const res = await apiFetch(`/lab-results/${resultId}/release`, { method: "POST" });
  return res.data;
}

/** FR34: patient (or staff) downloads the released report file. */
export async function downloadLabResult(resultId, filename) {
  return apiDownload(`/lab-results/${resultId}/download`, filename);
}
