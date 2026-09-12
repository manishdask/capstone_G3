import React, { useEffect, useRef, useState, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";

/**
 * IdleTimer — NFR11
 * Monitors user activity and triggers auto-logout after the configured
 * inactivity timeout. Shows a 60-second warning modal before logging out.
 *
 * Props:
 *   timeoutMinutes  — number (default 10)
 *   onLogout        — callback fired when timer expires
 */
export default function IdleTimer({ timeoutMinutes = 10, onLogout }) {
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = 60 * 1000; // show warning 60 s before logout

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const idleTimer = useRef(null);
  const warningTimer = useRef(null);
  const countdownInterval = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownInterval.current);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    if (showWarning) return; // don't reset if warning is showing (user must click Stay)
    clearAllTimers();

    // Schedule the warning first
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();

      // Schedule the actual logout after the warning period
      idleTimer.current = setTimeout(() => {
        clearAllTimers();
        setShowWarning(false);
        onLogout();
      }, WARNING_MS);
    }, TIMEOUT_MS - WARNING_MS);
  }, [TIMEOUT_MS, WARNING_MS, showWarning, clearAllTimers, startCountdown, onLogout]);

  // Attach event listeners to track user activity
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer(); // start timer on mount

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      clearAllTimers();
    };
  }, [resetTimer, clearAllTimers]);

  function handleStayLoggedIn() {
    setShowWarning(false);
    clearAllTimers();
    resetTimer();
  }

  function handleLogoutNow() {
    clearAllTimers();
    setShowWarning(false);
    onLogout();
  }

  if (!showWarning) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,36,34,0.80)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-title"
      aria-describedby="idle-desc"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,.3)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--tint-amber)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle size={26} color="var(--amber-deep)" />
        </div>

        <div
          id="idle-title"
          className="f-display"
          style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}
        >
          Session Expiring Soon
        </div>

        <div
          id="idle-desc"
          className="f-body"
          style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, lineHeight: 1.55 }}
        >
          Your session has been inactive. For your security, you will be automatically
          logged out in:
        </div>

        {/* Countdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 22,
          }}
        >
          <Clock size={20} color="var(--rose)" />
          <span
            className="f-mono"
            style={{ fontSize: 30, fontWeight: 700, color: "var(--rose)" }}
          >
            {String(countdown).padStart(2, "0")}s
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleStayLoggedIn}
            className="f-body"
            style={{
              flex: 1,
              padding: "12px 0",
              background: "var(--ink)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
            }}
            autoFocus
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogoutNow}
            className="f-body"
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#fff",
              color: "var(--muted)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>

        <div
          className="f-body"
          style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 14 }}
        >
          NFR11 · Inactivity auto-logout policy · Timeout: {timeoutMinutes} min
        </div>
      </div>
    </div>
  );
}
