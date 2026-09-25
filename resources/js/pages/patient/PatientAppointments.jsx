import React, { useEffect, useState } from "react";
import { Clock, X, Calendar, Bell } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";
import { listNotifications } from "../../services/notificationService.js";

function isActive(a) {
  return a.status === "Pending" || a.status === "Confirmed";
}

// Whole days from today (local calendar) to a YYYY-MM-DD key.
function daysUntil(dateKey) {
  if (!dateKey) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - start) / 86400000);
}

function whenLabel(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * FR16–20. The "Reminders" sub-tab (dashboard quick action) shows upcoming
 * confirmed/pending visits soonest-first, plus the FR20 appointment
 * notifications the backend has raised for this patient. The sub-tab is owned
 * by AppRoot so it survives a page refresh.
 */
export default function PatientAppointments({ tab = "appointments", onTabChange }) {
  const [appointments, setAppointments] = useState([]);
  const [reminderNotices, setReminderNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [appts, notices] = await Promise.all([
        listAppointments(),
        // The notification feed is secondary here; never fail the page on it.
        listNotifications().catch(() => ({ items: [] })),
      ]);
      setAppointments(appts);
      setReminderNotices(notices.items.filter((n) => (n.template || "").startsWith("appointment_")));
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

  const upcoming = appointments
    .filter((a) => isActive(a) && (daysUntil(a.rawDate) ?? -1) >= 0)
    .sort((a, b) => (a.rawDate + a.rawStartTime).localeCompare(b.rawDate + b.rawStartTime));

  return (
    <div>
      <ScreenHeader
        title={tab === "reminders" ? "Reminders" : "My appointments"}
        subtitle={tab === "reminders" ? "Upcoming visits & alerts · FR20" : "FR16–20 · Booking status tracker"}
      />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}

      <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
        {[
          ["appointments", "Appointments"],
          ["reminders", "Reminders"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => onTabChange && onTabChange(k)}
            className="f-body"
            style={{
              padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--line)",
              background: tab === k ? "var(--ink)" : "#fff",
              color: tab === k ? "#fff" : "var(--ink-deep)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label={tab === "reminders" ? "Loading reminders…" : "Loading appointments…"} />
      ) : tab === "reminders" ? (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)" }}>
            Upcoming visits
          </div>
          {upcoming.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <Calendar size={28} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No upcoming appointments to remind you about.
              </div>
            </Card>
          ) : (
            upcoming.map((a) => (
              <Card key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)" }}>
                      {a.doctor}
                    </div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                      {a.specialty}{a.branch ? ` · ${a.branch}` : ""}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Clock size={12} color="var(--muted)" />
                      <span className="f-body" style={{ fontSize: 12 }}>{a.date} · {a.time}</span>
                    </div>
                  </div>
                  <Badge tone="warn">{whenLabel(daysUntil(a.rawDate))}</Badge>
                </div>
              </Card>
            ))
          )}

          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", marginTop: 8 }}>
            Appointment alerts
          </div>
          {reminderNotices.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>No appointment alerts yet.</div>
            </Card>
          ) : (
            reminderNotices.map((n) => (
              <Card key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Bell size={15} color="var(--ink)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", lineHeight: 1.45 }}>{n.message}</div>
                  <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{n.date} · {n.time}</div>
                </div>
              </Card>
            ))
          )}
        </div>
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
                {isActive(a) && (
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
