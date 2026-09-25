import React, { useEffect, useMemo, useState } from "react";
import { Star, ChevronRight, Building2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listStaff } from "../../services/staffService.js";
import { listPublicBranches } from "../../services/branchService.js";

/**
 * SRS 4.1.3 Appointment Request Form order: Select Branch, Select Specialty,
 * Select Doctor, then date/time (chosen on the next screen).
 */
export default function PatientFind({ onSelect, user }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user?.branchId ? String(user.branchId) : "all");
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [spec, setSpec] = useState("All");
  const [gender, setGender] = useState("Any");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listPublicBranches()
      .then((list) => {
        setBranches(list);
        if (user?.branchId) {
          setBranchId(String(user.branchId));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setBranchesLoading(false));
  }, [user?.branchId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await listStaff({ staff_type: "doctor" });
      setDoctors(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const specialties = useMemo(() => {
    const set = new Set();
    ["Cardiology", "Dermatology", "General Medicine", "Orthopaedics", "Paediatrics"].forEach((s) => set.add(s));
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return ["All", ...Array.from(set).sort()];
  }, [doctors]);

  const list = doctors.filter(
    (d) =>
      (branchId === "all" || !branchId || String(d.branchId) === String(branchId)) &&
      (spec === "All" || d.specialty?.toLowerCase() === spec.toLowerCase()) &&
      (gender === "Any" || d.gender?.toLowerCase() === gender.toLowerCase())
  );

  return (
    <div>
      <ScreenHeader title="Find a doctor" subtitle="Select branch, specialty and doctor · FR16–17" />
      {error && <div style={{ padding: "0 18px 10px" }}><ErrorState message={error} onRetry={load} /></div>}

      <div style={{ padding: "0 18px 10px" }}>
        <label className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <Building2 size={12} /> Branch
        </label>
        {branchesLoading ? (
          <LoadingState label="Loading branches…" />
        ) : (
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="f-body"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13, background: "#fff" }}
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.name} ({b.state})</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ padding: "0 18px 10px", display: "flex", gap: 8, overflowX: "auto" }}>
        {specialties.map((s) => (
          <button
            key={s}
            onClick={() => setSpec(s)}
            className="f-body"
            style={{
              flexShrink: 0, padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--line)",
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
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--line)",
              background: gender === g ? "var(--tint-neutral)" : "#fff", color: "var(--ink-deep)",
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <LoadingState label="Loading doctors…" />
        ) : list.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 20 }}>
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
              No doctors match these filters{branchId !== "all" ? " at this branch" : ""}.
            </div>
          </Card>
        ) : (
          list.map((d) => (
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
                    {d.rating ? (
                      <>
                        <Star size={12} fill="var(--amber)" color="var(--amber)" />
                        <span className="f-body" style={{ fontSize: 12, fontWeight: 600 }}>{d.rating}</span>
                        <span className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>({d.reviews})</span>
                      </>
                    ) : (
                      <span className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>No reviews yet</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--muted)" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
