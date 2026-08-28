import React, { useEffect, useState } from "react";
import { Download, CheckCircle2, CreditCard, X, Lock } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listLabOrders, downloadLabResult } from "../../services/labService.js";
import { listPrescriptions } from "../../services/pharmacyService.js";
import { listInvoices, payInvoice, downloadInvoicePdf } from "../../services/billingService.js";

export default function PatientRecords({ user }) {
  const [tab, setTab] = useState("records");
  const [labRequests, setLabRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payingInv, setPayingInv] = useState(null);
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);
  const [paying, setPaying] = useState(false);

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

  async function handlePay(e) {
    e.preventDefault();
    if (cardNum.replace(/\s/g, "").length !== 16) { setPayError("Enter a valid 16-digit credit card number."); return; }
    if (!cardExp.trim() || !cardExp.includes("/")) { setPayError("Enter expiration MM/YY."); return; }
    if (cardCvv.length !== 3) { setPayError("Enter 3-digit CVV code."); return; }

    setPayError("");
    setPaying(true);
    try {
      await payInvoice(payingInv.id, "card");
      setPaySuccess(true);
      setTimeout(() => {
        setPayingInv(null);
        setPaySuccess(false);
        setCardNum(""); setCardExp(""); setCardCvv("");
        load();
      }, 1200);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
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
                        <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)", marginTop: 6, background: "#f5f6f2", padding: "6px 8px", borderRadius: 6 }}>
                          Result: <strong>{l.result}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                      {l.status === "Ready" && l.resultId && (
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
                      <Button small variant="dark" icon={CheckCircle2} onClick={() => { setPayingInv(i); setPayError(""); setPaySuccess(false); }}>
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
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(11,36,34,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 34 }}>
          <Card style={{ width: "100%", maxWidth: 330, background: "#fff", border: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={16} /> Online Checkout
              </div>
              <button onClick={() => setPayingInv(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              Amount: <strong style={{ color: "var(--ink-deep)", fontSize: 13.5 }}>${payingInv.amount.toFixed(2)} AUD</strong> <br />
              Ref: <span className="f-mono">INV-{payingInv.id}</span>
            </div>

            {paySuccess ? (
              <div style={{ textAlign: "center", padding: "14px 0", color: "var(--sage)" }}>
                <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                <div className="f-body" style={{ fontSize: 13, fontWeight: 700 }}>Payment Authorized!</div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Updating ledger...</div>
              </div>
            ) : (
              <form onSubmit={handlePay}>
                <div style={{ marginBottom: 10 }}>
                  <label className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Cardholder Name</label>
                  <input value={user?.name || ""} disabled className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", background: "#f5f6f2", fontSize: 12 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Credit Card Number</label>
                  <input
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value.replace(/[^0-9]/g, "").substring(0, 16))}
                    placeholder="4111 2222 3333 4444"
                    className="f-mono"
                    style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>Expiry MM/YY</label>
                    <input value={cardExp} onChange={(e) => setCardExp(e.target.value.substring(0, 5))} placeholder="12/28" className="f-mono" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>CVV Code</label>
                    <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, "").substring(0, 3))} placeholder="123" className="f-mono" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
                  </div>
                </div>

                {payError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, marginBottom: 10 }}>{payError}</div>}

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--muted)", marginBottom: 12 }}>
                  <Lock size={12} color="var(--sage)" /> Sandboxed gateway (FR40) — no card details are stored.
                </div>

                <Button full variant="dark" type="submit" disabled={paying}>
                  {paying ? "Processing…" : `Pay $${payingInv.amount.toFixed(2)} AUD`}
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
