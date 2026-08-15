import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Phone } from "lucide-react";

// ---- Simulated response engine ----
const BRANCH_HOURS = {
  kogarah: "Mon–Fri 7:30am–8pm, Sat 8am–5pm, Sun 9am–3pm",
  hurstville: "Mon–Fri 8am–7pm, Sat 8am–4pm, Closed Sunday",
  parramatta: "Mon–Fri 7am–9pm, Sat 8am–6pm, Sun 10am–3pm",
  southbank: "Mon–Fri 8am–7pm, Sat 9am–5pm, Closed Sunday",
};

const CONTACTS = {
  main: "1800-SGH-HELP",
  kogarah: "(02) 9113 1000",
  hurstville: "(02) 9580 1200",
  parramatta: "(02) 8842 3400",
  southbank: "(03) 9088 1700",
};

function getResponse(input) {
  const msg = input.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good|howdy)/.test(msg)) {
    return { text: "Hello! 👋 I'm the SGH virtual assistant. I can help you with:\n• Booking appointments\n• Checking lab test status\n• Branch hours & contacts\n• General hospital information\n\nHow can I assist you today?", escalate: false };
  }

  // Appointments
  if (/book|appointment|schedule|consult|visit|see.*doctor/.test(msg)) {
    return { text: "To book an appointment:\n1. Tap the **Home** tab\n2. Click **Book an Appointment**\n3. Filter by specialty or doctor gender\n4. Select a doctor and choose your preferred date & time\n\nYour request will be sent to the doctor for confirmation. Need help with anything else?", escalate: false };
  }

  // Cancel appointment
  if (/cancel|reschedule/.test(msg)) {
    return { text: "To cancel or reschedule an appointment, go to:\n• **Home tab** → Tap **Reschedule** or **Cancel** on your next appointment card\n• **Appts tab** → Find the appointment and tap **Cancel Appointment**\n\nNote: Cancellations should ideally be made at least 2 hours before the scheduled time.", escalate: false };
  }

  // Lab results
  if (/lab|test|result|blood|report|diagnostic|ecg|lipid|fbc|x.ray/.test(msg)) {
    return { text: "Lab results are available once signed off by the lab technician. To check your results:\n1. Go to the **Records** tab\n2. Select **Lab reports**\n\nReady results will have a green ✅ badge and a **Get Report** download button. Results currently in-progress will show **In progress** status.", escalate: false };
  }

  // Branch hours
  if (/hour|open|clos|when|time.*branch|branch.*time/.test(msg)) {
    const match = Object.keys(BRANCH_HOURS).find(b => msg.includes(b));
    if (match) {
      return { text: `**${match.charAt(0).toUpperCase() + match.slice(1)} Branch Hours:**\n${BRANCH_HOURS[match]}\n\nNeed directions or to call the branch?`, escalate: false };
    }
    return {
      text: "Here are all SGH branch hours:\n\n**Kogarah:** " + BRANCH_HOURS.kogarah +
        "\n**Hurstville:** " + BRANCH_HOURS.hurstville +
        "\n**Parramatta:** " + BRANCH_HOURS.parramatta +
        "\n**Southbank:** " + BRANCH_HOURS.southbank +
        "\n\nFor emergencies, please call 000.",
      escalate: false
    };
  }

  // Contact info
  if (/contact|phone|call|number|email|reach/.test(msg)) {
    return {
      text: `**SGH Contact Numbers:**\n• Main Line: ${CONTACTS.main}\n• Kogarah: ${CONTACTS.kogarah}\n• Hurstville: ${CONTACTS.hurstville}\n• Parramatta: ${CONTACTS.parramatta}\n• Southbank (VIC): ${CONTACTS.southbank}\n\nFor general queries: info@stgeorge.health\nFor billing: billing@stgeorge.health`,
      escalate: false
    };
  }

  // Invoice / billing
  if (/invoice|bill|pay|payment|charge|fee|cost/.test(msg)) {
    return { text: "To view and pay your invoices:\n1. Go to the **Records** tab\n2. Select **Invoices**\n\nPending invoices have a **Pay online** button. All payments are processed through our secure encrypted checkout (PCI-DSS compliant).\n\nFor billing disputes, contact billing@stgeorge.health", escalate: false };
  }

  // Emergency
  if (/emergen|ambulan|urgent|000/.test(msg)) {
    return { text: "🚨 **Emergency?** Please call **000** immediately for ambulance, police, or fire.\n\nFor urgent medical but non-emergency situations, visit the nearest SGH emergency department or call your nearest branch directly.", escalate: false };
  }

  // Clinical / medical advice
  if (/diagnos|symptom|pain|treat|medic|drug|dos|prescri|disease|condition|sick|ill|hurt/.test(msg)) {
    return { text: "I understand you have a health concern. For clinical questions, please consult your doctor directly — I'm not able to provide medical advice.\n\nConnecting you to a human receptionist...", escalate: true };
  }

  // Fallback
  return { text: "I'm not sure I understood that. I can help with:\n• **Booking appointments**\n• **Lab result status**\n• **Branch hours & contacts**\n• **Billing & invoices**\n\nFor complex queries, I can connect you to a receptionist. Just ask!", escalate: false };
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

export default function ChatbotWidget({ userName }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: `Hi ${userName ? userName.split(" ")[0] : "there"}! 👋 I'm the SGH virtual assistant. How can I help you today?`, escalated: false }
  ]);
  const [escalated, setEscalated] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  function sendMessage(text) {
    if (!text.trim() || escalated) return;
    const userMsg = { id: Date.now(), from: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const { text: replyText, escalate } = getResponse(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: "bot", text: replyText, escalated: escalate }]);
      setTyping(false);
      if (escalate) {
        setEscalated(true);
        // Show human handoff after a brief delay
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            from: "system",
            text: "🧑‍⚕️ You are now connected to a St. George receptionist. Average wait time: 2–4 minutes. Ref: " + `TKT-${Math.floor(10000 + Math.random() * 89999)}`
          }]);
        }, 1800);
      }
    }, 900);
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
              <div className="f-body" style={{ color: "#8FA39E", fontSize: 10.5 }}>
                {escalated ? "🟡 Transferring to receptionist..." : "🟢 Online — typically replies instantly"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA39E" }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", flexDirection: msg.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 6 }}>
                {msg.from !== "user" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: msg.from === "system" ? "#E7F3EB" : "#EEF1EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {msg.from === "system" ? <Phone size={12} color="var(--sage)" /> : <Bot size={12} color="var(--ink)" />}
                  </div>
                )}
                <div style={{
                  maxWidth: "76%",
                  padding: "8px 12px",
                  borderRadius: msg.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.from === "user" ? "var(--ink)" : msg.from === "system" ? "#E7F3EB" : "#F5F6F2",
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
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EEF1EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={12} color="var(--ink)" />
                </div>
                <div style={{ padding: "8px 14px", background: "#F5F6F2", borderRadius: "16px 16px 16px 4px" }}>
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
                    background: input.trim() ? "var(--ink)" : "#EEF1EE",
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
