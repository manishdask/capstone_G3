import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listInvoices, getInvoice, listPayments } from "../../services/billingService.js";
import { refundPayment } from "../../services/paymentService.js";

const INVOICE_TONE = { Paid: "success", Pending: "warn", Cancelled: "danger" };
const PAYMENT_TONE = { success: "success", pending: "warn", failed: "danger", refunded: "default" };
const PAYMENT_LABEL = { success: "Paid", pending: "Started", failed: "Failed", refunded: "Refunded" };
const STATUS_FILTERS = [["", "All"], ["success", "Paid"], ["pending", "Started"], ["refunded", "Refunded"], ["failed", "Failed"]];

const pill = (on) => ({
  padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
  border: "1px solid var(--line)", background: on ? "var(--ink)" : "#fff", color: on ? "#fff" : "var(--ink-deep)",
});

/**
 * FR36–FR40 / FR64: payment history and refunds for billing staff. An Admin
 * sees every branch; a Branch Manager only their own (the backend enforces the
 * same scoping, so this filter is presentation, not security).
 */
export default function AdminPayments({ user }) {
  const branchScoped = (user?.roleNames || []).includes("Branch Manager") && !(user?.roleNames || []).includes("Admin");
  const scope = branchScoped && user?.branchId ? { branch_id: user.branchId } : {};

  const [view, setView] = useState("payments");
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refundingId, setRefundingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      if (view === "payments") {
        setPayments(await listPayments({ ...scope, status: statusFilter }));
      } else {
        setInvoices(await listInvoices(scope));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.branchId, view, statusFilter]);

  async function handleListRefund(paymentId) {
    setRefundingId(paymentId);
    setError("");
    try {
      await refundPayment(paymentId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefundingId(null);
    }
  }

  const collected = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0);

  async function toggleExpand(invoice) {
    if (expandedId === invoice.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(invoice.id);
    setLoadingDetail(true);
    setError("");
    try {
      setDetail(await getInvoice(invoice.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRefund(paymentId) {
    setRefundingId(paymentId);
    setError("");
    try {
      await refundPayment(paymentId);
      const invoice = invoices.find((i) => i.id === expandedId);
      if (invoice) setDetail(await getInvoice(invoice.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Payments & Refunds
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        FR36–FR40 · {branchScoped ? `${user?.branch || "Your"} branch` : "All branches"} · Stripe test mode (AUD) · FR64 refunds
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button style={pill(view === "payments")} onClick={() => setView("payments")}>All payments</button>
        <button style={pill(view === "invoices")} onClick={() => setView("invoices")}>By invoice</button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {view === "payments" ? (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map(([k, l]) => (
              <button key={k || "all"} style={pill(statusFilter === k)} onClick={() => setStatusFilter(k)}>{l}</button>
            ))}
          </div>
          {loading ? (
            <LoadingState label="Loading payments…" />
          ) : payments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No payments match this filter.</div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {payments.length} payment{payments.length === 1 ? "" : "s"} · collected{" "}
                <strong style={{ color: "var(--ink-deep)" }}>${collected.toFixed(2)} AUD</strong>
              </div>
              {payments.map((p) => (
                <Card key={p.id} style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                      <div className="f-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)" }}>
                        {p.patientName || "—"} <span className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 500 }}>{p.patientId}</span>
                      </div>
                      <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        INV-{p.invoiceId} · {p.desc}{p.branch ? ` · ${p.branch}` : ""}
                      </div>
                      <div className="f-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, wordBreak: "break-all" }}>
                        {p.provider === "stripe" ? "Stripe" : "Sandbox"} · {p.gatewayReference}{p.paidOn ? ` · ${p.paidOn}` : ""}
                      </div>
                      {p.failureReason && (
                        <div className="f-body" style={{ fontSize: 11, color: "var(--rose)", marginTop: 3 }}>{p.failureReason}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong className="f-display" style={{ fontSize: 14, color: "var(--ink-deep)" }}>${p.amount.toFixed(2)}</strong>
                      <Badge tone={PAYMENT_TONE[p.status]}>{PAYMENT_LABEL[p.status] || p.status}</Badge>
                      {p.status === "success" && (
                        <Button small variant="ghost" icon={Undo2} disabled={refundingId === p.id} onClick={() => handleListRefund(p.id)}>
                          {refundingId === p.id ? "Refunding…" : "Refund"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : loading ? (
        <LoadingState label="Loading invoices…" />
      ) : invoices.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No invoices yet.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <div onClick={() => toggleExpand(inv)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="f-body" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-deep)" }}>
                    {inv.patientId} — {inv.desc}
                  </div>
                  <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>{inv.date} · ${inv.amount.toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge tone={INVOICE_TONE[inv.status]}>{inv.status}</Badge>
                  {expandedId === inv.id ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
                </div>
              </div>

              {expandedId === inv.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  {loadingDetail ? (
                    <LoadingState label="Loading payments…" />
                  ) : !detail?.payments?.length ? (
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>No payments recorded for this invoice.</div>
                  ) : (
                    detail.payments.map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                        <div className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)" }}>
                          ${p.amount.toFixed(2)} via {p.method || "—"}
                          <span className="f-mono" style={{ fontSize: 10, color: "var(--muted)", marginLeft: 6 }}>{p.gatewayReference}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge tone={PAYMENT_TONE[p.status]}>{PAYMENT_LABEL[p.status] || p.status}</Badge>
                          {p.status === "success" && (
                            <Button small variant="ghost" icon={Undo2} disabled={refundingId === p.id} onClick={() => handleRefund(p.id)}>
                              {refundingId === p.id ? "Refunding…" : "Refund"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
