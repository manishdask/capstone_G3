import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Phone } from "lucide-react";
import { sendChatMessage } from "../../services/chatbotService.js";
import { ApiError } from "../../services/api.js";

// ---- Instant local guards ----
// Mirrors the backend AiService privacy gate, but purely for instant UX: clinical
// and emergency messages escalate to a human without a network round-trip. The
// backend gate remains authoritative (it also prevents any external AI call).
function isEmergency(msg) {
  return /emergen|ambulan|urgent|000/.test(msg.toLowerCase());
}

function isClinical(msg) {
  return /diagnos|symptom|pain|treat|medic|drug|dos|prescri|disease|condition|sick|ill|hurt|bleed|fever|infection|allerg/.test(msg.toLowerCase());
}

// ---- Render message text with simple **bold** markdown ----
function MsgText({ text }) {
  const parts = text.split("**");
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part.split("\n").map((line, j) => (
          <React.Fragment key={j}>{line}{j < part.split("\n").length - 1 && <br />}</React.Fragment>
        ))
      )}
    </span>
  );
}

function botMessage(text, extra = {}) {
  return { id: Date.now() + Math.floor(Math.random() * 1000), from: "bot", text, ...extra };
}

function systemMessage(text) {
  return { id: Date.now() + Math.floor(Math.random() * 1000), from: "system", text };
}

export default function ChatbotWidget({ userName }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: `Hi ${userName ? userName.split(" ")[0] : "there"}! 👋 I'm the SGH virtual assistant. How can I help you today?`, escalated: false }
  ]);
  const [escalated, setEscalated] = useState(false);
  const [typing, setTyping] = useState(false);
  const [provenance, setProvenance] = useState(null); // { provider, model } from the last success
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  function completeEscalation(text) {
    setEscalated(true);
    // Human handoff after a brief delay, matching the previous simulated flow.
    setTimeout(() => {
      setMessages(prev => [...prev, systemMessage(
        "🧑‍⚕️ You are now connected to a St. George receptionist. Average wait time: 2–4 minutes. Ref: " + `TKT-${Math.floor(10000 + Math.random() * 89999)}`
      )]);
    }, 1800);
  }

  async function sendMessage(text) {
    if (!text.trim() || escalated) return;
    const userMsg = { id: Date.now(), from: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    let reply;
    try {
      // Instant local guards — no network round-trip for clinical/emergency.
      if (isEmergency(text)) {
        reply = {
          text: "🚨 **Emergency?** Please call **000** immediately for ambulance, police, or fire. For urgent but non-emergency medical help, visit the nearest SGH emergency department or call your branch directly.",
          escalate: true,
        };
      } else if (isClinical(text)) {
        reply = {
          text: "I understand you have a health concern. For clinical questions, please consult your doctor directly — I'm not able to provide medical advice.\n\nConnecting you to a human receptionist...",
          escalate: true,
        };
      } else {
        const data = await sendChatMessage(text);
        reply = { text: data.text, escalate: data.escalate };
        if (data.provider || data.model) setProvenance({ provider: data.provider, model: data.model });
      }
    } catch (err) {
      // The free AI model is slow (can take up to ~60s); a timeout here is a
      // "still thinking", not a hard failure — tell the user so they don't
      // think the assistant is broken.
      const isTimeout = err instanceof ApiError && err.status === 0 && /timed out/i.test(err.message || "");
      reply = {
        text: isTimeout
          ? "The assistant is still thinking — that question can take up to a minute. Please tap send again in a moment."
          : err instanceof ApiError
            ? "I'm having trouble reaching the assistant right now — please ask our reception staff for help."
            : "Something went wrong on my side. Please try again in a moment.",
        escalate: false,
      };
    } finally {
      setTyping(false);
    }

    setMessages(prev => [...prev, botMessage(reply.text, { escalated: reply.escalate })]);
    if (reply.escalate) completeEscalation(reply.text);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ position: "absolute", bottom: 78, right: 14, zIndex: 40 }}>
      {/* Chat Drawer */}
      {open && (
        <div
          style={{
            width: 310,
            maxHeight: 420,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(11,36,34,.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginBottom: 10,
            border: "1px solid var(--line)",
          }}
        >
          {/* Header */}
          <div style={{ background: "var(--ink)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={16} color="var(--ink-deep)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="f-display" style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>SGH Assistant</div>
              <div className="f-body" style={{ color: "var(--on-dark-muted)", fontSize: 10.5 }}>
                {escalated
                  ? "🟡 Transferring to receptionist..."
                  : provenance
                    ? `🟢 AI online · ${provenance.model}`
                    : "🟢 Online — typically replies instantly"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-dark-muted)" }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", flexDirection: msg.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 6 }}>
                {msg.from !== "user" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: msg.from === "system" ? "var(--tint-success)" : "var(--tint-neutral)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {msg.from === "system" ? <Phone size={12} color="var(--sage)" /> : <Bot size={12} color="var(--ink)" />}
                  </div>
                )}
                <div style={{
                  maxWidth: "76%",
                  padding: "8px 12px",
                  borderRadius: msg.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.from === "user" ? "var(--ink)" : msg.from === "system" ? "var(--tint-success)" : "var(--mist)",
                  color: msg.from === "user" ? "#fff" : "var(--ink-deep)",
                }}>
                  <span className="f-body" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <MsgText text={msg.text} />
                  </span>
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--tint-neutral)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={12} color="var(--ink)" />
                </div>
                <div style={{ padding: "8px 14px", background: "var(--mist)", borderRadius: "16px 16px 16px 4px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: "50%", background: "var(--muted)",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
            {escalated ? (
              <div className="f-body" style={{ flex: 1, fontSize: 11.5, color: "var(--muted)", textAlign: "center", padding: "6px 0" }}>
                Conversation transferred to reception staff
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="f-body"
                  style={{
                    flex: 1, border: "1px solid var(--line)", borderRadius: 12,
                    padding: "7px 12px", fontSize: 12.5, outline: "none"
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: input.trim() ? "var(--ink)" : "var(--tint-neutral)",
                    border: "none", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}
                >
                  <Send size={14} color={input.trim() ? "#fff" : "var(--muted)"} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Float Button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open SGH virtual assistant"
        style={{
          width: 48, height: 48, borderRadius: "50%",
          background: open ? "var(--rose)" : "var(--ink)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(18,59,54,.4)",
          transition: "background 0.2s",
        }}
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={20} color="#fff" />}
      </button>

      {/* Bounce keyframe */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}