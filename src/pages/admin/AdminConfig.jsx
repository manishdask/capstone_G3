import React, { useEffect, useState } from "react";
import { Settings, Database, Save, Check, Info, ShieldCheck, LockKeyhole, FlaskConical } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import * as mfaService from "../../services/mfaService.js";
import { listBackupJobs, runBackupNow, runRestoreDrill } from "../../services/backupService.js";
import { listSettings, updateSetting } from "../../services/settingService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ApiError } from "../../services/api.js";

const JOB_TONE = { success: "success", failed: "danger", running: "warn" };
const DRILL_TONE = { passed: "success", failed: "danger" };

/** FR57/FR58 (proposed): real backup job history, manual trigger, restore drill. */
function BackupPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [drillingId, setDrillingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setJobs(await listBackupJobs());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load backup history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRunBackup() {
    setRunning(true);
    setError("");
    try {
      await runBackupNow();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Backup run failed.");
    } finally {
      setRunning(false);
    }
  }

  async function handleDrill(jobId) {
    setDrillingId(jobId);
    setError("");
    try {
      await runRestoreDrill(jobId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Restore drill failed.");
    } finally {
      setDrillingId(null);
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Database size={18} color="var(--ink)" />
        <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>Backup & Disaster Recovery</span>
      </div>

      <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14 }}>
        FR57 · Encrypted `mysqldump` capture, verified non-empty, scheduled daily at 02:00 (`php artisan backup:run`). FR58 · Restore drills decrypt and validate a backup without touching the live database.
      </div>

      <div style={{ marginBottom: 14 }}>
        <Button small full variant="primary" onClick={handleRunBackup} disabled={running} icon={Database}>
          {running ? "Running…" : "Run Backup Now"}
        </Button>
      </div>

      {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {loading ? (
        <LoadingState label="Loading backup history…" />
      ) : jobs.length === 0 ? (
        <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 10 }}>No backups yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jobs.map((j) => (
            <div key={j.id} style={{ background: "var(--tint-neutral)", borderRadius: 10, padding: "9px 11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--ink-deep)" }}>
                  {new Date(j.startedAt).toLocaleString("en-AU")}
                </div>
                <Badge tone={JOB_TONE[j.status]}>{j.status}</Badge>
              </div>
              {j.verificationNotes && (
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{j.verificationNotes}</div>
              )}
              {j.status === "success" && (
                <div style={{ marginTop: 6 }}>
                  <Button small variant="ghost" icon={FlaskConical} disabled={drillingId === j.id} onClick={() => handleDrill(j.id)}>
                    {drillingId === j.id ? "Drilling…" : "Run Restore Drill"}
                  </Button>
                </div>
              )}
              {j.restoreDrills.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  {j.restoreDrills.map((d) => (
                    <div key={d.id} className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                      <Badge tone={DRILL_TONE[d.status]}>{d.status}</Badge> {d.verificationNotes}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * System configuration (appointment duration, notification timers, backup
 * schedule) has no backend storage yet — persisting it would mean a new
 * settings module, which is outside FR1-45 scope. This screen stays local
 * (resets on reload) and says so plainly, rather than pretending to save.
 */
function MfaSecurityCard() {
  const { user, refresh, logout } = useAuth();
  const [showDisable, setShowDisable] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleDisable(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await mfaService.disableMfa(password);
      setShowDisable(false);
      setPassword("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not disable MFA right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ShieldCheck size={18} color="var(--ink)" />
        <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>Multi-Factor Authentication (FR50)</span>
      </div>

      <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginBottom: 14 }}>
        MFA is mandatory for Admin and Branch Manager accounts. Your account:{" "}
        <strong style={{ color: user?.mfaEnabled ? "var(--sage)" : "var(--rose)" }}>
          {user?.mfaEnabled ? "Enabled" : "Not enabled"}
        </strong>
      </div>

      {!showDisable ? (
        <Button small variant="ghost" icon={LockKeyhole} onClick={() => setShowDisable(true)}>
          Disable MFA
        </Button>
      ) : (
        <form onSubmit={handleDisable}>
          <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>
            Confirm your password to disable MFA. Since it's mandatory for this role, you'll be sent straight back to the enrolment screen.
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Account password"
            required
            className="f-body"
            style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5, marginBottom: 8 }}
          />
          {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11.5, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Button small variant="danger" type="submit" disabled={busy}>{busy ? "Disabling…" : "Confirm Disable"}</Button>
            <Button small variant="ghost" type="button" onClick={() => { setShowDisable(false); setPassword(""); setError(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

/** FR59 (proposed): admin-editable settings, audited on change by the standard `audit` middleware. */
function SystemSettingsCard() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await listSettings();
      setSettings(list);
      setDrafts(Object.fromEntries(list.map((s) => [s.key, s.value])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key) {
    setSavingKey(key);
    setError("");
    try {
      await updateSetting(key, drafts[key]);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2500);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this setting.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Settings size={18} color="var(--ink)" />
        <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>System Variables (FR59)</span>
      </div>

      <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 4 }}>
        Inactivity auto-logout is fixed at 10 minutes (NFR11, server-enforced) and isn't editable here.
      </div>

      {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 12, margin: "8px 0" }}>{error}</div>}

      {loading ? (
        <LoadingState label="Loading settings…" />
      ) : (
        settings.map((s) => (
          <div key={s.key} style={{ marginBottom: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <label className="f-body" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>{s.label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {s.type === "boolean" ? (
                <select
                  value={drafts[s.key] ?? s.value}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                  className="f-body"
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  type="number"
                  value={drafts[s.key] ?? s.value}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                  className="f-body"
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }}
                />
              )}
              <Button small variant="dark" icon={Save} disabled={savingKey === s.key || drafts[s.key] === s.value} onClick={() => handleSave(s.key)}>
                {savingKey === s.key ? "Saving…" : "Save"}
              </Button>
              {savedKey === s.key && <Check size={16} color="var(--sage)" />}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

export default function AdminConfig() {

  return (
    <div className="rise">
      <div className="f-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        System Configuration
      </div>
      <div className="f-body" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        System parameters, operational variables, and data backups
      </div>
      <div className="f-body" style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--tint-success)", border: "1px solid var(--line-success)", borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: "var(--sage)", marginBottom: 16 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        System variables, backups, and MFA below are real — every change is persisted and audited (FR59, FR57/58, FR50).
      </div>

      <div className="grid-split" style={{ "--split": "1.2fr 1fr" }}>
        <div>
          <SystemSettingsCard />
        </div>

        <div>
          <BackupPanel />
          <MfaSecurityCard />
        </div>
      </div>
    </div>
  );
}
