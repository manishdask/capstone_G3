import React from "react";
import { Check, X } from "lucide-react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";

export default function DoctorRequests({ appointments = [], onDecision }) {
  return (
    <div>
      <ScreenHeader title="Appointment requests" subtitle="FR18 · Accept or reject incoming patient requests" />
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
                  <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {r.patientName}
                  </div>
                  <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {r.reason}
                  </div>
                  <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    Date preferred: {r.date} · {r.time}
                  </div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                    ID: {r.patientId} · {r.id}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button small variant="dark" icon={Check} onClick={() => onDecision(r.id, "accept")}>
                  Accept
                </Button>
                <Button small variant="danger" icon={X} onClick={() => onDecision(r.id, "reject")}>
                  Reject
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
