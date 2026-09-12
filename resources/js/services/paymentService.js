import { apiFetch } from "./api.js";

function normalize(raw) {
  return { id: raw.id, invoiceId: raw.invoice_id, gatewayReference: raw.gateway_reference, amount: Number(raw.amount), status: raw.status, method: raw.method, receivedAt: raw.received_at };
}

/** FR64: staff-initiated refund — idempotent on the backend (safe to retry). */
export async function refundPayment(paymentId) {
  const res = await apiFetch(`/payments/${paymentId}/refund`, { method: "POST" });
  return normalize(res.data);
}
