import React, { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listBranches } from "../../services/branchService.js";
import { getDepartmentComparison, exportCsv, exportPdf } from "../../services/reportService.js";

export default function AdminReports() {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [b, dept] = await Promise.all([listBranches(), getDepartmentComparison()]);
      setBranches(b);
      setDepartments(dept.map((d) => ({ name: d.specialization, appointments: d.appointment_count })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExport(kind) {
    setExporting(kind);
    setError("");
    try {
      if (kind === "csv") await exportCsv({});
      else await exportPdf({});
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting("");
    }
  }

  if (loading) return <LoadingState label="Loading reports…" />;

  return (
    <div className="rise">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 700 }}>Reports & analytics</div>
          <div className="f-body" style={{ fontSize: 13, color: "var(--muted)" }}>FR41–44 · Exportable dashboards</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button small variant="ghost" icon={FileSpreadsheet} disabled={exporting === "csv"} onClick={() => handleExport("csv")}>
            {exporting === "csv" ? "Exporting…" : "Export CSV"}
          </Button>
          <Button small variant="ghost" icon={Download} disabled={exporting === "pdf"} onClick={() => handleExport("pdf")}>
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <Card style={{ marginBottom: 14 }}>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Appointments by department (FR44)</div>
        {departments.length === 0 ? (
          <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>No appointment activity recorded yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departments}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="appointments" fill="var(--ink)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Patient volume by branch (FR9)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={branches}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="patients" fill="var(--amber)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
