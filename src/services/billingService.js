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

/**
 * FR40: initialise a checkout. Returns { provider, publishable_key,
 * gateway_reference, client_secret, currency, amount }. For the "stripe"
 * provider the client_secret feeds Stripe.js Elements so the card is tokenized
 * client-side; for "sandbox" there is no client_secret and the card form is
 * skipped entirely.
 */
export async function startCheckout(invoiceId) {
  const res = await apiFetch(`/invoices/${invoiceId}/checkout`, { method: "POST" });
  return res.data;
}

/**
 * FR40: finalise a checkout after the gateway authorises the payment. The
 * backend re-fetches the intent itself, so this never trusts the client alone.
 */
export async function confirmCheckout(invoiceId, gatewayReference) {
  const res = await apiFetch(`/invoices/${invoiceId}/confirm`, {
    method: "POST",
    body: { gateway_reference: gatewayReference },
  });
  return res.data;
}

/** FR38: patient downloads their PDF invoice. */
export async function downloadInvoicePdf(invoiceId) {
  return apiDownload(`/invoices/${invoiceId}/pdf`, `invoice-${invoiceId}.pdf`);
}
