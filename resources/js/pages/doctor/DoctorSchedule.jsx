import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";
import { toDateKey } from "../../services/adapters.js";

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [confirmed, completed] = await Promise.all([
        listAppointments({ status: "confirmed" }),
        listAppointments({ status: "completed" }),
      ]);
      const today = toDateKey(new Date());
      setAppointments(
        [...confirmed, ...completed]
          .filter((a) => a.rawDate === today)
          .sort((a, b) => (a.rawStartTime || "").localeCompare(b.rawStartTime || ""))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // FR37: completing the visit is what appends the appointment's lab orders and
  // procedures to its invoice (or raises a supplementary one if it was already
  // paid), so the doctor needs this action for the billing flow to close.
  async function handleComplete(appointment) {
    setCompletingId(appointment.id);
    setError("");
    setNotice("");
    try {
      await updateAppointmentStatus(appointment.id, "completed", "Visit completed");
      setNotice(`Visit for ${appointment.patientName} marked completed — the invoice has been updated.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div>
      <ScreenHeader title="Today's schedule" subtitle="FR37 · Mark a visit completed to finalise its invoice" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {notice && (
        <div style={{ padding: "0 18px 12px" }}>
          <Card style={{ background: "var(--tint-success)", border: "none", padding: "10px 12px" }}>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{notice}</div>
          </Card>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading schedule…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No appointments scheduled for today.
              </div>
            </Card>
          ) : (
            appointments.map((s) => (
              <Card key={s.id}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="f-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", width: 76 }}>
                    {s.time}
                  </div>
                  <div style={{ width: 1, height: 30, background: "var(--line)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{s.patientName}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {s.reason || "Consultation"} · {s.patientId}
                    </div>
                  </div>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </div>

                {s.status === "Confirmed" && (
                  <div style={{ marginTop: 10 }}>
                    <Button
                      small
                      variant="dark"
                      icon={Check}
                      disabled={completingId === s.id}
                      onClick={() => handleComplete(s)}
                    >
                      {completingId === s.id ? "Completing…" : "Mark completed"}
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
