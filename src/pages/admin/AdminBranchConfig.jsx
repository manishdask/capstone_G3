import React, { useEffect, useState } from "react";
import { Plus, Pencil, Ban, Building2, Stethoscope, BedDouble, Pill } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listBranches } from "../../services/branchService.js";
import {
  listDepartments, createDepartment, updateDepartment, deactivateDepartment,
  listServices, createService, updateService, deactivateService,
} from "../../services/branchConfigService.js";
import { listBeds, createBed, updateBed } from "../../services/admissionService.js";
import { listMedicines, updateMedicine } from "../../services/pharmacyService.js";

const TABS = [
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "services", label: "Service Prices", icon: Stethoscope },
  { key: "beds", label: "Wards & Beds", icon: BedDouble },
  { key: "inventory", label: "Inventory Thresholds", icon: Pill },
];

/** FR60 (proposed): branch-scoped management of departments/services/wards/beds/inventory thresholds. */
export default function AdminBranchConfig({ user }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user?.branchId || "");
  const [tab, setTab] = useState("departments");

  useEffect(() => {
    listBranches({}).then((list) => {
      setBranches(list);
      if (!branchId && list.length) setBranchId(list[0]._id ?? list[0].id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ActiveTab = TABS.find((t) => t.key === tab);

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Branch Configuration
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        FR60 · Branch-scoped departments, service prices, wards/beds, and inventory thresholds
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <label className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>Branch</label>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="f-body" style={{ padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}>
          {branches.map((b) => (
            <option key={b._id ?? b.id} value={b._id ?? b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#EEF1EE", padding: 4, borderRadius: 12, marginBottom: 18, width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="f-body"
            style={{
              padding: "8px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12.5,
              display: "flex", alignItems: "center", gap: 6,
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "var(--ink-deep)" : "var(--muted)",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {!branchId ? (
        <div className="f-body" style={{ color: "var(--muted)" }}>Loading branches…</div>
      ) : tab === "departments" ? (
        <DepartmentsPanel branchId={branchId} />
      ) : tab === "services" ? (
        <ServicesPanel branchId={branchId} />
      ) : tab === "beds" ? (
        <BedsPanel branchId={branchId} />
      ) : (
        <InventoryPanel branchId={branchId} />
      )}
    </div>
  );
}

function DepartmentsPanel({ branchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await listDepartments({ branch_id: branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [branchId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createDepartment(branchId, name.trim());
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(dept) {
    setBusy(true);
    try {
      if (dept.status === "active") await deactivateDepartment(dept.id);
      else await updateDepartment(dept.id, { status: "active" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New department name" className="f-body" style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <Button small variant="dark" type="submit" icon={Plus} disabled={busy}>Add</Button>
      </form>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <LoadingState label="Loading departments…" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((d) => (
            <Card key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <span className="f-body" style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone={d.status === "active" ? "success" : "default"}>{d.status}</Badge>
                <Button small variant={d.status === "active" ? "danger" : "ghost"} icon={Ban} onClick={() => toggle(d)} disabled={busy}>
                  {d.status === "active" ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesPanel({ branchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await listServices({ branch_id: branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [branchId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setBusy(true);
    setError("");
    try {
      await createService(branchId, name.trim(), Number(price));
      setName(""); setPrice("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      await updateService(id, { price: Number(editPrice) });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(svc) {
    setBusy(true);
    try {
      if (svc.status === "active") await deactivateService(svc.id);
      else await updateService(svc.id, { status: "active" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name" className="f-body" style={{ flex: 2, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" placeholder="Price" className="f-body" style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <Button small variant="dark" type="submit" icon={Plus} disabled={busy}>Add</Button>
      </form>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <LoadingState label="Loading services…" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((s) => (
            <Card key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <span className="f-body" style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editingId === s.id ? (
                  <>
                    <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" step="0.01" className="f-body" style={{ width: 90, padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} />
                    <Button small variant="dark" onClick={() => saveEdit(s.id)} disabled={busy}>Save</Button>
                    <Button small variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="f-mono" style={{ fontSize: 13 }}>${Number(s.price).toFixed(2)}</span>
                    <Button small variant="ghost" icon={Pencil} onClick={() => { setEditingId(s.id); setEditPrice(s.price); }}>Edit</Button>
                  </>
                )}
                <Badge tone={s.status === "active" ? "success" : "default"}>{s.status}</Badge>
                <Button small variant={s.status === "active" ? "danger" : "ghost"} icon={Ban} onClick={() => toggle(s)} disabled={busy}>
                  {s.status === "active" ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BedsPanel({ branchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ward, setWard] = useState("");
  const [room, setRoom] = useState("");
  const [bedNum, setBedNum] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await listBeds({ branch_id: branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [branchId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!ward.trim() || !room.trim() || !bedNum.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createBed(branchId, ward.trim(), room.trim(), bedNum.trim());
      setWard(""); setRoom(""); setBedNum("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMaintenance(bed) {
    setBusy(true);
    setError("");
    try {
      await updateBed(bed.id, { status: bed.status === "maintenance" ? "available" : "maintenance" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const toneFor = { available: "success", occupied: "warn", maintenance: "danger" };

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward (e.g. ICU)" className="f-body" style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className="f-body" style={{ width: 90, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <input value={bedNum} onChange={(e) => setBedNum(e.target.value)} placeholder="Bed" className="f-body" style={{ width: 90, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
        <Button small variant="dark" type="submit" icon={Plus} disabled={busy}>Add Bed</Button>
      </form>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <LoadingState label="Loading beds…" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {items.map((b) => (
            <Card key={b.id} style={{ padding: "10px 14px" }}>
              <div className="f-body" style={{ fontSize: 12.5, fontWeight: 700 }}>{b.ward}</div>
              <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Room {b.room}, Bed {b.bed}</div>
              <Badge tone={toneFor[b.status]}>{b.status}</Badge>
              {b.status !== "occupied" && (
                <div style={{ marginTop: 8 }}>
                  <Button small variant="ghost" onClick={() => toggleMaintenance(b)} disabled={busy}>
                    {b.status === "maintenance" ? "Mark Available" : "Mark Maintenance"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryPanel({ branchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editThreshold, setEditThreshold] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await listMedicines({ branch_id: branchId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [branchId]);

  async function saveThreshold(id) {
    setBusy(true);
    setError("");
    try {
      await updateMedicine(id, { threshold: Number(editThreshold) });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <LoadingState label="Loading inventory…" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((m) => (
            <Card key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
              <div>
                <div className="f-body" style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Stock: {m.qty}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editingId === m.id ? (
                  <>
                    <input value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} type="number" className="f-body" style={{ width: 70, padding: 6, borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} />
                    <Button small variant="dark" onClick={() => saveThreshold(m.id)} disabled={busy}>Save</Button>
                    <Button small variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>Reorder threshold: <strong style={{ color: "var(--ink-deep)" }}>{m.min}</strong></span>
                    <Button small variant="ghost" icon={Pencil} onClick={() => { setEditingId(m.id); setEditThreshold(m.min); }}>Edit</Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
