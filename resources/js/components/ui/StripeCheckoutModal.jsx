import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
// The /pure entry loads js.stripe.com only when loadStripe() is first called
// (i.e. when a checkout opens) — the default entry injects it on app start,
// on every page including the public site.
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, CheckCircle2, CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";
import Card from "./Card.jsx";
import Button from "./Button.jsx";
import { ApiError } from "../../services/api.js";
import { startCheckout, confirmCheckout } from "../../services/billingService.js";

// The publishable key is public by design (pk_test_…). It is baked in at build
// time from VITE_STRIPE_PUBLISHABLE_KEY, with the backend's copy as a fallback,
// so a build made without it still works. The SECRET key never reaches here.
const BUILD_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

// loadStripe() must run once per key, not on every render.
const stripePromises = new Map();
function stripeFor(key) {
  if (!stripePromises.has(key)) stripePromises.set(key, loadStripe(key));
  return stripePromises.get(key);
}

// Stripe renders the card field in its own iframe, where CSS variables do not
// resolve — so the hospital palette (styles/tokens.css) is passed as hex.
const CARD_STYLE = {
  base: {
    fontSize: "15px",
    color: "#0b2422",
    fontFamily: "Inter, system-ui, sans-serif",
    iconColor: "#123b36",
    "::placeholder": { color: "#5c6b67" },
  },
  invalid: { color: "#c1435b", iconColor: "#c1435b" },
};

// Plain-language versions of Stripe's decline codes. Anything not listed falls
// back to Stripe's own message, which is already user-safe.
const DECLINE_MESSAGES = {
  card_declined: "Your card was declined. Please try a different card.",
  generic_decline: "Your card was declined. Please try a different card.",
  insufficient_funds: "Your card has insufficient funds. Please try a different card.",
  lost_card: "Your card was declined. Please try a different card.",
  stolen_card: "Your card was declined. Please try a different card.",
  expired_card: "Your card has expired. Please use a different card.",
  incorrect_cvc: "The security code (CVC) is incorrect. Please check it and try again.",
  incorrect_number: "The card number is incorrect. Please check it and try again.",
  processing_error: "Something went wrong processing your card. Please try again.",
};

function friendlyStripeError(error) {
  if (!error) return "The payment could not be completed. Please try again.";
  return DECLINE_MESSAGES[error.decline_code] || DECLINE_MESSAGES[error.code] || error.message;
}

const isAlreadyPaid = (err) => err instanceof ApiError && err.status === 409 && /already been paid/i.test(err.message);

function ErrorLine({ children }) {
  return (
    <div
      role="alert"
      className="f-body"
      style={{
        display: "flex", gap: 6, alignItems: "flex-start", background: "var(--tint-alert)", color: "var(--rose)",
        fontSize: 12, lineHeight: 1.4, borderRadius: 8, padding: "8px 10px", margin: "10px 0",
      }}
    >
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

/** Card form — must render inside <Elements>. */
function StripeCardForm({ invoice, intent, amountLabel, onPaid, processing, setProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function finalise() {
    try {
      await confirmCheckout(invoice.id, intent.gateway_reference);
      onPaid();
    } catch (err) {
      if (isAlreadyPaid(err)) onPaid();
      else setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError("");
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (stripeError) {
        // A second submit on an intent that already succeeded: settle it.
        if (stripeError.payment_intent?.status === "succeeded") {
          await finalise();
          return;
        }
        setError(friendlyStripeError(stripeError));
        // A decline happened entirely between the browser and Stripe. Ask the
        // backend to check the intent too, so it records Stripe's reason on
        // the payment for billing staff. It re-verifies with Stripe itself and
        // can only ever answer "not paid" here — the result is not needed.
        if (stripeError.type === "card_error") {
          confirmCheckout(invoice.id, intent.gateway_reference).catch(() => {});
        }
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await finalise();
      } else if (paymentIntent?.status === "processing") {
        setError("Your bank is still processing this payment. Please check your invoices again in a minute.");
      } else {
        setError("The payment was not completed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "The payment could not be completed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
        Card details
      </label>
      <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "13px 12px", background: "var(--mist)" }}>
        <CardElement
          options={{ style: CARD_STYLE, hidePostalCode: true }}
          onChange={(e) => {
            setComplete(e.complete);
            setError(e.error ? friendlyStripeError(e.error) : "");
          }}
        />
      </div>
      <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>
        Test mode — use card 4242 4242 4242 4242, any future expiry, any CVC.
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      <div className="f-body" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "var(--muted)", margin: "10px 0 12px" }}>
        <Lock size={12} color="var(--sage)" /> Card details go straight to Stripe — SGH never sees or stores them.
      </div>

      <Button full variant="dark" type="submit" disabled={!stripe || !complete || processing}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {processing && <Loader2 size={15} className="spin" />}
          {processing ? "Processing payment…" : `Pay ${amountLabel}`}
        </span>
      </Button>
    </form>
  );
}

/**
 * FR40 checkout modal. The backend creates (or reuses) the invoice's single
 * PaymentIntent and decides the amount from MySQL; this modal only collects
 * the card via Stripe Elements and asks the backend to verify the result.
 *  - stripe  provider: Stripe Elements card field.
 *  - sandbox provider: no card data at all — a one-tap simulated payment.
 */
export default function StripeCheckoutModal({ invoice, onClose, onSuccess }) {
  const [intent, setIntent] = useState(null);
  const [startError, setStartError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [sandboxError, setSandboxError] = useState("");

  useEffect(() => {
    let cancelled = false;
    startCheckout(invoice.id)
      .then((data) => { if (!cancelled) setIntent(data); })
      .catch((err) => {
        if (cancelled) return;
        if (isAlreadyPaid(err)) setSucceeded(true);
        else setStartError(err.message || "Could not start checkout.");
      });
    return () => { cancelled = true; };
  }, [invoice.id]);

  // On success, a brief confirmation, then refresh the invoice list.
  useEffect(() => {
    if (!succeeded) return;
    const t = setTimeout(onSuccess, 1500);
    return () => clearTimeout(t);
  }, [succeeded, onSuccess]);

  const isStripe = intent?.provider === "stripe";
  const publishableKey = BUILD_PUBLISHABLE_KEY || intent?.publishable_key || "";
  const stripePromise = useMemo(() => (isStripe && publishableKey ? stripeFor(publishableKey) : null), [isStripe, publishableKey]);
  // The amount shown is the server's, not the list row's (it may have changed).
  const amountLabel = `$${Number(intent?.amount ?? invoice.amount).toFixed(2)} ${intent?.currency || "AUD"}`;

  async function handleSandboxPay() {
    setProcessing(true);
    setSandboxError("");
    try {
      await confirmCheckout(invoice.id, intent.gateway_reference);
      setSucceeded(true);
    } catch (err) {
      if (isAlreadyPaid(err)) setSucceeded(true);
      else setSandboxError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  // Portal onto the phone's visible screen (a non-scrolling, position:relative
  // box) so the dialog is always in view. Rendered in place, it was centred on
  // the whole scrollable Records list and could sit below the visible screen
  // on a long page. Outside the phone frame it falls back to the viewport.
  const host = document.querySelector(".phone-screen");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pay invoice"
      style={{
        position: host ? "absolute" : "fixed", inset: 0, background: "rgba(11,36,34,0.75)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: host ? "inherit" : 0,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 360, background: "#fff", border: "none", maxHeight: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-deep)", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={16} /> Pay invoice
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            style={{ background: "none", border: "none", cursor: processing ? "not-allowed" : "pointer", color: "var(--muted)", padding: 4 }}
            aria-label="Close checkout"
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ background: "var(--mist)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <div className="f-body" style={{ fontSize: 12, color: "var(--muted)" }}>{invoice.desc}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
            <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>INV-{invoice.id}</span>
            <strong className="f-display" style={{ fontSize: 17, color: "var(--ink-deep)" }}>{amountLabel}</strong>
          </div>
        </div>

        {succeeded ? (
          <div role="status" style={{ textAlign: "center", padding: "12px 0 6px", color: "var(--sage)" }}>
            <CheckCircle2 size={34} style={{ margin: "0 auto 8px" }} />
            <div className="f-display" style={{ fontSize: 14, fontWeight: 700 }}>Payment successful</div>
            <div className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Your invoice is now marked paid.</div>
          </div>
        ) : startError ? (
          <>
            <ErrorLine>{startError}</ErrorLine>
            <Button full variant="ghost" onClick={onClose}>Close</Button>
          </>
        ) : !intent ? (
          <div className="f-body" style={{ color: "var(--muted)", fontSize: 12.5, padding: "16px 0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Loader2 size={15} className="spin" /> Preparing secure checkout…
          </div>
        ) : isStripe ? (
          stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                invoice={invoice}
                intent={intent}
                amountLabel={amountLabel}
                onPaid={() => setSucceeded(true)}
                processing={processing}
                setProcessing={setProcessing}
              />
            </Elements>
          ) : (
            <ErrorLine>Online card payment is not configured (missing Stripe publishable key). Please pay at reception.</ErrorLine>
          )
        ) : (
          <div>
            <p className="f-body" style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>
              Sandboxed gateway (FR40) — test mode, no card required. Payment succeeds instantly.
            </p>
            {sandboxError && <ErrorLine>{sandboxError}</ErrorLine>}
            <Button full variant="dark" onClick={handleSandboxPay} disabled={processing}>
              {processing ? "Processing…" : `Pay ${amountLabel}`}
            </Button>
          </div>
        )}
      </Card>
    </div>,
    host || document.body
  );
}
