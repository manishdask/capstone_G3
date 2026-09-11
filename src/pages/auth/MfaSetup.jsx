import React, { useEffect, useState } from "react";
import { ShieldCheck, Loader2, Copy, Check, LogOut } from "lucide-react";
import * as mfaService from "../../services/mfaService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ApiError } from "../../services/api.js";

/**
 * FR50: forced enrolment screen. Admin/Branch Manager accounts land here
 * (see App.jsx gating on user.requiresMfa && !user.mfaEnabled) and cannot
 * reach any other screen until they finish — the real enforcement is
 * RequireMfaSetup on the backend; this is just the matching UX.
 */
export default function MfaSetup() {
  const { refresh, logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [enabling, setEnabling] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [copied, setCopied] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mfaService.setupMfa()
      .then((data) => {
        if (cancelled) return;
        setSecret(data.secret);
        setOtpauthUrl(data.otpauth_url);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not start MFA setup.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleEnable(e) {
    e.preventDefault();
    setError("");
    setEnabling(true);
    try {
      const codes = await mfaService.enableMfa(code.trim());
      setRecoveryCodes(codes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code did not work. Please try again.");
    } finally {
      setEnabling(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — codes are still visible on screen to copy manually.
    }
  }

  async function handleDone() {
    setFinishing(true);
    try {
      await refresh();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mist)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 18, padding: "32px 28px", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck size={16} color="#fff" />
          </div>
          <div>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-deep)" }}>Set Up Multi-Factor Authentication</div>
            <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)" }}>Required for {user?.roleNames?.join("/") || "your role"} — FR50</div>
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>
            <Loader2 size={16} className="spin" /> Generating your secret key…
          </div>
        )}

        {!loading && !recoveryCodes && (
          <form onSubmit={handleEnable}>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
              1. Open an authenticator app (Google Authenticator, Authy, etc.) and add a new account using this key:
            </div>
            <div className="f-body" style={{ background: "var(--tint-neutral)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 15, fontWeight: 700, letterSpacing: 1.5, color: "var(--ink-deep)", textAlign: "center", marginBottom: 16, wordBreak: "break-all" }}>
              {secret}
            </div>

            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
              2. Enter the 6-digit code the app generates to confirm setup:
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 123456"
                autoFocus
                autoComplete="one-time-code"
                required
                className="f-body"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, textAlign: "center", letterSpacing: 2 }}
              />
            </div>
            {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button
              type="submit"
              disabled={enabling || !code.trim()}
              className="f-body"
              style={{
                width: "100%", background: "var(--ink)", color: "#fff", border: "none",
                padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {enabling && <Loader2 size={15} className="spin" />}
              {enabling ? "Verifying…" : "Confirm & Enable MFA"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="f-body"
              style={{ width: "100%", background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              <LogOut size={12} /> Sign out instead
            </button>
          </form>
        )}

        {recoveryCodes && (
          <div>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
              MFA is now active. Save these one-time recovery codes somewhere safe — each can be used once to sign in if you lose access to your authenticator app.
            </div>
            <div style={{ background: "var(--tint-neutral)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {recoveryCodes.map((c) => (
                <div key={c} className="f-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-deep)", fontFamily: "monospace" }}>{c}</div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="f-body"
              style={{ width: "100%", background: "var(--tint-neutral)", color: "var(--ink-deep)", border: "1px solid var(--line)", padding: "10px 0", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy all codes"}
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={finishing}
              className="f-body"
              style={{
                width: "100%", background: "var(--ink)", color: "#fff", border: "none",
                padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {finishing && <Loader2 size={15} className="spin" />}
              {finishing ? "Continuing…" : "I've saved these — Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
