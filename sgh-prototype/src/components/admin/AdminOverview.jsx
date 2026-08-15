import React, { useState } from "react";
import { Users, TrendingUp, Building2, Activity, Bed, AlertTriangle, UserCheck } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import Card from "../ui/Card.jsx";
import PulseDivider from "../ui/PulseDivider.jsx";
import { REVENUE_TREND, VOLUME_TREND, DEPT_SPLIT } from "../../data/mockData.js";

export default function AdminOverview({ branches = [], admissions = [], pharmacyStock = [], appointments = [] }) {
  const [scopeFilter, setScopeFilter] = useState("All Branches");

  // Dynamic metrics
  const filteredBranches = scopeFilter === "All Branches"
    ? branches
    : branches.filter(b => b.name === scopeFilter);

  const totalPatients = filteredBranches.reduce((s, b) => s + b.patients, 0);
  const totalRevenue = filteredBranches.reduce((s, b) => s + b.revenue, 0);
  const activeBranches = filteredBranches.length;
  const avgOccupancy = filteredBranches.length
    ? Math.round(filteredBranches.reduce((s, b) => s + b.occupancy, 0) / filteredBranches.length)
    : 0;

  // Compute today's patient count (appointments with "Today" date)
  const today = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  const patientsToday = appointments.filter(a =>
    a.status === "Confirmed" && (a.date === "Today" || a.date === today)
  ).length;

  // Compute free beds (total beds - admitted patients)
  const totalBeds = filteredBranches.reduce((s, b) => s + (b.beds || 0), 0);
  const activeAdmissions = admissions.filter(a => a.status === "Admitted").length;
  const freeBeds = Math.max(0, totalBeds - activeAdmissions);

  // Low stock alerts
  const lowStockCount = pharmacyStock.filter(m => m.status === "Low" || m.status === "Critical").length;

  return (
    <div className="rise">
      {/* Header with scope filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)" }}>
            Operations Overview
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            Real-time hospital metrics · last updated just now
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PulseDivider width={80} height={20} />
          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="f-body"
            style={{
              padding: "7px 10px", borderRadius: 10, border: "1px solid var(--line)",
              fontSize: 12.5, background: "#fff", cursor: "pointer"
            }}
            aria-label="Branch scope filter"
          >
            <option>All Branches</option>
            {branches.map(b => <option key={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Key Metrics — 4-column grid with dynamic real data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Total patients", value: totalPatients.toLocaleString(), icon: Users, sub: "registered" },
          { label: "Monthly revenue", value: `$${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, sub: "AUD MTD" },
          { label: "Active branches", value: activeBranches, icon: Building2, sub: "operational" },
          { label: "Avg. occupancy", value: `${avgOccupancy}%`, icon: Activity, sub: "bed utilisation" },
        ].map((k, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.label}</div>
                <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)", marginTop: 4 }}>
                  {k.value}
                </div>
                <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
              <k.icon size={16} color="var(--amber-deep)" />
            </div>
          </Card>
        ))}
      </div>

      {/* Live Operations Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <Card style={{ borderLeft: "3px solid var(--sage)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <UserCheck size={16} color="var(--sage)" />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Patients Today</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--sage)" }}>
            {patientsToday}
          </div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>confirmed today</div>
        </Card>

        <Card style={{ borderLeft: `3px solid ${freeBeds < 10 ? "var(--rose)" : "var(--ink)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Bed size={16} color={freeBeds < 10 ? "var(--rose)" : "var(--ink)"} />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Free Beds</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: freeBeds < 10 ? "var(--rose)" : "var(--ink-deep)" }}>
            {freeBeds}
          </div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>of {totalBeds} total beds</div>
        </Card>

        <Card style={{ borderLeft: `3px solid ${lowStockCount > 0 ? "var(--rose)" : "var(--sage)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <AlertTriangle size={16} color={lowStockCount > 0 ? "var(--rose)" : "var(--sage)"} />
            <span className="f-body" style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Low-Stock Alerts</span>
          </div>
          <div className="f-display" style={{ fontSize: 26, fontWeight: 700, color: lowStockCount > 0 ? "var(--rose)" : "var(--sage)" }}>
            {lowStockCount}
          </div>
          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>medicine items</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Revenue trend ($k)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_TREND}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--ink)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            By department
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={DEPT_SPLIT} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {DEPT_SPLIT.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {DEPT_SPLIT.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                <span className="f-body" style={{ fontSize: 10.5, color: "var(--muted)" }}>{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          Weekly appointment volume
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={VOLUME_TREND}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="v" fill="var(--amber)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Branch Performance Table */}
      <Card style={{ marginTop: 14 }}>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Branch performance monitor
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Branch", "Patients", "Revenue", "Beds", "Occupancy", "Status"].map(h => (
                <th key={h} className="f-body" style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textAlign: "left", paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((b, i) => (
              <tr key={b.id} style={{ borderBottom: i < filteredBranches.length - 1 ? "1px solid var(--line)" : "none" }}>
                <td className="f-display" style={{ padding: "10px 0", fontSize: 13, fontWeight: 700 }}>{b.name}</td>
                <td className="f-body" style={{ fontSize: 12.5 }}>{b.patients.toLocaleString()}</td>
                <td className="f-body" style={{ fontSize: 12.5 }}>${(b.revenue / 1000).toFixed(0)}k</td>
                <td className="f-body" style={{ fontSize: 12.5 }}>{b.beds}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--line)", borderRadius: 3 }}>
                      <div style={{ width: `${b.occupancy}%`, height: "100%", background: b.occupancy > 85 ? "var(--rose)" : "var(--sage)", borderRadius: 3 }} />
                    </div>
                    <span className="f-mono" style={{ fontSize: 11 }}>{b.occupancy}%</span>
                  </div>
                </td>
                <td>
                  <span className="f-body" style={{ fontSize: 11, background: "#E7F3EB", color: "var(--sage)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
