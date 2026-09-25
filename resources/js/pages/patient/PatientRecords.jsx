import React, { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import StripeCheckoutModal from "../../components/ui/StripeCheckoutModal.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listLabOrders, downloadLabResult } from "../../services/labService.js";
import { listPrescriptions } from "../../services/pharmacyService.js";
import { listInvoices, downloadInvoicePdf } from "../../services/billingService.js";

/**
 * The sub-tab is owned by AppRoot (not local state) so a pill clicked here, a
 * dashboard quick action and a page refresh all agree on which tab is open.
 */
export default function PatientRecords({ user, tab = "records", onTabChange }) {
  const setTab = (k) => onTabChange && onTabChange(k);

  const [labRequests, setLabRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payingInv, setPayingInv] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [labs, rx, inv] = await Promise.all([listLabOrders(), listPrescriptions(), listInvoices()]);
      setLabRequests(labs);
      setPrescriptions(rx);
      setInvoices(inv);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // FR40: close the checkout modal and refresh the invoice list.
  function handleCheckoutSuccess() {
    setPayingInv(null);
    load();
  }

  async function downloadLabReport(l) {
    if (!l.resultId) return;
    try {
      await downloadLabResult(l.resultId, `${l.test}-report.pdf`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadInvoice(i) {
    try {
      await downloadInvoicePdf(i.id);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading your records…" />;

  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      <ScreenHeader title="Health records" subtitle="Encrypted at rest & in transit · AES + TLS" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}

      <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
        {[
          ["records", "Medical history"],
          ["labs", "Lab reports"],
          ["invoices", "Invoices"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="f-body"
            style={{
              padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--line)",
              background: tab === k ? "var(--ink)" : "#fff",
              color: tab === k ? "#fff" : "var(--ink-deep)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "records" && (
          <div>
            <Card style={{ marginBottom: 10 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>Known allergies</div>
              <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>
                {user?.allergies || "None declared"}
              </div>
            </Card>

            <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8, marginTop: 10 }}>
              Prescriptions (FR28)
            </div>

            {prescriptions.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 20 }}>
                <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>No prescriptions on file.</div>
              </Card>
            ) : (
              prescriptions.map((p) => (
                <Card key={p.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{p.medicine || "Multiple items"}</div>
                      {p.dosage && <div className="f-body" style={{ fontSize: 12, color: "var(--ink)" }}>Dosage: <strong>{p.dosage}</strong></div>}
                      <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        Prescribed by {p.doctorName} on {p.date}
                      </div>
                    </div>
                    <Badge tone={p.status === "Active" ? "success" : "neutral"}>{p.status}</Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "labs" && (
          <div>
            {labRequests.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 28 }}>
                <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No lab reports requested yet (FR33).</div>
              </Card>
            ) : (
              labRequests.map((l) => (
                <Card key={l.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{l.test}</div>
                      <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {l.date === "Pending" ? "Status: Request received" : `Released: ${l.date}`}
                      </div>
                      {l.status === "Ready" && l.result && (
                        <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)", marginTop: 6, background: "var(--mist)", padding: "6px 8px", borderRadius: 6 }}>
                          Result: <strong>{l.result}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                      {l.status === "Ready" && l.resultId && l.hasReportFile && (
                        <Button small variant="ghost" icon={Download} onClick={() => downloadLabReport(l)}>
                          Get Report
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "invoices" && (
          <div>
            {invoices.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 28 }}>
                <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>No invoices generated yet (FR37).</div>
              </Card>
            ) : (
              invoices.map((i) => (
                <Card key={i.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{i.desc}</div>
                      <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                        {i.date} · <strong>${i.amount.toFixed(2)} AUD</strong>
                      </div>
                    </div>
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Button small variant="ghost" icon={Download} onClick={() => downloadInvoice(i)}>
                      Print Bill
                    </Button>
                    {i.status === "Pending" && (
                      <Button small variant="dark" icon={CheckCircle2} onClick={() => setPayingInv(i)}>
                        Pay online
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {payingInv && (
        <StripeCheckoutModal
          invoice={payingInv}
          onClose={() => setPayingInv(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
