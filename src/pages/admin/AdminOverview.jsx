import React, { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, Building2, Activity, AlertTriangle, UserCheck } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import Card from "../../components/ui/Card.jsx";
import PulseDivider from "../../components/ui/PulseDivider.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listBranches } from "../../services/branchService.js";
import { getSummary, getTrend, getDepartmentComparison } from "../../services/reportService.js";
import { listLowStock } from "../../services/pharmacyService.js";

const DEPT_COLORS = ["#123B36", "#4C9F70", "#F2A73B", "#C1435B", "#9CB3AE", "#0e5c66"];

export default function AdminOverview() {
  const [scopeFilter, setScopeFilter] = useState("All Branches");
  const [branches, setBranches] = useState([]);
  const [trend, setTrend] = useState([]);
  const [deptSplit, setDeptSplit] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [branchList, trendData, dept, sum, lowStock] = await Promise.all([
        listBranches(),
        getTrend({ days: 7 }),
        getDepartmentComparison(),
        getSummary({}),
        listLowStock(),
      ]);

      const withRevenue = await Promise.all(
        branchList.map(async (b) => {
          const s = await getSummary({ branch_id: b.id }).catch(() => ({ revenue: 0 }));
          return { ...b, revenue: s.revenue };
        })
      );

      setBranches(withRevenue);
      setTrend(trendData);
      setDeptSplit(dept.map((d, i) => ({ name: d.specialization, value: d.appointment_count, color: DEPT_COLORS[i % DEPT_COLORS.length] })));
      setSummary(sum);
      setLowStockCount(lowStock.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredBranches = scopeFilter === "All Branches" ? branches : branches.filter((b) => b.name === scopeFilter);
  const totalPatients = filteredBranches.reduce((s, b) => s + b.patients, 0);
  const totalRevenue = filteredBranches.reduce((s, b) => s + (b.revenue || 0), 0);
  const activeBranches = filteredBranches.length;
  const totalStaff = filteredBranches.reduce((s, b) => s + b.staffCount, 0);

  const revenueChart = useMemo(() => trend.map((t) => ({ m: new Date(t.date).toLocaleDateString("en-AU", { weekday: "short" }), v: t.revenue })), [trend]);
  const volumeChart = useMemo(() => trend.map((t) => ({ d: new Date(t.date).toLocaleDateString("en-AU", { weekday: "short" }), v: t.appointments })), [trend]);

  if (loading) return <LoadingState label="Loading operations overview…" />;

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)" }}>
            Operations Overview
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            Real-time hospital metrics
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PulseDivider width={80} height={20} />
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="f-body" style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 12.5, background: "#fff", cursor: "pointer" }} aria-label="Branch scope filter">
            <option>All Branches</option>
            {branches.map((b) => <option key={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Total patients", value: totalPatients.toLocaleString(), icon: Users, sub: "registered" },
          { label: "Revenue (period)", value: `$${(totalRevenue / 1000).toFixed(1)}k`, icon: TrendingUp, sub: "AUD" },
          { label: "Active branches", value: activeBranches, icon: Building2, sub: "operational" },
          { label: "Total staff", value: totalStaff, icon: Activity, sub: "across scope" },
        ].map((k, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.label}</div>
                <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)", marginTop: 4 }}>{k.value}</div>
                <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
              <k.icon size={16} color="var(--amber-deep)" />
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <Card style={{ borderLeft: "3px solid var(--sage)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <UserCheck size={16} color="var(--sage)" />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>New Patients</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--sage)" }}>{summary?.new_patients ?? 0}</div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>last 30 days</div>
        </Card>

        <Card style={{ borderLeft: "3px solid var(--ink)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Activity size={16} color="var(--ink)" />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Confirmed Appointments</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--ink-deep)" }}>
            {summary?.appointments_by_status?.confirmed ?? 0}
          </div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>last 30 days</div>
        </Card>

        <Card style={{ borderLeft: `3px solid ${lowStockCount > 0 ? "var(--rose)" : "var(--sage)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <AlertTriangle size={16} color={lowStockCount > 0 ? "var(--rose)" : "var(--sage)"} />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Low-Stock Alerts</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: lowStockCount > 0 ? "var(--rose)" : "var(--sage)" }}>{lowStockCount}</div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>medicine items</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Revenue trend (7 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueChart}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--ink)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>By department</div>
          {deptSplit.length === 0 ? (
            <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "30px 0" }}>No appointment activity yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deptSplit} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {deptSplit.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {deptSplit.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                    <span className="f-body" style={{ fontSize: 10.5, color: "var(--muted)" }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Weekly appointment volume</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={volumeChart}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="v" fill="var(--amber)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Branch performance monitor</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Branch", "Patients", "Revenue", "Staff", "Bed capacity", "Status"].map((h) => (
                  <th key={h} className="f-body" style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textAlign: "left", paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: i < filteredBranches.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <td className="f-display" style={{ padding: "10px 0", fontSize: 13, fontWeight: 700 }}>{b.name}</td>
                  <td className="f-body" style={{ fontSize: 12.5 }}>{b.patients.toLocaleString()}</td>
                  <td className="f-body" style={{ fontSize: 12.5 }}>${((b.revenue || 0) / 1000).toFixed(1)}k</td>
                  <td className="f-body" style={{ fontSize: 12.5 }}>{b.staffCount}</td>
                  <td className="f-body" style={{ fontSize: 12.5 }}>{b.beds}</td>
                  <td>
                    <span className="f-body" style={{ fontSize: 11, background: "#E7F3EB", color: "var(--sage)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
