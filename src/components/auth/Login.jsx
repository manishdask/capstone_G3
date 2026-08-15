import React, { useState } from "react";
import { ShieldCheck, Building2, Users, ChevronRight, GraduationCap, ChevronDown, CheckCircle2, Lock, HelpCircle, X, Key, FileText } from "lucide-react";
import PulseDivider from "../ui/PulseDivider.jsx";
import { generatePatientId, generateUserId } from "../../data/accounts.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { role: "patient", name: "Ravi Shah", email: "ravi.shah@patient.stgeorge.health", password: "Patient123!", desc: "Patient Panel (Mobile Mockup)" },
  { role: "doctor", name: "Dr. Amelia Chen", email: "a.chen@stgeorge.health", password: "Doctor123!", desc: "Doctor Panel (Mobile Mockup)" },
  { role: "staff", name: "Nadia Farouk", email: "n.farouk@stgeorge.health", password: "Staff123!", desc: "Hospital/Clinic Staff (Mobile Mockup)" },
  { role: "admin", name: "Administrator", email: "admin@stgeorge.health", password: "Admin123!", desc: "System Admin Panel (Web Dashboard)" },
];

export default function Login({ accounts, onLogin, onRegister }) {
  const [tab, setTab] = useState("login");
  const [activeAccordion, setActiveAccordion] = useState(false);

  // ---- Modals ----
  const [showForgot, setShowForgot] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // ---- Login state ----
  const [loginEmail, setLoginEmail] = useState("ravi.shah@patient.stgeorge.health");
  const [loginPassword, setLoginPassword] = useState("Patient123!");
  const [loginError, setLoginError] = useState("");

  // ---- Register state ----
  const [reg, setReg] = useState({ name: "", email: "", password: "", confirm: "", dob: "", gender: "", contact: "" });
  const [regErrors, setRegErrors] = useState({});

  function setField(key, value) {
    setReg((r) => ({ ...r, [key]: value }));
  }

  function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const match = accounts.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase() && a.password === loginPassword
    );
    if (!match) {
      setLoginError("Email or password is incorrect.");
      return;
    }
    onLogin(match);
  }

  function fillRole(acc) {
    setTab("login");
    setLoginEmail(acc.email);
    setLoginPassword(acc.password);
    setLoginError("");
  }

  function handleRegister(e) {
    e.preventDefault();
    const errs = {};
    if (!reg.name.trim()) errs.name = "Full name is required.";
    if (!EMAIL_RE.test(reg.email.trim())) errs.email = "Enter a valid email address.";
    else if (accounts.some((a) => a.email.toLowerCase() === reg.email.trim().toLowerCase()))
      errs.email = "An account with this email already exists.";
    if (reg.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (reg.confirm !== reg.password) errs.confirm = "Passwords do not match.";
    if (!reg.dob) errs.dob = "Date of birth is required.";
    if (!reg.gender) errs.gender = "Please select a gender.";
    if (!reg.contact.trim()) errs.contact = "Contact number is required.";

    setRegErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newAccount = {
      id: generateUserId(),
      name: reg.name.trim(),
      email: reg.email.trim(),
      password: reg.password,
      role: "patient",
      patientId: generatePatientId(),
      branch: "Kogarah",
      dob: reg.dob,
      gender: reg.gender,
      contact: reg.contact.trim(),
    };
    onRegister(newAccount);
  }

  function handleForgot(e) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap" }}>
      <style>{`
        @media (max-width: 1050px) {
          .sgh-hero-pane { display: none !important; }
          .sgh-form-pane { width: 100% !important; }
        }
        .sgh-input {
          width: 100%; padding: 10px 12px; border: 1px solid var(--line);
          border-radius: 10px; font-size: 13px; font-family: 'Inter', sans-serif;
          background: #fff;
        }
        .sgh-input:focus { outline: 2px solid var(--ink); outline-offset: 1px; }
        .sgh-err { color: var(--rose); font-size: 11.5px; margin-top: 4px; font-family: 'Inter', sans-serif; }
        .sgh-field { margin-bottom: 12px; }
        .sgh-label { font-size: 12px; color: var(--muted); font-family: 'Inter', sans-serif; display: block; margin-bottom: 5px; }
        
        .role-card {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }
        .role-card:hover {
          border-color: var(--ink);
          background: #f8faf9;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Left Brand Pane (renders on the RIGHT via CSS order, matching the approved design) */}
      <div
        className="sgh-hero-pane"
        style={{
          flex: "1.2 1 500px",
          order: 2,
          background: "linear-gradient(135deg, var(--ink-deep) 0%, #0e5c66 100%)",
          color: "#fff",
          padding: "50px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Faint decorative circles, matching the approved design */}
        <div style={{ position: "absolute", bottom: "-12%", right: "-8%", width: 420, height: 420, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)" }} />
        <div style={{ position: "absolute", bottom: "-2%", right: "6%", width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)" }} />

        <div style={{ maxWidth: 480 }}>
          <span
            className="f-body"
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: "rgba(255,255,255,.12)",
              borderRadius: 999,
              padding: "6px 14px",
              marginBottom: 22,
            }}
          >
            One connected care team
          </span>

          <div className="f-display" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.15 }}>
            Clear information.<br />Safer care.
          </div>

          <div className="f-body" style={{ fontSize: 14, color: "#CFE0DC", marginTop: 16, lineHeight: 1.6 }}>
            Patients, appointments, clinical operations and accounts in one secure workspace.
          </div>

          <div className="f-body" style={{ fontSize: 11, color: "#8FA39E", marginTop: 30 }}>
            Capstone Project · CPRO306 (Group G3)
          </div>
        </div>

        {/* Floating status cards */}
        <div style={{ position: "absolute", bottom: 130, right: 40, background: "rgba(255,255,255,.12)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "12px 18px", border: "1px solid rgba(255,255,255,.14)" }}>
          <div className="f-body" style={{ fontSize: 10.5, color: "#B9C7C3" }}>Today's care</div>
          <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>On schedule</div>
        </div>
        <div style={{ position: "absolute", bottom: 60, right: 90, background: "rgba(255,255,255,.12)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "12px 18px", border: "1px solid rgba(255,255,255,.14)" }}>
          <div className="f-body" style={{ fontSize: 10.5, color: "#B9C7C3" }}>Security</div>
          <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Audit active</div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div
        className="sgh-form-pane"
        style={{
          flex: "1 1 450px",
          order: 1,
          background: "var(--mist)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 390 }}>
          {/* Brand lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={16} color="#fff" />
            </div>
            <div>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 14, color: "var(--ink-deep)" }}>St George</div>
              <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)" }}>Hospital Management System</div>
            </div>
          </div>

          {/* Form Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#EEF1EE", padding: 4, borderRadius: 12, marginBottom: 20 }}>
            {[
              ["login", "Sign In"],
              ["register", "Self-Registration (Patient)"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="f-body"
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12.5,
                  background: tab === k ? "#fff" : "transparent",
                  color: tab === k ? "var(--ink-deep)" : "var(--muted)",
                  boxShadow: tab === k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "login" && (
            <form onSubmit={handleLogin}>
              <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4 }}>
                Account Sign In
              </div>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 18 }}>
                Secure login to the centralized headquarters server.
              </div>

              <div className="sgh-field">
                <label className="sgh-label">User Email</label>
                <input className="sgh-input" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required aria-label="Email address" />
              </div>
              <div className="sgh-field">
                <label className="sgh-label">Account Password</label>
                <input className="sgh-input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required aria-label="Password" />
              </div>
              {loginError && <div className="sgh-err" role="alert" style={{ marginBottom: 10 }}>{loginError}</div>}

              <button
                type="submit"
                className="f-body"
                style={{
                  width: "100%", background: "var(--ink)", color: "#fff", border: "none",
                  padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4,
                  boxShadow: "0 4px 10px rgba(18,59,54,.25)",
                }}
              >
                Sign In securely
              </button>

              {/* Auxiliary Links */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                <button type="button" onClick={() => setShowForgot(true)} className="f-body"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Key size={12} /> Forgot Password?
                </button>
                <button type="button" onClick={() => setShowPrivacy(true)} className="f-body"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <FileText size={12} /> Privacy Notice
                </button>
                <button type="button" onClick={() => setShowHelp(true)} className="f-body"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <HelpCircle size={12} /> Help
                </button>
              </div>

              {/* Demo Accounts Accordion */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(!activeAccordion)}
                  className="f-body"
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 0", color: "var(--ink)", fontWeight: 700, fontSize: 13
                  }}
                >
                  <span>Role-Based Access Quick Login</span>
                  <ChevronDown size={16} style={{ transform: activeAccordion ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </button>
                
                {activeAccordion && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>
                      Select a role to populate credentials instantly:
                    </div>
                    {DEMO_ACCOUNTS.map((acc) => (
                      <div key={acc.role} className="role-card" onClick={() => fillRole(acc)}>
                        <div>
                          <div className="f-display" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-deep)" }}>
                            {acc.name} ({acc.role.toUpperCase()})
                          </div>
                          <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>
                            {acc.desc}
                          </div>
                        </div>
                        <ChevronRight size={14} color="var(--muted)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister}>
              <div className="f-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4 }}>
                Patient Registration
              </div>
              <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>
                By registering, you agree to our{" "}
                <button type="button" onClick={() => setShowPrivacy(true)}
                  style={{ background: "none", border: "none", color: "var(--ink)", textDecoration: "underline", cursor: "pointer", fontSize: 11.5 }}>
                  Privacy Notice & Consent
                </button>.
              </div>
              <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 18 }}>
                FR1 · Registers patient details and generates a global ID.
              </div>

              <div className="sgh-field">
                <label className="sgh-label">Full Name</label>
                <input className="sgh-input" value={reg.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Ravi Shah" />
                {regErrors.name && <div className="sgh-err">{regErrors.name}</div>}
              </div>
              <div className="sgh-field">
                <label className="sgh-label">Email Address</label>
                <input className="sgh-input" type="email" value={reg.email} onChange={(e) => setField("email", e.target.value)} placeholder="e.g. ravi@mail.com" />
                {regErrors.email && <div className="sgh-err">{regErrors.email}</div>}
              </div>
              
              <div style={{ display: "flex", gap: 10 }}>
                <div className="sgh-field" style={{ flex: 1 }}>
                  <label className="sgh-label">Date of Birth</label>
                  <input className="sgh-input" type="date" value={reg.dob} onChange={(e) => setField("dob", e.target.value)} />
                  {regErrors.dob && <div className="sgh-err">{regErrors.dob}</div>}
                </div>
                <div className="sgh-field" style={{ flex: 1 }}>
                  <label className="sgh-label">Biological Gender</label>
                  <select className="sgh-input" value={reg.gender} onChange={(e) => setField("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                  {regErrors.gender && <div className="sgh-err">{regErrors.gender}</div>}
                </div>
              </div>
              
              <div className="sgh-field">
                <label className="sgh-label">Contact Phone Number</label>
                <input className="sgh-input" value={reg.contact} onChange={(e) => setField("contact", e.target.value)} placeholder="e.g. +61 400 123 456" />
                {regErrors.contact && <div className="sgh-err">{regErrors.contact}</div>}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div className="sgh-field" style={{ flex: 1 }}>
                  <label className="sgh-label">Password</label>
                  <input className="sgh-input" type="password" value={reg.password} onChange={(e) => setField("password", e.target.value)} />
                  {regErrors.password && <div className="sgh-err">{regErrors.password}</div>}
                </div>
                <div className="sgh-field" style={{ flex: 1 }}>
                  <label className="sgh-label">Confirm Password</label>
                  <input className="sgh-input" type="password" value={reg.confirm} onChange={(e) => setField("confirm", e.target.value)} />
                  {regErrors.confirm && <div className="sgh-err">{regErrors.confirm}</div>}
                </div>
              </div>

              <button
                type="submit"
                className="f-body"
                style={{
                  width: "100%", background: "var(--ink)", color: "#fff", border: "none",
                  padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 6,
                  boxShadow: "0 4px 10px rgba(18,59,54,.25)",
                }}
              >
                Complete Registration
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ---- FORGOT PASSWORD MODAL ---- */}
      {showForgot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,36,34,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true" aria-label="Forgot password">
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", maxWidth: 360, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <Key size={16} color="var(--ink)" /> Password Reset
              </div>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <CheckCircle2 size={36} color="var(--sage)" style={{ margin: "0 auto 10px" }} />
                <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-deep)" }}>Reset link sent</div>
                <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent. Check your inbox.
                </div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
                  This is a prototype — no actual email is sent.
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
                  Enter your registered email address and we will send you a secure reset link.
                </div>
                <div className="sgh-field">
                  <label className="sgh-label">Registered Email Address</label>
                  <input className="sgh-input" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="e.g. ravi@mail.com" required />
                </div>
                <button type="submit" className="f-body"
                  style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginTop: 4 }}>
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---- PRIVACY NOTICE MODAL ---- */}
      {showPrivacy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,36,34,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true" aria-label="Privacy Notice">
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={16} color="var(--ink)" /> Privacy Notice & Consent
              </div>
              <button onClick={() => setShowPrivacy(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>
            </div>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--ink-deep)", lineHeight: 1.65 }}>
              <strong>St. George Hospital Group — Patient Data Privacy Statement</strong>
              <p style={{ marginTop: 10 }}>This system collects and processes your personal health information in accordance with the <em>Australian Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).</p>
              <strong style={{ display: "block", marginTop: 10 }}>Data Collected</strong>
              <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                <li>Full name, date of birth, contact details, and gender</li>
                <li>Appointment history and medical consultation notes</li>
                <li>Laboratory test results and prescriptions</li>
                <li>Billing and payment transaction records</li>
              </ul>
              <strong style={{ display: "block", marginTop: 10 }}>How Data Is Used</strong>
              <p style={{ marginTop: 6 }}>Your data is used exclusively for: delivering healthcare services, maintaining medical records, processing billing, and internal system analytics. Data is NOT shared with third parties without your explicit consent, except where required by law.</p>
              <strong style={{ display: "block", marginTop: 10 }}>Data Security</strong>
              <p style={{ marginTop: 6 }}>All records are encrypted at rest (AES-256) and in transit (TLS 1.3). Access is governed by Role-Based Access Control (RBAC) and all activity is logged in a compliance audit trail (NFR12).</p>
              <strong style={{ display: "block", marginTop: 10 }}>Your Rights</strong>
              <p style={{ marginTop: 6 }}>You have the right to access, correct, or request deletion of your personal data. Contact the Privacy Officer at <em>privacy@stgeorge.health</em>.</p>
              <div style={{ marginTop: 14, padding: 10, background: "#EEF1EE", borderRadius: 8, fontSize: 11.5, color: "var(--muted)" }}>
                Prototype notice: This is an academic capstone prototype (CPRO306, Group G3). No real personal data is stored or transmitted.
              </div>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="f-body"
              style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 18 }}>
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      {/* ---- HELP MODAL ---- */}
      {showHelp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,36,34,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true" aria-label="Help">
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", maxWidth: 400, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
                <HelpCircle size={16} color="var(--ink)" /> Help & Support
              </div>
              <button onClick={() => setShowHelp(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>
            </div>
            {[
              { q: "How do I register as a new patient?", a: "Click the 'Self-Registration (Patient)' tab and complete the registration form. A unique Patient ID will be generated for you instantly." },
              { q: "I forgot my password — what do I do?", a: "Click 'Forgot Password?' below the sign-in button. Enter your registered email and a reset link will be sent to you." },
              { q: "Who can access the system?", a: "The system supports: Patients (self-registration), Doctors, Nurses, Lab Technicians, Pharmacists, Receptionists, Branch Managers, and Administrators. Staff accounts are provisioned by an administrator." },
              { q: "Is my health data secure?", a: "Yes. All data is encrypted (AES-256 at rest, TLS in transit). Activity is logged in a compliance audit trail per the Australian Privacy Act 1988." },
              { q: "Technical support contact?", a: "Email it-support@stgeorge.health or call the IT Helpdesk: 1800-SGH-HELP (Mon–Fri, 8am–6pm AEST)." },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}>
                <div className="f-display" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 4 }}>{item.q}</div>
                <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{item.a}</div>
              </div>
            ))}
            <button onClick={() => setShowHelp(false)} className="f-body"
              style={{ width: "100%", background: "#EEF1EE", color: "var(--ink-deep)", border: "none", padding: "10px 0", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 8 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}