import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService.js";

/**
 * FR20: the in-app notification surface.
 *
 * Every notification the app raises (booking confirmed, invoice ready, lab
 * request approved, result released) now lands here as well as going out by
 * email/SMS — so a message is visible even when an external channel is not
 * configured or fails. The list is whatever /api/notifications returns, which
 * the backend has already scoped to the signed-in user.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: rows, unread: count } = await listNotifications();
      setItems(rows);
      setUnread(count);
    } catch {
      // A notification panel must never take the screen down with it.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll rather than hold a socket open: the backend is a plain REST API and
    // a minute-old badge is good enough for this.
    const handle = setInterval(load, 60000);
    return () => clearInterval(handle);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }

  async function handleRead(id) {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      load();
    }
  }

  async function handleReadAll() {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        style={{
          position: "relative", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", padding: 6, color: "var(--ink-deep)",
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="f-mono"
            style={{
              position: "absolute", top: 0, right: 0, minWidth: 16, height: 16,
              borderRadius: 999, background: "var(--rose)", color: "#fff",
              fontSize: 9.5, fontWeight: 700, display: "flex",
              alignItems: "center", justifyContent: "center", padding: "0 4px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, width: "min(300px, 78vw)",
            maxHeight: 340, overflowY: "auto", background: "var(--surface, #fff)",
            border: "1px solid var(--line)", borderRadius: 12, zIndex: 60,
            boxShadow: "0 16px 40px -12px rgba(11,36,34,.28)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
            <span className="f-display" style={{ fontSize: 12.5, fontWeight: 700 }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleReadAll}
                className="f-body"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--muted)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && items.length === 0 ? (
            <div className="f-body" style={{ padding: 16, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="f-body" style={{ padding: 16, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              Nothing yet.
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "10px 12px", borderBottom: "1px solid var(--line)",
                  background: n.read ? "transparent" : "var(--tint-neutral, #f6f8f8)",
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)", lineHeight: 1.45 }}>
                    {n.message}
                  </div>
                  <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>
                    {n.date} · {n.time}
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleRead(n.id)}
                    aria-label="Mark read"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
