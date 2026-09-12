import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { statusTone } from "../../utils/statusTone.js";
import { listAppointments, updateAppointmentStatus } from "../../services/appointmentService.js";
import { toDateKey } from "../../services/adapters.js";

/**
 * FR18 (as implemented): bookings are auto-confirmed the moment a free slot is
 * taken, so there is no approval queue to work through — this screen used to
 * poll for `pending` appointments and was therefore always empty. What staff DO
 * retain under the documented deviation is the ability to reject or cancel a
 * booking with a recorded reason, so that is what this screen offers.
 */
export default function DoctorRequests() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const today = toDateKey(new Date());
      const confirmed = await listAppointments({ status: "confirmed" });
      setAppointments(
        confirmed
          .filter((a) => a.rawDate >= today)
          .sort((a, b) => a.rawDate.localeCompare(b.rawDate) || (a.rawStartTime || "").localeCompare(b.rawStartTime || ""))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReject(id) {
    if (!reason.trim()) {
      setError("Please give a reason — it is recorded against the appointment.");
      return;
    }
    setActingId(id);
    setError("");
    try {
      await updateAppointmentStatus(id, "rejected", reason.trim());
      setReasonFor(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <ScreenHeader
        title="Upcoming appointments"
        subtitle="FR18 · Bookings auto-confirm; reject one here with a recorded reason"
      />
      {error && <div style={{ padding: "0 18px 12px" }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading appointments…" />
      ) : (
        <div style={{ padding: "0 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
                No upcoming appointments.
              </div>
            </Card>
          ) : (
            appointments.map((r) => (
              <Card key={r.id}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Avatar name={r.patientName} size={36} bg="var(--amber-deep)" />
                  <div style={{ flex: 1 }}>
                    <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700 }}>{r.patientName}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.reason || "Consultation"}</div>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {r.date} · {r.time}
                    </div>
                    <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                      ID: {r.patientId} · APT-{r.id}
                    </div>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>

                {reasonFor === r.id ? (
                  <div style={{ marginTop: 10 }}>
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (recorded on the appointment)"
                      className="f-body"
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button small variant="danger" disabled={actingId === r.id} onClick={() => handleReject(r.id)}>
                        {actingId === r.id ? "Rejecting…" : "Confirm rejection"}
                      </Button>
                      <Button small variant="ghost" onClick={() => { setReasonFor(null); setReason(""); setError(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <Button small variant="danger" icon={X} onClick={() => { setReasonFor(r.id); setReason(""); setError(""); }}>
                      Reject
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
