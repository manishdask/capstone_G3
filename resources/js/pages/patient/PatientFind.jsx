import React, { useEffect, useMemo, useState } from "react";
import { Star, ChevronRight, Building2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listStaff } from "../../services/staffService.js";
import { listPublicBranches } from "../../services/branchService.js";

// The hospital's standard specialties (StaffSeeder). Always offered so a
// patient can see that, e.g., no Cardiology doctor works at their branch —
// each pill shows a live count instead of silently returning nothing.
const STANDARD_SPECIALTIES = ["Cardiology", "Dermatology", "General Medicine", "Orthopaedics", "Paediatrics"];

const sameText = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

/**
 * SRS 4.1.3 Appointment Request Form order: Select Branch, Select Specialty,
 * Select Doctor, then date/time (chosen on the next screen).
 */
export default function PatientFind({ onSelect, user }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("all");
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [spec, setSpec] = useState("All");
  const [gender, setGender] = useState("Any");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // /public/branches returns ACTIVE branches only. Preselect the patient's own
  // branch only when it is one of them: a <select> whose value matches no
  // <option> renders as the first option ("All Branches") while the filter
  // still applies the hidden value — and choosing "All Branches" then fires
  // no change event, so the patient could never widen the search.
  useEffect(() => {
    listPublicBranches()
      .then((list) => {
        setBranches(list);
        const own = user?.branchId ? String(user.branchId) : null;
        setBranchId(own && list.some((b) => String(b.id) === own) ? own : "all");
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

  // Only doctors a patient can actually book: an active account at an active
  // branch. GET /staff returns deactivated staff and closed branches too.
  const bookable = useMemo(() => {
    const open = new Set(branches.map((b) => String(b.id)));
    return doctors.filter((d) => d.status === "Active" && open.has(String(d.branchId)));
  }, [doctors, branches]);

  const matchesBranch = (d) => branchId === "all" || String(d.branchId) === branchId;
  const matchesGender = (d) => gender === "Any" || sameText(d.gender, gender);
  const matchesSpec = (d) => spec === "All" || sameText(d.specialty, spec);

  // Pill counts respect the branch and gender filters, so they always equal
  // the number of cards the pill would show.
  const specialties = useMemo(() => {
    const pool = bookable.filter((d) => matchesBranch(d) && matchesGender(d));
    const names = new Map(STANDARD_SPECIALTIES.map((s) => [s.toLowerCase(), s]));
    bookable.forEach((d) => {
      const key = (d.specialty || "").trim().toLowerCase();
      if (key && !names.has(key)) names.set(key, d.specialty.trim());
    });
    const counted = Array.from(names.values())
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, count: pool.filter((d) => sameText(d.specialty, name)).length }));
    return [{ name: "All", count: pool.length }, ...counted];
  }, [bookable, branchId, gender]);

  const list = bookable.filter((d) => matchesBranch(d) && matchesSpec(d) && matchesGender(d));

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
        {specialties.map(({ name, count }) => (
          <button
            key={name}
            onClick={() => setSpec(name)}
            className="f-body"
            style={{
              flexShrink: 0, padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", border: "1px solid var(--line)",
              background: spec === name ? "var(--ink)" : "#fff",
              color: spec === name ? "#fff" : count === 0 ? "var(--muted)" : "var(--ink-deep)",
            }}
          >
            {name} ({count})
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
        {loading || branchesLoading ? (
          <LoadingState label="Loading doctors…" />
        ) : list.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 20 }}>
            <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
              No {spec === "All" ? "" : `${spec} `}doctors{gender === "Any" ? "" : ` (${gender.toLowerCase()})`}
              {branchId === "all" ? " at any branch" : " at this branch"}.
              {branchId !== "all" && (
                <button
                  onClick={() => setBranchId("all")}
                  className="f-body"
                  style={{ display: "block", margin: "8px auto 0", background: "none", border: "none", color: "var(--ink)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}
                >
                  Search all branches
                </button>
              )}
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
