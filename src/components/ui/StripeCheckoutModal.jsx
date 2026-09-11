import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, CreditCard, Lock } from "lucide-react";
import Card from "./Card.jsx";
import Button from "./Button.jsx";
import { startCheckout, confirmCheckout } from "../../services/billingService.js";

// ---- Stripe.js loader ----
// Loaded lazily (only when a Stripe checkout is opened) and cached across
// opens. The publishable key needed to initialise Stripe comes from the backend
// at runtime — it is a public key, safe to expose to the browser.
const STRIPE_JS_URL = "https://js.stripe.com/v3/";
let stripeJsPromise = null;

function loadStripeJs() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (!stripeJsPromise) {
    stripeJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = STRIPE_JS_URL;
      s.onload = () => resolve(window.Stripe);
      s.onerror = () => {
        stripeJsPromise = null;
        reject(new Error("Could not load Stripe.js"));
      };
      document.head.appendChild(s);
    });
  }
  return stripeJsPromise;
}

/**
 * FR40 checkout modal. Initialises a PaymentIntent on the backend, then:
 *  - stripe  provider: renders a Stripe Elements card field so the card is
 *    tokenized by Stripe (raw card details never reach our server), confirms
 *    the PaymentIntent, and finalises on the backend.
 *  - sandbox provider: no card data at all (it would be thrown away) — just a
 *    one-tap "Pay now" that finalises the simulated payment.
 */
export default function StripeCheckoutModal({ invoice, onClose, onSuccess }) {
  const [intent, setIntent] = useState(null); // {provider, publishable_key, gateway_reference, client_secret, amount, currency}
  const [stripeReady, setStripeReady] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const elementMounted = useRef(false);

  // Initialise the checkout (backend intent) the moment the modal opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await startCheckout(invoice.id);
        if (cancelled) return;
        setIntent(data);

        if (data.provider === "stripe") {
          const Stripe = await loadStripeJs();
          if (cancelled) return;
          stripeRef.current = Stripe(data.publishable_key);
          setStripeReady(true);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not start checkout.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice.id]);

  // Mount the Elements card field once its container exists.
  useEffect(() => {
    if (intent?.provider === "stripe" && stripeReady && !elementMounted.current) {
      const elements = stripeRef.current.elements({ clientSecret: intent.client_secret });
      const card = elements.create("card", {
        style: {
          base: { fontSize: "14px", color: "var(--ink-deep)", "::placeholder": { color: "var(--muted)" } },
        },
      });
      card.mount("#stripe-card-element");
      cardRef.current = card;
      elementMounted.current = true;
    }
  }, [intent, stripeReady]);

  // Sandbox: no card form — finalise the simulated charge directly.
  async function handleSandboxPay() {
    setProcessing(true);
    setError("");
    try {
      await confirmCheckout(invoice.id, intent.gateway_reference);
      setSucceeded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  // Stripe: tokenize via Elements, confirm the intent, then finalise on backend.
  async function handleStripePay(e) {
    e.preventDefault();
    if (!cardRef.current) return;
    setProcessing(true);
    setError("");
    try {
      const { error: confirmError, paymentIntent } = await stripeRef.current.confirmCardPayment(
        intent.client_secret,
        { payment_method: { card: cardRef.current } }
      );
      if (confirmError) {
        setError(confirmError.message); // e.g. "Your card number is incomplete."
        setProcessing(false);
        return;
      }
      if (paymentIntent.status !== "succeeded") {
        setError("Payment was not completed. Please try again.");
        setProcessing(false);
        return;
      }
      await confirmCheckout(invoice.id, intent.gateway_reference);
      setSucceeded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  // On success, brief pause then reload the invoice list and close.
  useEffect(() => {
    if (!succeeded) return;
    const t = setTimeout(onSuccess, 1300);
    return () => clearTimeout(t);
  }, [succeeded, onSuccess]);

  const isStripe = intent?.provider === "stripe";

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(11,36,34,0.75)",
        zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, borderRadius: 34,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 330, background: "#fff", border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={16} /> Online Checkout
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }} aria-label="Close checkout">
            <X size={16} />
          </button>
        </div>

        <div className="f-body" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          Amount: <strong style={{ color: "var(--ink-deep)", fontSize: 13.5 }}>${Number(invoice.amount).toFixed(2)} AUD</strong> <br />
          Ref: <span className="f-mono">INV-{invoice.id}</span>
        </div>

        {succeeded ? (
          <div style={{ textAlign: "center", padding: "14px 0", color: "var(--sage)" }}>
            <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
            <div className="f-body" style={{ fontSize: 13, fontWeight: 700 }}>Payment Authorized!</div>
            <div className="f-body" style={{ fontSize: 11, color: "var(--muted)" }}>Updating ledger...</div>
          </div>
        ) : !intent ? (
          <div className="f-body" style={{ color: "var(--muted)", fontSize: 12, padding: "14px 0", textAlign: "center" }}>
            {error || "Preparing secure checkout..."}
          </div>
        ) : isStripe ? (
          <form onSubmit={handleStripePay}>
            <label className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Card Details <span style={{ textTransform: "none" }}>(test card: 4242 4242 4242 4242)</span>
            </label>
            <div
              id="stripe-card-element"
              style={{
                border: "1px solid var(--line)", borderRadius: 10, padding: "12px 12px 14px",
                background: "var(--mist)", marginBottom: 4,
              }}
            />

            {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, margin: "8px 0" }}>{error}</div>}

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--muted)", margin: "10px 0 12px" }}>
              <Lock size={12} color="var(--sage)" /> Card details are tokenized by Stripe (FR40) — never stored by SGH.
            </div>

            <Button full variant="dark" type="submit" disabled={processing}>
              {processing ? "Processing…" : `Pay $${Number(invoice.amount).toFixed(2)} AUD`}
            </Button>
          </form>
        ) : (
          <div>
            <p className="f-body" style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
              Sandboxed gateway (FR40) — test mode, no card required. Payment succeeds instantly.
            </p>
            {error && <div className="f-body" style={{ color: "var(--rose)", fontSize: 11, margin: "0 0 10px" }}>{error}</div>}
            <Button full variant="dark" onClick={handleSandboxPay} disabled={processing}>
              {processing ? "Processing…" : `Pay $${Number(invoice.amount).toFixed(2)} AUD`}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
