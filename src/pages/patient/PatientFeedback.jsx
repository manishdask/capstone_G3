import React, { useEffect, useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { listStaff } from "../../services/staffService.js";
import { submitFeedback } from "../../services/feedbackService.js";

export default function PatientFeedback() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [doctorStaffId, setDoctorStaffId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listStaff({ staff_type: "doctor" }).then(setDoctors).catch(() => setDoctors([]));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please enter your feedback comment."); return; }
    setError("");
    setSubmitting(true);
    try {
      await submitFeedback({ doctorStaffId: doctorStaffId || null, comment: comment.trim(), rating });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <ScreenHeader title="Patient Feedback" subtitle="Your experience matters" />
        <div style={{ padding: "40px 18px", textAlign: "center" }}>
          <CheckCircle2 size={52} color="var(--sage)" style={{ margin: "0 auto 16px" }} />
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
            Thank you!
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Your feedback has been recorded and will be reviewed by our quality team.
          </div>
          <div style={{ marginTop: 20 }}>
            <Button small onClick={() => { setSubmitted(false); setRating(0); setComment(""); setDoctorStaffId(""); }}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Patient Feedback" subtitle="Rate your experience" />
      <div style={{ padding: "0 18px 20px" }}>
        <form onSubmit={handleSubmit}>
          <Card style={{ marginBottom: 12, textAlign: "center" }}>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              How would you rate your overall experience?
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star size={32} fill={(hovered || rating) >= star ? "var(--amber)" : "transparent"} color={(hovered || rating) >= star ? "var(--amber)" : "var(--line)"} style={{ transition: "all 0.1s" }} />
                </button>
              ))}
            </div>
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", height: 16 }}>
              {rating > 0 && ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Doctor <span style={{ color: "#9CAAA6" }}>(optional)</span>
            </label>
            <select
              value={doctorStaffId}
              onChange={(e) => setDoctorStaffId(e.target.value)}
              className="f-body"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5 }}
            >
              <option value="">General feedback (no specific doctor)</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>
              ))}
            </select>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Your feedback <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience in detail..."
              className="f-body"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12.5, resize: "none" }}
            />
          </Card>

          {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }} role="alert">{error}</div>}

          <Button full icon={Send} type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Feedback"}
          </Button>

          <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 10, textAlign: "center", lineHeight: 1.4 }}>
            Used solely for quality improvement purposes. Privacy Act 1988 compliant.
          </div>
        </form>
      </div>
    </div>
  );
}
