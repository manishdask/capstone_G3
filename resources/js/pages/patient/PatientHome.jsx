import React, { useEffect, useState } from "react";
import { FileText, FlaskConical, CreditCard, Bell, X, AlertCircle, Calendar, Clock } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import PulseDivider from "../../components/ui/PulseDivider.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";
import { listPrescriptions } from "../../services/pharmacyService.js";

export default function PatientHome({ user, goBook, onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  const [showNotifications, setShowNotifications] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [appts, rx] = await Promise.all([listAppointments(), listPrescriptions()]);
      setAppointments(appts);
      setPrescriptions(rx);
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

  if (loading) return <LoadingState label="Loading your dashboard…" />;

  const upcoming = appointments.filter((a) => a.status === "Confirmed" || a.status === "Pending")[0] || null;
  const activePrescription = prescriptions.find((p) => p.status === "Active");

  const notifications = [
    ...(upcoming
      ? [{ id: "n1", type: "reminder", msg: `Upcoming: ${upcoming.doctor} — ${upcoming.date} at ${upcoming.time}`, time: "soon" }]
      : []),
    { id: "n2", type: "system", msg: "Reminders are queued 2 hours before each confirmed appointment.", time: "" },
  ];

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
          <button
            onClick={() => setShowNotifications(true)}
            style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}
            aria-label="Open notifications"
          >
            <Bell size={22} color="var(--ink)" />
            {notifications.length > 0 && (
              <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "var(--rose)", border: "2px solid var(--mist)" }} />
            )}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: "10px 18px 0" }}><ErrorState message={error} onRetry={load} /></div>}

      {(user?.allergies || activePrescription) && (
        <div style={{ padding: "12px 18px 0" }}>
          <Card style={{ background: "var(--tint-amber)", border: "1px solid var(--line-amber)", padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <AlertCircle size={13} color="var(--amber-deep)" />
              <span className="f-display" style={{ fontSize: 12, fontWeight: 700, color: "var(--amber-deep)" }}>Medical Summary</span>
            </div>
            {user?.allergies && (
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

      <div style={{ padding: "12px 18px" }}>
        <Card style={{ background: "var(--ink)", border: "none" }}>
          {upcoming ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div className="f-body" style={{ color: "var(--on-dark-body)", fontSize: 12 }}>
                    Next appointment ({upcoming.status})
                  </div>
                  <div className="f-display" style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                    {upcoming.doctor}
                  </div>
                  <div className="f-body" style={{ color: "var(--on-dark-body)", fontSize: 12, marginTop: 2 }}>
                    {upcoming.date} · {upcoming.time}
                  </div>
                  <div className="f-body" style={{ color: "var(--on-dark-muted)", fontSize: 11, marginTop: 2 }}>
                    {upcoming.specialty}
                  </div>
                </div>
                <PulseDivider color="var(--amber)" width={70} height={30} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => handleCancel(upcoming.id)}
                  className="f-body"
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, background: "rgba(193,67,91,0.25)", color: "var(--tint-alert)", border: "1px solid rgba(193,67,91,0.4)", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              <div className="f-body" style={{ color: "var(--on-dark-body)", fontSize: 12.5 }}>
                No upcoming consultations scheduled.
              </div>
              <div className="f-body" style={{ color: "var(--on-dark-muted)", fontSize: 11, marginTop: 2 }}>
                Use the button below to book an appointment slot.
              </div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: "0 18px 8px" }}>
        <Button full icon={Calendar} onClick={goBook}>
          Book an Appointment
        </Button>
      </div>

      <div style={{ padding: "10px 18px 20px" }}>
        <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 10 }}>
          Quick actions
        </div>
        <div className="grid-fluid" style={{ "--col-min": "130px", "--grid-gap": "10px" }}>
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
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--tint-neutral)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <a.icon size={17} color="var(--ink)" />
              </div>
              <span className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>
                {a.label}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {showNotifications && (
        <div
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(11,36,34,0.6)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 34 }}
          onClick={() => setShowNotifications(false)}
        >
          <div style={{ background: "#fff", borderRadius: "24px 24px 34px 34px", padding: "20px 18px 24px", maxHeight: "65%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={16} color="var(--ink)" /> Notifications
              </div>
              <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--mist)", borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: n.type === "reminder" ? "var(--tint-amber)" : "var(--tint-neutral)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {n.type === "reminder" ? <Clock size={14} color="var(--amber-deep)" /> : <Bell size={14} color="var(--ink)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", lineHeight: 1.4 }}>{n.msg}</div>
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
