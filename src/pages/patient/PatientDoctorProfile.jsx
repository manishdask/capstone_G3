import React, { useEffect, useState } from "react";
import { ChevronLeft, Check, Calendar } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import { getDoctorAvailability, bookAppointment } from "../../services/appointmentService.js";
import { formatTime } from "../../services/adapters.js";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Generates 30-minute bookable slots from the doctor's availability windows, minus already-booked slots. */
function computeSlots(schedules, bookedSlots, duration = 30) {
  const slots = [];
  for (const window of schedules) {
    let cursor = timeToMinutes(window.start_time);
    const end = timeToMinutes(window.end_time);
    while (cursor + duration <= end) {
      const slotEnd = cursor + duration;
      const overlaps = bookedSlots.some((b) => {
        const bStart = timeToMinutes(b.start_time);
        const bEnd = timeToMinutes(b.end_time);
        return bStart < slotEnd && bEnd > cursor;
      });
      if (!overlaps) slots.push(minutesToTime(cursor));
      cursor += duration;
    }
  }
  return slots;
}

export default function PatientDoctorProfile({ doctor, onBack }) {
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [alternatives, setAlternatives] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    let cancelled = false;
    setLoadingSlots(true);
    setTime("");
    setAlternatives([]);
    getDoctorAvailability(doctor.id, date)
      .then((data) => {
        if (cancelled) return;
        setSlots(computeSlots(data.schedules || [], data.booked_slots || []));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [doctor, date]);

  if (!doctor) return null;

  async function handleConfirm() {
    if (!time) {
      setError("Please select an available time slot.");
      return;
    }
    setError("");
    setAlternatives([]);
    setSubmitting(true);

    const endTime = minutesToTime(timeToMinutes(time) + 30);

    try {
      const { appointment, alternatives: alts, message } = await bookAppointment({
        branchId: doctor.branchId,
        specialization: doctor.specialty,
        doctorStaffId: doctor.id,
        date,
        startTime: time,
        endTime,
        reason: "Requested via Patient App",
      });

      if (appointment) {
        setBooked(true);
      } else {
        setError(message || "That slot was just taken. Please choose another.");
        setAlternatives(alts || []);
        setTime("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
          <ChevronLeft size={16} />
          <span className="f-body" style={{ fontSize: 13 }}>Back</span>
        </button>
      </div>
      <div style={{ padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <Avatar name={doctor.name} size={58} />
        <div>
          <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-deep)" }}>
            {doctor.name}
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            {doctor.specialty} · {doctor.branch}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 18px" }}>
        <Card>
          <div className="f-body" style={{ fontSize: 13, color: "var(--ink-deep)", lineHeight: 1.5 }}>
            {doctor.bio || "No biography on file yet."}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Rating</div>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700 }}>
                {doctor.rating ? `${doctor.rating} ★` : "New"}
              </div>
            </div>
            <div>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Fee</div>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700 }}>
                {doctor.fee ? `$${doctor.fee}` : "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {!booked && (
        <div style={{ padding: "14px 18px" }}>
          <div className="f-display" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            Choose date &amp; time · FR16–17
          </div>
          <Card>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Preferred date
            </label>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="f-body"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13, marginBottom: 14 }}
            />

            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Preferred time slot
            </label>
            {loadingSlots ? (
              <LoadingState label="Checking availability…" />
            ) : slots.length === 0 ? (
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", padding: "8px 0" }}>
                No available slots on this date. Try another date.
              </div>
            ) : (
              <select
                value={time}
                onChange={(e) => { setTime(e.target.value); setError(""); }}
                className="f-body"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13 }}
              >
                <option value="">Select a time</option>
                {slots.map((t) => (
                  <option key={t} value={t}>{formatTime(t)}</option>
                ))}
              </select>
            )}

            {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 12, marginTop: 10 }}>{error}</div>}
            {alternatives.length > 0 && (
              <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Try: {alternatives.map(formatTime).join(", ")}
              </div>
            )}
          </Card>
        </div>
      )}

      <div style={{ padding: "0 18px 20px" }}>
        {booked ? (
          <Card style={{ background: "#E7F3EB", border: "none", textAlign: "center" }}>
            <Check size={20} color="var(--sage)" style={{ margin: "0 auto 6px" }} />
            <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>
              Request sent for {date} at {formatTime(time)} — awaiting doctor confirmation
            </div>
          </Card>
        ) : (
          <Button full icon={Calendar} onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Sending request…" : "Request appointment"}
          </Button>
        )}
      </div>
    </div>
  );
}
