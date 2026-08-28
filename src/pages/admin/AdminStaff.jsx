import React, { useEffect, useState } from "react";
import { Plus, UserMinus, UserCheck } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listStaff, createStaff, updateStaff } from "../../services/staffService.js";
import { listBranches } from "../../services/branchService.js";

const STAFF_TYPES = [
  ["doctor", "Doctor"],
  ["nurse", "Nurse"],
  ["receptionist", "Receptionist"],
  ["pharmacist", "Pharmacist"],
  ["lab_technician", "Lab Technician"],
  ["branch_manager", "Branch Manager"],
];

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", staffType: "doctor", specialization: "", branchId: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, b] = await Promise.all([listStaff({}), listBranches()]);
      setStaff(s);
      setBranches(b);
      setForm((f) => (f.branchId ? f : { ...f, branchId: b[0]?.id ?? "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Please input a staff member name."); return; }
    if (!form.email.trim()) { setFormError("Please input an email address."); return; }
    if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (form.staffType === "doctor" && !form.specialization.trim()) { setFormError("Please input a specialization."); return; }

    setFormError("");
    setSubmitting(true);
    try {
      await createStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        staff_type: form.staffType,
        specialization: form.staffType === "doctor" ? form.specialization.trim() : undefined,
        branch_id: Number(form.branchId),
      });
      setForm({ name: "", email: "", password: "", staffType: "doctor", specialization: "", branchId: form.branchId });
      setShowAddForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(s) {
    setBusyId(s.id);
    setError("");
    try {
      await updateStaff(s.id, { status: s.status === "Active" ? "inactive" : "active" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState label="Loading staff…" />;

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>Staff management</div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>FR5, FR21–25 · Add, deactivate or modify accounts</div>
        </div>
        {!showAddForm && <Button small icon={Plus} onClick={() => setShowAddForm(true)}>Add Staff</Button>}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {showAddForm && (
        <Card style={{ background: "#EEF1EE", border: "none", marginBottom: 14 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Create Staff Account</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Full Name</label>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Dr. Priya Singh" className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Temporary Password</label>
                <input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Role</label>
                <select value={form.staffType} onChange={(e) => setField("staffType", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}>
                  {STAFF_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Assigned Branch</label>
                <select value={form.branchId} onChange={(e) => setField("branchId", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {form.staffType === "doctor" && (
              <div style={{ marginBottom: 12 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Specialization</label>
                <input value={form.specialization} onChange={(e) => setField("specialization", e.target.value)} placeholder="e.g. Cardiology" className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
              </div>
            )}

            {formError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }}>{formError}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <Button small variant="dark" type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Account"}</Button>
              <Button small variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {staff.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < staff.length - 1 ? "1px solid var(--line)" : "none" }}>
            <Avatar name={s.name} size={34} />
            <div style={{ flex: 1 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.role} · {s.branch} Branch</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone={s.status === "Active" ? "success" : "danger"}>{s.status}</Badge>
              <Button small variant={s.status === "Active" ? "danger" : "ghost"} icon={s.status === "Active" ? UserMinus : UserCheck} disabled={busyId === s.id} onClick={() => toggleStatus(s)}>
                {s.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
