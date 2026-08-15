import React, { useState } from "react";
import { Star, ChevronRight } from "lucide-react";
import Card from "../ui/Card.jsx";
import ScreenHeader from "../ui/ScreenHeader.jsx";
import Avatar from "../ui/Avatar.jsx";
import { DOCTORS, SPECIALTIES } from "../../data/mockData.js";

export default function PatientFind({ onSelect }) {
  const [spec, setSpec] = useState("All");
  const [gender, setGender] = useState("Any");
  const list = DOCTORS.filter(
    (d) => (spec === "All" || d.specialty === spec) && (gender === "Any" || d.gender === gender)
  );

  return (
    <div>
      <ScreenHeader title="Find a doctor" subtitle="Filter by specialty or gender · FR16–17" />
      <div style={{ padding: "0 18px 10px", display: "flex", gap: 8, overflowX: "auto" }}>
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            onClick={() => setSpec(s)}
            className="f-body"
            style={{
              flexShrink: 0,
              padding: "7px 13px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid var(--line)",
              background: spec === s ? "var(--ink)" : "#fff",
              color: spec === s ? "#fff" : "var(--ink-deep)",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 18px 12px", display: "flex", gap: 8 }}>
        {["Any", "Female", "Male"].map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className="f-body"
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid var(--line)",
              background: gender === g ? "#EEF1EE" : "#fff",
              color: "var(--ink-deep)",
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((d) => (
          <Card key={d.id} style={{ cursor: "pointer" }}>
            <div onClick={() => onSelect(d)} style={{ display: "flex", gap: 12 }}>
              <Avatar name={d.name} />
              <div style={{ flex: 1 }}>
                <div className="f-display" style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-deep)" }}>
                  {d.name}
                </div>
                <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {d.specialty} · {d.branch}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Star size={12} fill="var(--amber)" color="var(--amber)" />
                  <span className="f-body" style={{ fontSize: 12, fontWeight: 600 }}>
                    {d.rating}
                  </span>
                  <span className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                    ({d.reviews})
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--muted)" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
