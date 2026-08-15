import React, { useState } from "react";
import { Check, AlertTriangle, ArrowUpRight } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";
import { statusTone } from "../../utils/statusTone.js";

export default function StaffPharmacy({ stock = [], prescriptions = [], onDispense, onRestock }) {
  const [tab, setTab] = useState("inventory");

  const activePrescriptions = prescriptions.filter((p) => p.status === "Active");

  return (
    <div>
      <ScreenHeader title="Pharmacy stock" subtitle="FR26–30 · Medicine dispensing and low stock alerts" />
      
      <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
        {[
          ["inventory", "Inventory Stock"],
          ["prescriptions", "Prescriptions Queue"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="f-body"
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
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
        {tab === "inventory" && (
          stock.map((p) => (
            <Card key={p.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {p.name}
                  </div>
                  <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {p.qty} units · min threshold {p.min}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  {(p.status === "Low" || p.status === "Critical") && (
                    <Button small variant="ghost" icon={ArrowUpRight} onClick={() => onRestock(p.name)}>
                      Restock Order
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}

        {tab === "prescriptions" && (
          <div>
            <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
              Active Doctor Prescriptions ({activePrescriptions.length})
            </div>

            {activePrescriptions.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 18 }}>
                <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                  No active prescriptions to dispense.
                </div>
              </Card>
            ) : (
              activePrescriptions.map((p) => {
                const stockItem = stock.find((item) => item.name === p.medicine);
                const outOfStock = stockItem ? stockItem.qty === 0 : true;

                return (
                  <Card key={p.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                          {p.medicine}
                        </div>
                        <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                          Patient: <strong>{p.patientName}</strong> ({p.patientId})
                        </div>
                        <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                          Dosage: {p.dosage}
                        </div>
                        <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          Prescribed by {p.doctorName}
                        </div>
                      </div>
                      <Badge tone="success">Active</Badge>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Button
                        small
                        variant={outOfStock ? "danger" : "dark"}
                        disabled={outOfStock}
                        icon={Check}
                        onClick={() => onDispense(p.medicine, p.patientId)}
                      >
                        {outOfStock ? "Out of Stock" : "Dispense"}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
