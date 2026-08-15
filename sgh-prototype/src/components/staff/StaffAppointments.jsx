import React from "react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";
import { statusTone } from "../../utils/statusTone.js";

export default function StaffAppointments({ appointments = [] }) {
  return (
    <div>
      <ScreenHeader title="Appointment desk" subtitle="FR18 · Tracking and administrative overview" />
      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {appointments.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 20 }}>
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
              No appointments registered in the system.
            </div>
          </Card>
        ) : (
          appointments.map((a) => (
            <Card key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {a.doctor}
                  </div>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)" }}>
                    Patient: <strong>{a.patientName}</strong> ({a.patientId})
                  </div>
                  <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {a.date} · {a.time}
                  </div>
                  <div className="f-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    {a.id}
                  </div>
                </div>
                <Badge tone={statusTone(a.status)}>{a.status}</Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
