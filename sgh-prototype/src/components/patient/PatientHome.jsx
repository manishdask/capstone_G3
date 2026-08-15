import React, { useState } from "react";
import { Search, FileText, FlaskConical, CreditCard, Bell, X, AlertCircle, Calendar, Clock } from "lucide-react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import PulseDivider from "../ui/PulseDivider.jsx";
import Badge from "../ui/Badge.jsx";

export default function PatientHome({ user, goBook, appointments = [], prescriptions = [], onCancelAppointment, onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  const [showNotifications, setShowNotifications] = useState(false);

  // Find the first confirmed or pending appointment
  const upcoming = appointments.filter(a => a.status === "Confirmed" || a.status === "Pending")[0] || null;

  // Notifications: appointment reminders (within 2-hour alert window for demo)
  const notifications = [
    ...(upcoming
      ? [{ id: "n1", type: "reminder", msg: `Upcoming: ${upcoming.doctor} — ${upcoming.date} at ${upcoming.time}`, time: "2 hrs" }]
      : []),
    { id: "n2", type: "system", msg: "System maintenance scheduled: Sun 18 Aug 2026 02:00–04:00 AEST", time: "1 day" },
    { id: "n3", type: "system", msg: "Your lab report for Full Blood Count is now available.", time: "3 hrs" },
  ];

  // Active prescription (first)
  const activePrescription = prescriptions.find(p => p.status === "Active");

  return (
    <div>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
              {greeting}
            </div>
            <div className="f-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink-deep)" }}>
              {user?.name?.split(" ")[0]}
            </div>
            <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              ID {user?.patientId} · {user?.branch} Branch
            </div>
          </div>
          {/* Notifications bell */}
          <button
            onClick={() => setShowNotifications(true)}
            style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}
            aria-label="Open notifications"
          >
            <Bell size={22} color="var(--ink)" />
            {notifications.length > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--rose)", border: "2px solid var(--mist)"
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Medical Summary Widget */}
      {(user?.allergies || activePrescription) && (
        <div style={{ padding: "12px 18px 0" }}>
          <Card style={{ background: "#FFF8EE", border: "1px solid #F2E0B8", padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <AlertCircle size={13} color="var(--amber-deep)" />
              <span className="f-display" style={{ fontSize: 12, fontWeight: 700, color: "var(--amber-deep)" }}>Medical Summary</span>
            </div>
            {user?.allergies && user.allergies !== "None declared" && (
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--rose)", marginBottom: 4 }}>
                ⚠ Allergy alert: <strong>{user.allergies}</strong>
              </div>
            )}
            {activePrescription && (
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)" }}>
                Active Rx: <strong>{activePrescription.medicine}</strong> — {activePrescription.dosage}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Next Appointment Banner */}
      <div style={{ padding: "12px 18px" }}>
        <Card style={{ background: "var(--ink)", border: "none" }}>
          {upcoming ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div className="f-body" style={{ color: "#CFE0DC", fontSize: 12 }}>
                    Next appointment ({upcoming.status})
                  </div>
                  <div className="f-display" style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                    {upcoming.doctor}
                  </div>
                  <div className="f-body" style={{ color: "#CFE0DC", fontSize: 12, marginTop: 2 }}>
                    {upcoming.date} · {upcoming.time}
                  </div>
                  <div className="f-body" style={{ color: "#8FA39E", fontSize: 11, marginTop: 2 }}>
                    {upcoming.specialty}
                  </div>
                </div>
                <PulseDivider color="#F2A73B" width={70} height={30} />
              </div>
              {/* Reschedule / Cancel actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => onNavigate && onNavigate("find")}
                  className="f-body"
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                    background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)",
                    cursor: "pointer"
                  }}
                >
                  Reschedule
                </button>
                {upcoming.status !== "Cancelled" && (
                  <button
                    onClick={() => onCancelAppointment && onCancelAppointment(upcoming.id)}
                    className="f-body"
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                      background: "rgba(193,67,91,0.25)", color: "#FFB3BF", border: "1px solid rgba(193,67,91,0.4)",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              <div className="f-body" style={{ color: "#CFE0DC", fontSize: 12.5 }}>
                No upcoming consultations scheduled.
              </div>
              <div className="f-body" style={{ color: "#8FA39E", fontSize: 11, marginTop: 2 }}>
                Use the button below to book an appointment slot.
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Book Appointment CTA */}
      <div style={{ padding: "0 18px 8px" }}>
        <Button full icon={Calendar} onClick={goBook}>
          Book an Appointment
        </Button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "10px 18px 20px" }}>
        <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 10 }}>
          Quick actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: FileText, label: "Records", nav: "records" },
            { icon: FlaskConical, label: "Lab reports", nav: "records" },
            { icon: CreditCard, label: "Invoices", nav: "records" },
            { icon: Bell, label: "Reminders", nav: null },
          ].map((a, i) => (
            <Card
              key={i}
              style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: a.nav ? "pointer" : "default" }}
              onClick={() => a.nav && onNavigate && onNavigate(a.nav)}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EEF1EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <a.icon size={17} color="var(--ink)" />
              </div>
              <span className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>
                {a.label}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(11,36,34,0.6)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end",
            borderRadius: 34
          }}
          onClick={() => setShowNotifications(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "24px 24px 34px 34px", padding: "20px 18px 24px", maxHeight: "65%" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={16} color="var(--ink)" /> Notifications
              </div>
              <button onClick={() => setShowNotifications(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notifications.map(n => (
                <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "#F5F6F2", borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: n.type === "reminder" ? "#FEF3E2" : "#EEF1EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {n.type === "reminder" ? <Clock size={14} color="var(--amber-deep)" /> : <Bell size={14} color="var(--ink)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", lineHeight: 1.4 }}>{n.msg}</div>
                    <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{n.time} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
