import React from "react";
import Card from "../ui/Card.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

export default function DoctorSchedule({ appointments = [] }) {
  return (
    <div>
      <ScreenHeader title="Today's schedule" subtitle="Confirmed consultations for today" />
      <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {appointments.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 20 }}>
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
              No confirmed appointments scheduled for today.
            </div>
          </Card>
        ) : (
          appointments.map((s, i) => (
            <Card key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="f-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", width: 66 }}>
                {s.time}
              </div>
              <div style={{ width: 1, height: 30, background: "var(--line)" }} />
              <div style={{ flex: 1 }}>
                <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>
                  {s.patientName}
                </div>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {s.reason || "Consultation"} · {s.patientId}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
