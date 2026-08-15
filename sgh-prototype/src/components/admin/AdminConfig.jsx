import React, { useState } from "react";
import { Settings, Database, Save, Check } from "lucide-react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

export default function AdminConfig({ config, onUpdateConfig, onTriggerBackup }) {
  const [apptDuration, setApptDuration] = useState(config.apptDuration || "30");
  const [logoutTimer, setLogoutTimer] = useState(config.logoutTimer || "10");
  const [reminderHours, setReminderHours] = useState(config.reminderHours || "2");
  const [backupSchedule, setBackupSchedule] = useState(config.backupSchedule || "Daily (02:00 AM)");
  const [saved, setSaved] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(null);

  function handleSave(e) {
    e.preventDefault();
    onUpdateConfig({
      apptDuration,
      logoutTimer,
      reminderHours,
      backupSchedule,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleBackup() {
    setBackingUp(true);
    setBackupSuccess(null);
    setTimeout(() => {
      const filename = `sgh_backup_${new Date().toISOString().split("T")[0]}.sql`;
      onTriggerBackup(filename);
      setBackingUp(false);
      setBackupSuccess(`Database backup successfully exported and stored at: C:\\xampp2\\htdocs\\capsproject\\backup\\${filename}`);
    }, 1500);
  }

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        System Configuration
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        Module 14 · System parameters, operational variables, and data backups
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <div>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Settings size={18} color="var(--ink)" />
              <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>
                System Variables
              </span>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                  Default Appointment Duration
                </label>
                <select
                  value={apptDuration}
                  onChange={(e) => setApptDuration(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                  Inactivity Auto-Logout Timeout (NFR11)
                </label>
                <select
                  value={logoutTimer}
                  onChange={(e) => setLogoutTimer(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                  SMS/Email Pre-Appointment Notification Timer (FR20)
                </label>
                <select
                  value={reminderHours}
                  onChange={(e) => setReminderHours(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="1">1 hour before</option>
                  <option value="2">2 hours before</option>
                  <option value="6">6 hours before</option>
                  <option value="24">24 hours before</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>
                  Automated Database Backup Schedule (NFR17)
                </label>
                <select
                  value={backupSchedule}
                  onChange={(e) => setBackupSchedule(e.target.value)}
                  className="f-body"
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="Hourly">Hourly</option>
                  <option value="Daily (02:00 AM)">Daily (02:00 AM)</option>
                  <option value="Weekly (Sunday)">Weekly (Sunday)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button small variant="dark" type="submit" icon={Save}>
                  Save Settings
                </Button>
                {saved && (
                  <span className="f-body" style={{ fontSize: 12, color: "var(--sage)", display: "flex", alignItems: "center", gap: 3 }}>
                    <Check size={14} /> Variables saved successfully
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Database size={18} color="var(--ink)" />
              <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>
                Backup & Disaster Recovery
              </span>
            </div>

            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14 }}>
              Execute a manual backup of the St. George Hospital centralized database. This preserves all schema structure, patient histories, medical notes, pharmacy stock, and compliance audit logs.
            </div>

            <div style={{ marginBottom: 14 }}>
              <Button
                small
                full
                variant={backingUp ? "ghost" : "primary"}
                onClick={handleBackup}
                icon={Database}
              >
                {backingUp ? "Exporting database..." : "Run Database Backup"}
              </Button>
            </div>

            {backupSuccess && (
              <div
                className="f-body"
                style={{
                  background: "#E7F3EB",
                  color: "var(--ink-deep)",
                  fontSize: 12,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--sage)",
                  lineHeight: 1.4,
                }}
              >
                {backupSuccess}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
