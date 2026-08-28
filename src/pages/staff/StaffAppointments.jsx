import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listAppointments } from "../../services/appointmentService.js";

export default function StaffAppointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAppointments(await listAppointments({ branch_id: user?.branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.branchId]);

  return (
    <div>
      <ScreenHeader title="Appointment desk" subtitle="FR18 · Tracking and administrative overview" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading appointments…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No appointments registered for this branch.
              </div>
            </Card>
          ) : (
            appointments.map((a) => (
              <Card key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{a.doctor}</div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                      Patient: <strong>{a.patientName}</strong> ({a.patientId})
                    </div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {a.date} · {a.time}
                    </div>
                    <div className="f-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>APT-{a.id}</div>
                  </div>
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
