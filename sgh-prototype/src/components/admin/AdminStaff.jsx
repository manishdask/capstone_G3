import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { Plus, UserMinus, UserCheck } from "lucide-react";

export default function AdminStaff({ staff = [], branches = [], onAddStaff, onToggleStatus }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Doctor · Cardiology");
  const [branch, setBranch] = useState("Kogarah");
  const [error, setError] = useState("");

  const roles = [
    "Doctor · Cardiology",
    "Doctor · Orthopaedics",
    "Doctor · Paediatrics",
    "Doctor · General Practice",
    "Doctor · Dermatology",
    "Doctor · Neurology",
    "Nurse",
    "Receptionist",
    "Lab Technician",
    "Pharmacist"
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please input a staff member name.");
      return;
    }
    setError("");
    onAddStaff({ name: name.trim(), role, branch });
    setName("");
    setShowAddForm(false);
  }

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>
            Staff management
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            FR5, FR21–25 · Add, deactivate or modify accounts
          </div>
        </div>
        {!showAddForm && (
          <Button small icon={Plus} onClick={() => setShowAddForm(true)}>
            Add Staff
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card style={{ background: "#EEF1EE", border: "none", marginBottom: 14 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Create Staff Account
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                Staff Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. प्रिया सिंह"
                className="f-body"
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Designation / Specialty
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  {roles.map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Assigned Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button small variant="dark" type="submit">Create Account</Button>
              <Button small variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {staff.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < staff.length - 1 ? "1px solid var(--line)" : "none" }}
          >
            <Avatar name={s.name} size={34} />
            <div style={{ flex: 1 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 13.5 }}>
                {s.name}
              </div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {s.role} · {s.branch} Branch
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone={s.status === "Active" ? "success" : "danger"}>{s.status}</Badge>
              <Button
                small
                variant={s.status === "Active" ? "danger" : "ghost"}
                icon={s.status === "Active" ? UserMinus : UserCheck}
                onClick={() => onToggleStatus(i)}
              >
                {s.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
