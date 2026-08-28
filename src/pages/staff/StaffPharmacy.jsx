import React, { useEffect, useState } from "react";
import { Check, ArrowUpRight, ShieldAlert, X } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listMedicines, listPrescriptions, dispensePrescriptionItem, requestRestock } from "../../services/pharmacyService.js";
import { ApiError } from "../../services/api.js";

export default function StaffPharmacy({ user }) {
  const [tab, setTab] = useState("inventory");
  const [stock, setStock] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);
  const [notice, setNotice] = useState("");
  // FR63 (proposed): pending allergy-conflict confirmation, awaiting an override reason.
  const [allergyPrompt, setAllergyPrompt] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [meds, rx] = await Promise.all([
        listMedicines({ branch_id: user?.branchId }),
        listPrescriptions({ branch_id: user?.branchId, status: "active" }),
      ]);
      setStock(meds);
      setPrescriptions(rx);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.branchId]);

  async function handleDispense(prescriptionId, itemId, medicineName, overrideReasonArg) {
    const key = `${prescriptionId}-${itemId}`;
    setBusyKey(key);
    setError("");
    try {
      await dispensePrescriptionItem(prescriptionId, itemId, overrideReasonArg);
      setAllergyPrompt(null);
      setOverrideReason("");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.payload?.allergy_conflict) {
        setAllergyPrompt({ prescriptionId, itemId, medicineName, matchedAllergy: err.payload.matched_allergy, message: err.message });
      } else {
        setError(err.message);
      }
    } finally {
      setBusyKey(null);
    }
  }

  function handleConfirmOverride() {
    if (!allergyPrompt || overrideReason.trim().length < 10) return;
    handleDispense(allergyPrompt.prescriptionId, allergyPrompt.itemId, allergyPrompt.medicineName, overrideReason.trim());
  }

  async function handleRestock(medicine) {
    setBusyKey(`restock-${medicine.id}`);
    setNotice("");
    setError("");
    try {
      const qty = Math.max(medicine.min * 2 - medicine.qty, medicine.min);
      await requestRestock(medicine.id, qty);
      setNotice(`Restock order placed for ${medicine.name} (+${qty} units) — pending delivery.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <LoadingState label="Loading pharmacy data…" />;

  return (
    <div>
      <ScreenHeader title="Pharmacy stock" subtitle="FR26–30 · Medicine dispensing and low stock alerts" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {notice && <div style={{ padding: "0 18px 12px" }}><div className="f-body" style={{ background: "#E7F3EB", color: "var(--sage)", border: "1px solid var(--sage)", borderRadius: 10, padding: "8px 12px", fontSize: 12 }}>{notice}</div></div>}

      <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
        {[["inventory", "Inventory Stock"], ["prescriptions", "Prescriptions Queue"]].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="f-body"
            style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid var(--line)", background: tab === k ? "var(--ink)" : "#fff", color: tab === k ? "#fff" : "var(--ink-deep)" }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "inventory" && (
          stock.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 18 }}>
              <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>No medicines stocked at this branch.</div>
            </Card>
          ) : (
            stock.map((p) => (
              <Card key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      {p.qty} units · min threshold {p.min}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    {(p.status === "Low" || p.status === "Critical") && (
                      <Button small variant="ghost" icon={ArrowUpRight} disabled={busyKey === `restock-${p.id}`} onClick={() => handleRestock(p)}>
                        Restock Order
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )
        )}

        {tab === "prescriptions" && (
          <div>
            <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
              Active Doctor Prescriptions ({prescriptions.length})
            </div>

            {prescriptions.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 18 }}>
                <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>No active prescriptions to dispense.</div>
              </Card>
            ) : (
              prescriptions.map((p) => (
                <Card key={p.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                        Patient: <strong>{p.patientName}</strong> ({p.patientId})
                      </div>
                      <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Prescribed by {p.doctorName}
                      </div>
                    </div>
                    <Badge tone="success">Active</Badge>
                  </div>

                  {p.items.map((item) => {
                    const stockItem = stock.find((s) => s.id === item.medicineId);
                    const outOfStock = stockItem ? stockItem.qty === 0 : false;
                    const key = `${p.id}-${item.id}`;
                    return (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                        <div>
                          <div className="f-display" style={{ fontWeight: 700, fontSize: 13 }}>{item.medicine}</div>
                          <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{item.dosage} · {item.frequency}</div>
                        </div>
                        <Button small variant={outOfStock ? "danger" : "dark"} disabled={outOfStock || busyKey === key} icon={Check} onClick={() => handleDispense(p.id, item.id, item.medicine)}>
                          {outOfStock ? "Out of Stock" : busyKey === key ? "Dispensing…" : "Dispense"}
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {allergyPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,36,34,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true" aria-label="Allergy conflict">
          <div style={{ background: "#fff", borderRadius: 18, padding: "24px 22px", maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--rose)", display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={17} /> Allergy Conflict (FR63)
              </div>
              <button onClick={() => { setAllergyPrompt(null); setOverrideReason(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>
            </div>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", lineHeight: 1.5, marginBottom: 14 }}>
              {allergyPrompt.message}
            </div>
            <label className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 5 }}>Override reason (required to proceed)</label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Confirmed with prescribing doctor — patient tolerates this formulation."
              className="f-body"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: 8, fontSize: 12.5, resize: "none", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button small variant="danger" disabled={overrideReason.trim().length < 10 || busyKey} onClick={handleConfirmOverride}>
                {busyKey ? "Dispensing…" : "Override & Dispense"}
              </Button>
              <Button small variant="ghost" onClick={() => { setAllergyPrompt(null); setOverrideReason(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
