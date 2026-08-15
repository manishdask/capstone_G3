import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { Plus } from "lucide-react";

export default function AdminBranches({ branches = [], onAddBranch }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState("NSW");
  const [beds, setBeds] = useState("100");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please input a branch name.");
      return;
    }
    setError("");
    onAddBranch({ name: name.trim(), state, beds });
    setName("");
    setBeds("100");
    setShowAddForm(false);
  }

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>
            Branches
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            FR6–10 · Multi-branch management
          </div>
        </div>
        {!showAddForm && (
          <Button small icon={Plus} onClick={() => setShowAddForm(true)}>
            Add Branch
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card style={{ background: "#EEF1EE", border: "none", marginBottom: 14 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Create Hospital Branch
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                Branch Name / Location
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kogarah, Chatswood"
                className="f-body"
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option>NSW</option>
                  <option>VIC</option>
                  <option>QLD</option>
                  <option>WA</option>
                  <option>TAS</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Bed Capacity
                </label>
                <input
                  type="number"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button small variant="dark" type="submit">Create Branch</Button>
              <Button small variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {branches.map((b) => (
          <Card key={b.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="f-display" style={{ fontWeight: 700, fontSize: 15 }}>
                  {b.name}
                </div>
                <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {b.state} · {b.id}
                </div>
              </div>
              <Badge tone="success">Active</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                  Patients
                </div>
                <div className="f-display" style={{ fontWeight: 700 }}>
                  {b.patients.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                  Beds
                </div>
                <div className="f-display" style={{ fontWeight: 700 }}>
                  {b.beds}
                </div>
              </div>
              <div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                  Occupancy
                </div>
                <div className="f-display" style={{ fontWeight: 700 }}>
                  {b.occupancy}%
                </div>
              </div>
              <div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                  Revenue
                </div>
                <div className="f-display" style={{ fontWeight: 700 }}>
                  ${(b.revenue / 1000).toFixed(0)}k
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
