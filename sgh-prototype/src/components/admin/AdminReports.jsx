import React from "react";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { BRANCHES } from "../../data/mockData.js";

export default function AdminReports() {
  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>
            Reports & analytics
          </div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>
            FR41–44 · Exportable dashboards
          </div>
        </div>
        <Button small variant="ghost" icon={Download}>
          Export PDF/Excel
        </Button>
      </div>
      <Card style={{ marginBottom: 14, background: "#EEF1EE", border: "none" }}>
        <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>
          <strong>AI report insight (FR48):</strong> Patient visits increased by 12% compared to last month, driven
          mainly by Cardiology and Paediatrics bookings at Kogarah.
        </div>
      </Card>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={BRANCHES}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="patients" fill="var(--ink)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
