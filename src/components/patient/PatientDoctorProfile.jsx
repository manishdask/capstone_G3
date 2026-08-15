import React, { useState } from "react";
import { ChevronLeft, Check, Calendar } from "lucide-react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";

const TIME_SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "11:00 AM", "11:30 AM", "1:30 PM", "2:00 PM", "3:00 PM", "3:40 PM", "4:30 PM"];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function PatientDoctorProfile({ doctor, onBack, onBooked }) {
  const [booked, setBooked] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  if (!doctor) return null;

  function handleConfirm() {
    if (!date) {
      setError("Please select a preferred date.");
      return;
    }
    if (!time) {
      setError("Please select a preferred time slot.");
      return;
    }
    setError("");
    setBooked(true);
    onBooked && onBooked({ date, time });
  }

  return (
    <div>
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
          <ChevronLeft size={16} />
          <span className="f-body" style={{ fontSize: 13 }}>
            Back
          </span>
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
            {doctor.bio}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                Rating
              </div>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700 }}>
                {doctor.rating} ★
              </div>
            </div>
            <div>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                Fee
              </div>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700 }}>
                ${doctor.fee}
              </div>
            </div>
            <div>
              <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                Next slot
              </div>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700 }}>
                {doctor.next}
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
              onChange={(e) => { setDate(e.target.value); setError(""); }}
              className="f-body"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13, marginBottom: 14 }}
            />

            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Preferred time slot
            </label>
            <select
              value={time}
              onChange={(e) => { setTime(e.target.value); setError(""); }}
              className="f-body"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13 }}
            >
              <option value="">Select a time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {error && (
              <div className="f-body" style={{ color: "var(--rose)", fontSize: 12, marginTop: 10 }}>
                {error}
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
              Request sent for {date} at {time} — awaiting doctor confirmation
            </div>
          </Card>
        ) : (
          <Button full icon={Calendar} onClick={handleConfirm}>
            Request appointment
          </Button>
        )}
      </div>
    </div>
  );
}