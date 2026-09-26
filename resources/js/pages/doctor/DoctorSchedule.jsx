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

const byTime = (a, b) => (a.rawStartTime || "").localeCompare(b.rawStartTime || "");

// YYYY-MM-DD key shifted by whole days, in local time.
function shiftDay(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

function dayLabel(key, today) {
  if (key === today) return "Today";
  if (key === shiftDay(today, 1)) return "Tomorrow";
  if (key === shiftDay(today, -1)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/**
 * FR37. The doctor can page through any day, not only today — this screen
 * used to filter to today alone, so a day with no bookings showed nothing at
 * all. Past visits still marked Confirmed are listed under "Awaiting
 * completion": nothing else surfaces them, and until one is completed its
 * invoice can never be finalised.
 */
export default function DoctorSchedule() {
  const today = toDateKey(new Date());
  const [all, setAll] = useState([]);
  const [day, setDay] = useState(today);
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
      setAll([...confirmed, ...completed]);
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

  const appointments = all.filter((a) => a.rawDate === day).sort(byTime);
  const overdue = all
    .filter((a) => a.status === "Confirmed" && a.rawDate < today)
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate) || byTime(a, b));
  // Days that have bookings, so the doctor can jump straight to one.
  const bookedDays = Array.from(new Set(all.map((a) => a.rawDate))).sort();
  const nextBooked = bookedDays.find((k) => k > day);
  const prevBooked = [...bookedDays].reverse().find((k) => k < day);

  const navBtn = {
    padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "#fff",
    fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--ink-deep)",
  };

  const renderVisit = (s, showDate) => (
    <Card key={s.id}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="f-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", width: 76 }}>
          {showDate && <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{s.date}</div>}
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
  );

  return (
    <div>
      <ScreenHeader title="Schedule" subtitle="FR37 · Mark a visit completed to finalise its invoice" />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {notice && (
        <div style={{ padding: "0 18px 12px" }}>
          <Card style={{ background: "var(--tint-success)", border: "none", padding: "10px 12px" }}>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{notice}</div>
          </Card>
        </div>
      )}

      <div style={{ padding: "0 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={navBtn} aria-label="Previous day" onClick={() => setDay(shiftDay(day, -1))}>‹</button>
          <input
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            aria-label="Schedule date"
            className="f-body"
            style={{ flex: 1, minWidth: 0, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5 }}
          />
          <button style={navBtn} aria-label="Next day" onClick={() => setDay(shiftDay(day, 1))}>›</button>
          {day !== today && <button style={navBtn} onClick={() => setDay(today)}>Today</button>}
        </div>
        <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)", marginTop: 10 }}>
          {dayLabel(day, today)} · {appointments.length} visit{appointments.length === 1 ? "" : "s"}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading schedule…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No appointments on this day.
              </div>
              {(prevBooked || nextBooked) && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
                  {prevBooked && <button style={navBtn} onClick={() => setDay(prevBooked)}>‹ {dayLabel(prevBooked, today)}</button>}
                  {nextBooked && <button style={navBtn} onClick={() => setDay(nextBooked)}>{dayLabel(nextBooked, today)} ›</button>}
                </div>
              )}
            </Card>
          ) : (
            appointments.map((s) => renderVisit(s, false))
          )}

          {overdue.length > 0 && (
            <>
              <div className="f-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--amber-deep)", marginTop: 10 }}>
                Awaiting completion · {overdue.length}
              </div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: -4 }}>
                Past visits still marked Confirmed. Complete them so their invoices can be finalised.
              </div>
              {overdue.map((s) => renderVisit(s, true))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
