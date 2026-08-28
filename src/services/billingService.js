import { apiFetch, apiDownload, toQuery } from "./api.js";
import { normalizeInvoice } from "./adapters.js";

export async function listInvoices(params = {}) {
  const res = await apiFetch(`/invoices${toQuery({ per_page: 50, ...params })}`);
  return res.data.map(normalizeInvoice);
}

function normalizePayment(raw) {
  return { id: raw.id, invoiceId: raw.invoice_id, gatewayReference: raw.gateway_reference, amount: Number(raw.amount), status: raw.status, method: raw.method, receivedAt: raw.received_at };
}

/** FR38/FR64: full invoice detail including its payment history. */
export async function getInvoice(invoiceId) {
  const res = await apiFetch(`/invoices/${invoiceId}`);
  return { ...normalizeInvoice(res.data), payments: (res.data.payments || []).map(normalizePayment) };
}

/** FR36/FR37: itemised invoice for a visit/admission. */
export async function createInvoice(payload) {
  const res = await apiFetch("/invoices", { method: "POST", body: payload });
  return normalizeInvoice(res.data);
}

/** FR40: sandboxed payment gateway — no card details are ever sent to our API. */
export async function payInvoice(invoiceId, method = "card") {
  const res = await apiFetch(`/invoices/${invoiceId}/pay`, { method: "POST", body: { method } });
  return res.data;
}

/** FR38: patient downloads their PDF invoice. */
export async function downloadInvoicePdf(invoiceId) {
  return apiDownload(`/invoices/${invoiceId}/pdf`, `invoice-${invoiceId}.pdf`);
}
