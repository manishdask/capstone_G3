import React, { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";
import Button from "../ui/Button.jsx";

const CATEGORIES = ["Appointment Experience", "Doctor Communication", "Waiting Time", "Facility Cleanliness", "Staff Friendliness", "Overall Care"];

export default function PatientFeedback({ user, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [branch, setBranch] = useState(user?.branch || "Kogarah");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!category) { setError("Please select a feedback category."); return; }
    if (!comment.trim()) { setError("Please enter your feedback comment."); return; }
    setError("");

    onSubmit({
      id: `FB-${Math.floor(10000 + Math.random() * 89999)}`,
      patientId: user?.patientId,
      patientName: user?.name,
      branch,
      doctor: doctor.trim() || "General",
      category,
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <ScreenHeader title="Patient Feedback" subtitle="FR47 · Your experience matters" />
        <div style={{ padding: "40px 18px", textAlign: "center" }}>
          <CheckCircle2 size={52} color="var(--sage)" style={{ margin: "0 auto 16px" }} />
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>
            Thank you, {user?.name?.split(" ")[0]}!
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Your feedback has been recorded and will be reviewed by our quality team. We appreciate you helping us improve St. George Hospital services.
          </div>
          <div style={{ marginTop: 20 }}>
            <Button small onClick={() => { setSubmitted(false); setRating(0); setComment(""); setCategory(""); setDoctor(""); }}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Patient Feedback" subtitle="FR47 · Rate your experience" />
      <div style={{ padding: "0 18px 20px" }}>
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <Card style={{ marginBottom: 12, textAlign: "center" }}>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              How would you rate your overall experience?
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    size={32}
                    fill={(hovered || rating) >= star ? "var(--amber)" : "transparent"}
                    color={(hovered || rating) >= star ? "var(--amber)" : "var(--line)"}
                    style={{ transition: "all 0.1s" }}
                  />
                </button>
              ))}
            </div>
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", height: 16 }}>
              {rating > 0 && ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </div>
          </Card>

          {/* Feedback Category */}
          <Card style={{ marginBottom: 12 }}>
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Feedback category</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="f-body"
                  style={{
                    padding: "6px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                    border: "1px solid var(--line)", cursor: "pointer",
                    background: category === cat ? "var(--ink)" : "#fff",
                    color: category === cat ? "#fff" : "var(--ink-deep)",
                    transition: "all 0.15s"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Doctor name (optional) */}
          <Card style={{ marginBottom: 12 }}>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Doctor name <span style={{ color: "#9CAAA6" }}>(optional)</span>
            </label>
            <input
              value={doctor}
              onChange={e => setDoctor(e.target.value)}
              placeholder="e.g. Dr. Amelia Chen"
              className="f-body"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5 }}
            />
          </Card>

          {/* Comment */}
          <Card style={{ marginBottom: 12 }}>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Your feedback <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience in detail..."
              className="f-body"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12.5, resize: "none" }}
            />
          </Card>

          {error && (
            <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }} role="alert">
              {error}
            </div>
          )}

          <Button full icon={Send} type="submit">
            Submit Feedback
          </Button>

          <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 10, textAlign: "center", lineHeight: 1.4 }}>
            Your feedback is anonymous and used solely for quality improvement purposes. Privacy Act 1988 compliant.
          </div>
        </form>
      </div>
    </div>
  );
}
