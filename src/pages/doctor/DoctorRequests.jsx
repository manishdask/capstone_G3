import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";

export default function DoctorRequests() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAppointments(await listAppointments({ status: "pending" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDecision(id, decision) {
    setActingId(id);
    setError("");
    try {
      await updateAppointmentStatus(id, decision === "accept" ? "confirmed" : "rejected");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <ScreenHeader title="Appointment requests" subtitle="FR18 · Accept or reject incoming patient requests" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No pending appointment requests.
              </div>
            </Card>
          ) : (
            appointments.map((r) => (
              <Card key={r.id}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Avatar name={r.patientName} size={36} bg="var(--amber-deep)" />
                  <div style={{ flex: 1 }}>
                    <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{r.patientName}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.reason || "Consultation"}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      Date preferred: {r.date} · {r.time}
                    </div>
                    <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                      ID: {r.patientId} · APT-{r.id}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button small variant="dark" icon={Check} disabled={actingId === r.id} onClick={() => handleDecision(r.id, "accept")}>
                    Accept
                  </Button>
                  <Button small variant="danger" icon={X} disabled={actingId === r.id} onClick={() => handleDecision(r.id, "reject")}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
