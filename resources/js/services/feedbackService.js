import { apiFetch, toQuery } from "./api.js";
import { normalizeFeedback } from "./adapters.js";

export async function listFeedback(params = {}) {
  const res = await apiFetch(`/feedback${toQuery({ per_page: 100, ...params })}`);
  return res.data.map(normalizeFeedback);
}

export async function submitFeedback({ doctorStaffId, comment, rating }) {
  const res = await apiFetch("/feedback", {
    method: "POST",
    body: { doctor_staff_id: doctorStaffId || null, comment, rating },
  });
  return normalizeFeedback(res.data);
}
