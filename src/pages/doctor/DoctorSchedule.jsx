import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listAppointments } from "../../services/appointmentService.js";

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const all = await listAppointments({ status: "confirmed" });
      const today = new Date().toISOString().slice(0, 10);
      setAppointments(all.filter((a) => a.rawDate === today));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <ScreenHeader title="Today's schedule" subtitle="Confirmed consultations for today" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading schedule…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No confirmed appointments scheduled for today.
              </div>
            </Card>
          ) : (
            appointments.map((s) => (
              <Card key={s.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
