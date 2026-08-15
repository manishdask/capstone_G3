import React, { useState } from "react";
import { Star, MessageSquare, TrendingUp } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

// Determine sentiment from star rating
function getSentiment(rating) {
  if (rating >= 4) return { label: "Positive", tone: "success", color: "var(--sage)" };
  if (rating === 3) return { label: "Neutral", tone: "neutral", color: "var(--muted)" };
  return { label: "Negative", tone: "danger", color: "var(--rose)" };
}

function SentimentBadge({ rating }) {
  const s = getSentiment(rating);
  return (
    <span
      className="f-body"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 999, fontSize: 11,
        fontWeight: 700, background: `${s.color}18`, color: s.color,
        border: `1px solid ${s.color}44`
      }}
    >
      {rating >= 4 ? "😊" : rating === 3 ? "😐" : "😞"} {s.label}
    </span>
  );
}

function StarRow({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={11} fill={rating >= s ? "var(--amber)" : "transparent"} color={rating >= s ? "var(--amber)" : "var(--line)"} />
      ))}
    </div>
  );
}

export default function AdminFeedback({ feedbacks = [] }) {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? feedbacks : feedbacks.filter(f => getSentiment(f.rating).label === filter);

  // Aggregate stats
  const avg = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>Patient Feedback</div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>FR47 · Sentiment analysis dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={16} color="var(--sage)" />
          <span className="f-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-deep)" }}>{avg}</span>
          <span className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>/ 5</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total responses", value: feedbacks.length, color: "var(--ink-deep)" },
          { label: "Positive (≥4★)", value: positiveCount, color: "var(--sage)" },
          { label: "Negative (≤2★)", value: negativeCount, color: "var(--rose)" },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center" }}>
            <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["All", "Positive", "Neutral", "Negative"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="f-body"
            style={{
              padding: "6px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: "1px solid var(--line)", cursor: "pointer",
              background: filter === f ? "var(--ink)" : "#fff",
              color: filter === f ? "#fff" : "var(--ink-deep)"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {feedbacks.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <MessageSquare size={28} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            No patient feedback submitted yet. Encourage patients to rate their experience!
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 20 }}>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            No {filter.toLowerCase()} feedback entries.
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(f => (
            <Card key={f.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <StarRow rating={f.rating} />
                    <SentimentBadge rating={f.rating} />
                  </div>
                  <div className="f-body" style={{ fontSize: 13, color: "var(--ink-deep)", lineHeight: 1.5, marginBottom: 6 }}>
                    "{f.comment}"
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                      Category: <strong>{f.category}</strong>
                    </div>
                    {f.doctor && f.doctor !== "General" && (
                      <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                        Doctor: <strong>{f.doctor}</strong>
                      </div>
                    )}
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                      Branch: <strong>{f.branch}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <div className="f-body" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-deep)" }}>
                    {f.patientName}
                  </div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    {f.patientId}
                  </div>
                  <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>
                    {f.date} · {f.time}
                  </div>
                  <div className="f-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                    {f.id}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
