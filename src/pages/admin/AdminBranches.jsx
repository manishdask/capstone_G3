import React, { useEffect, useState } from "react";
import { Plus, Pencil, X, Ban, RotateCcw } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import {
  listBranches, createBranch, updateBranch, deactivateBranch, reactivateBranch,
} from "../../services/branchService.js";

const STATES = ["NSW", "VIC", "QLD", "WA", "TAS", "SA", "ACT", "NT"];
const EMPTY_FORM = { name: "", state: "NSW", address: "", contactNumber: "", email: "", beds: "100" };

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setBranches(await listBranches());
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
    if (!form.name.trim()) { setFormError("Please input a branch name."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await createBranch({
        name: form.name.trim(),
        state: form.state,
        address: form.address.trim() || undefined,
        contact_number: form.contactNumber.trim() || undefined,
        email: form.email.trim() || undefined,
        capacity: Number(form.beds) || undefined,
      });
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(b) {
    setEditingId(b.id);
    setEditError("");
    setEditForm({
      name: b.name, state: b.state || "NSW", address: b.address || "",
      contactNumber: "", email: "", beds: String(b.beds || ""),
    });
  }

  function setEditField(key, value) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  async function handleEditSubmit(e, branchId) {
    e.preventDefault();
    if (!editForm.name.trim()) { setEditError("Please input a branch name."); return; }
    setEditError("");
    setEditSubmitting(true);
    try {
      await updateBranch(branchId, {
        name: editForm.name.trim(),
        state: editForm.state,
        address: editForm.address.trim() || undefined,
        contact_number: editForm.contactNumber.trim() || undefined,
        email: editForm.email.trim() || undefined,
        capacity: Number(editForm.beds) || undefined,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleStatus(b) {
    setBusyId(b.id);
    setError("");
    try {
      if (b.status === "Active") await deactivateBranch(b.id);
      else await reactivateBranch(b.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState label="Loading branches…" />;

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>Branches</div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>FR6–10 · Multi-branch management</div>
        </div>
        {!showAddForm && (
          <Button small icon={Plus} onClick={() => setShowAddForm(true)}>Add Branch</Button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {showAddForm && (
        <Card style={{ background: "#EEF1EE", border: "none", marginBottom: 14 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Create Hospital Branch</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Branch Name / Location</label>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Chatswood" className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>State</label>
                <select value={form.state} onChange={(e) => setField("state", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Bed Capacity</label>
                <input type="number" value={form.beds} onChange={(e) => setField("beds", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} required />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Address</label>
              <input value={form.address} onChange={(e) => setField("address", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Contact Number</label>
                <input value={form.contactNumber} onChange={(e) => setField("contactNumber", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="f-body" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="f-body" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
              </div>
            </div>

            {formError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 10 }}>{formError}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <Button small variant="dark" type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Branch"}</Button>
              <Button small variant="ghost" onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {branches.map((b) => (
          <Card key={b.id}>
            {editingId === b.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, b.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="f-display" style={{ fontWeight: 700, fontSize: 13 }}>Edit Branch</div>
                  <button type="button" onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                    <X size={15} />
                  </button>
                </div>
                <input value={editForm.name} onChange={(e) => setEditField("name", e.target.value)} placeholder="Branch name" className="f-body" style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }} required />
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select value={editForm.state} onChange={(e) => setEditField("state", e.target.value)} className="f-body" style={{ flex: 1, padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <input type="number" value={editForm.beds} onChange={(e) => setEditField("beds", e.target.value)} placeholder="Beds" className="f-body" style={{ flex: 1, padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12 }} />
                </div>
                <input value={editForm.address} onChange={(e) => setEditField("address", e.target.value)} placeholder="Address" className="f-body" style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }} />
                {editError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, marginBottom: 8 }}>{editError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <Button small variant="dark" type="submit" disabled={editSubmitting}>{editSubmitting ? "Saving…" : "Save"}</Button>
                  <Button small variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div className="f-display" style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                    <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>{b.state}</div>
                  </div>
                  <Badge tone={b.status === "Active" ? "success" : "danger"}>{b.status}</Badge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <div>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Patients</div>
                    <div className="f-display" style={{ fontWeight: 700 }}>{b.patients.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Staff</div>
                    <div className="f-display" style={{ fontWeight: 700 }}>{b.staffCount}</div>
                  </div>
                  <div>
                    <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Bed capacity</div>
                    <div className="f-display" style={{ fontWeight: 700 }}>{b.beds}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <Button small variant="ghost" icon={Pencil} onClick={() => startEdit(b)}>Edit</Button>
                  <Button
                    small
                    variant={b.status === "Active" ? "danger" : "dark"}
                    icon={b.status === "Active" ? Ban : RotateCcw}
                    disabled={busyId === b.id}
                    onClick={() => handleToggleStatus(b)}
                  >
                    {busyId === b.id ? "Working…" : b.status === "Active" ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
