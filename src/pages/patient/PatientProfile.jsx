import React, { useEffect, useState } from "react";
import { LogOut, Mail, Building2, ShieldCheck, ShieldOff, FileEdit, Send } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ScreenHeader from "../../components/ui/ScreenHeader.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { listConsents, grantConsent, withdrawConsent } from "../../services/consentService.js";
import { listDataRequests, submitDataRequest } from "../../services/dataRequestService.js";

const ROLE_LABEL = {
  patient: "Patient",
  doctor: "Doctor",
  staff: "Clinic Staff",
  admin: "Administrator",
};

const PURPOSE_LABEL = {
  privacy_notice_and_treatment: "Privacy notice & treatment",
  marketing_communications: "Marketing communications",
};

// Reused as the "Profile" tab for Patient, Doctor and Staff roles.
export default function PatientProfile({ user, onLogout }) {
  if (!user) return null;
  return (
    <div>
      <ScreenHeader title="Profile" />
      <div style={{ padding: "0 18px" }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={user.name} size={48} />
          <div style={{ flex: 1 }}>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>
              {user.name}
            </div>
            <div className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {user.patientId || user.username}
            </div>
          </div>
          <Badge>{ROLE_LABEL[user.role]}</Badge>
        </Card>

        <Card style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <Mail size={14} color="var(--muted)" />
            <span className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px", borderTop: "1px solid var(--line)", marginTop: 6 }}>
            <Building2 size={14} color="var(--muted)" />
            <span className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)" }}>{user.branch || "—"} Branch</span>
          </div>
        </Card>

        {user.role === "patient" && <ConsentSection patientRecordId={user.patientRecordId} />}
        {user.role === "patient" && <DataRequestSection />}
      </div>
      <div style={{ padding: "14px 18px 20px" }}>
        <Button full variant="ghost" icon={LogOut} onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}

/** FR49: view current consent status per purpose and grant/withdraw it. */
function ConsentSection({ patientRecordId }) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyPurpose, setBusyPurpose] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setConsents(await listConsents());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Each purpose's current status is its most recent event (list is already newest-first).
  const latestByPurpose = {};
  for (const c of consents) {
    if (!latestByPurpose[c.purpose]) latestByPurpose[c.purpose] = c;
  }
  const purposes = Object.keys(PURPOSE_LABEL);
  for (const p of purposes) {
    if (!latestByPurpose[p]) latestByPurpose[p] = null;
  }

  async function handleToggle(purpose, current) {
    setBusyPurpose(purpose);
    setError("");
    try {
      if (!current || current.state === "withdrawn") {
        await grantConsent(patientRecordId, purpose);
      } else {
        await withdrawConsent(current.id);
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyPurpose(null);
    }
  }

  return (
    <Card style={{ marginTop: 10 }}>
      <div className="f-display" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <ShieldCheck size={14} /> Privacy & Consent
      </div>
      {error && <div style={{ marginBottom: 8 }}><ErrorState message={error} onRetry={load} /></div>}
      {loading ? (
        <LoadingState label="Loading consent status…" />
      ) : (
        Object.entries(latestByPurpose).map(([purpose, current]) => {
          const granted = current?.state === "granted";
          return (
            <div key={purpose} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <div>
                <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", fontWeight: 600 }}>
                  {PURPOSE_LABEL[purpose] || purpose}
                </div>
                <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                  {current ? `${granted ? "Granted" : "Withdrawn"} · ${new Date(current.changedAt).toLocaleDateString("en-AU")}` : "Not yet granted"}
                </div>
              </div>
              <Button
                small
                variant={granted ? "danger" : "ghost"}
                icon={granted ? ShieldOff : ShieldCheck}
                disabled={busyPurpose === purpose}
                onClick={() => handleToggle(purpose, current)}
              >
                {busyPurpose === purpose ? "Saving…" : granted ? "Withdraw" : "Grant"}
              </Button>
            </div>
          );
        })
      )}
      <div className="f-body" style={{ fontSize: 10, color: "var(--muted)", marginTop: 10 }}>
        Withdrawing consent does not delete the historical record of when it was granted.
      </div>
    </Card>
  );
}

const STATUS_TONE = { pending: "warn", in_review: "warn", approved: "success", rejected: "danger" };
const STATUS_LABEL = { pending: "Pending", in_review: "In review", approved: "Approved", rejected: "Rejected" };

/** FR61: submit and track patient data access/correction requests. */
function DataRequestSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("access");
  const [details, setDetails] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRequests(await listDataRequests());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!details.trim()) { setFormError("Please describe what you're requesting."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await submitDataRequest(type, details.trim());
      setDetails("");
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="f-display" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <FileEdit size={14} /> My Data Requests
        </div>
        {!showForm && (
          <Button small variant="ghost" onClick={() => setShowForm(true)}>New request</Button>
        )}
      </div>

      {error && <div style={{ marginBottom: 8 }}><ErrorState message={error} onRetry={load} /></div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
          <select value={type} onChange={(e) => setType(e.target.value)} className="f-body" style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid var(--line)", fontSize: 12, marginBottom: 8 }}>
            <option value="access">Access — send me a copy of my data</option>
            <option value="correction">Correction — fix incorrect data</option>
          </select>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what you need…"
            className="f-body"
            style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12.5, resize: "none", marginBottom: 8 }}
          />
          {formError && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, marginBottom: 8 }}>{formError}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Button small variant="dark" type="submit" icon={Send} disabled={submitting}>{submitting ? "Sending…" : "Submit"}</Button>
            <Button small variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : requests.length === 0 ? (
        <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "8px 0" }}>
          No requests submitted yet.
        </div>
      ) : (
        requests.map((r) => (
          <div key={r.id} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="f-body" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-deep)", textTransform: "capitalize" }}>{r.type} request</div>
                <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{r.details}</div>
                {r.decisionNotes && (
                  <div className="f-body" style={{ fontSize: 11, color: "var(--ink)", marginTop: 4 }}>Response: {r.decisionNotes}</div>
                )}
              </div>
              <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
