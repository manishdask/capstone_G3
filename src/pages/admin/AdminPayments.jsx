import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listInvoices, getInvoice } from "../../services/billingService.js";
import { refundPayment } from "../../services/paymentService.js";

const INVOICE_TONE = { Paid: "success", Pending: "warn", Cancelled: "danger" };
const PAYMENT_TONE = { success: "success", pending: "warn", failed: "danger", refunded: "default" };

/** FR64 (proposed): payment/refund visibility for billing staff. */
export default function AdminPayments({ user }) {
  const [invoices, setInvoices] = useState([]);
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
      setInvoices(await listInvoices(user?.branchId ? { branch_id: user.branchId } : {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.branchId]);

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
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR64 · Payment history per invoice, with a staff-initiated refund flow
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
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
                          <Badge tone={PAYMENT_TONE[p.status]}>{p.status}</Badge>
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
