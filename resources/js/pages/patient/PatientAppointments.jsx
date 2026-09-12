import React, { useEffect, useState } from "react";
import { Clock, X, Calendar } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAppointments(await listAppointments());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id) {
    try {
      await updateAppointmentStatus(id, "cancelled", "Cancelled by patient");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <ScreenHeader title="My appointments" subtitle="FR16–20 · Booking status tracker" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading appointments…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <Calendar size={28} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No appointments requested yet.
              </div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                Use the Home tab to find a doctor and book an appointment.
              </div>
            </Card>
          ) : (
            appointments.map((a) => (
              <Card key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)" }}>
                      {a.doctor}
                    </div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                      {a.specialty}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Clock size={12} color="var(--muted)" />
                      <span className="f-body" style={{ fontSize: 12 }}>{a.date} · {a.time}</span>
                    </div>
                    {a.reason && (
                      <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        Reason: <em>{a.reason}</em>
                      </div>
                    )}
                    <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>
                      APT-{a.id}
                    </div>
                  </div>
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </div>
                {(a.status === "Pending" || a.status === "Confirmed") && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                    <Button small variant="danger" icon={X} onClick={() => handleCancel(a.id)}>
                      Cancel Appointment
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
