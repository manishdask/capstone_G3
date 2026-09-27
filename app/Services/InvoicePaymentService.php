<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * FR36–FR40: paying an invoice through the gateway, and who may see payments.
 *
 * The rules that keep money correct live here, not in the controller:
 *
 *  - The amount always comes from the invoice row in MySQL. Nothing the
 *    browser sends can change what is charged.
 *  - One open PaymentIntent per invoice. Opening checkout twice (two tabs, a
 *    double tap) hands back the SAME intent, so the card can only be charged
 *    once — Stripe refuses to confirm an intent that already succeeded.
 *  - The invoice row is locked for the whole check-then-write, so two
 *    concurrent confirms cannot both mark it paid or record two payments.
 *  - confirm() trusts only Stripe: the intent is re-retrieved server-side and
 *    must be `succeeded`, tagged with THIS invoice's id, in AUD, and for this
 *    invoice's exact total before the invoice is marked paid.
 *
 * Error responses are raised only AFTER the transaction commits: abort()
 * inside DB::transaction() would roll back what was just recorded (e.g. a
 * payment Stripe has already captured).
 */
class InvoicePaymentService
{
    public function __construct(
        private PaymentGatewayService $gateway,
        private ClinicalAccess $access,
    ) {}

    /**
     * The invoice's own patient, an Admin, or branch billing staff (Branch
     * Manager / Receptionist) of the invoice's branch.
     */
    public function mayPay(User $user, Invoice $invoice): bool
    {
        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->hasRole(Role::PATIENT)) {
            return $user->patient !== null && $user->patient->id === $invoice->patient_id;
        }

        if ($user->hasRole(Role::RECEPTIONIST) || $user->hasRole(Role::BRANCH_MANAGER)) {
            return $this->access->branchIdFor($user) === $invoice->branch_id;
        }

        return false;
    }

    /**
     * Start (or resume) a checkout for the invoice.
     *
     * @return array{provider: string, gateway_reference: string, client_secret: ?string, amount: string, currency: string, publishable_key: ?string}
     */
    public function checkout(User $user, Invoice $invoice): array
    {
        $this->authorize($user, $invoice);

        $outcome = DB::transaction(function () use ($invoice) {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($error = $this->payabilityError($invoice)) {
                return $error;
            }

            $provider = $this->gateway->provider();
            $amount = (float) $invoice->total_amount;

            $open = Payment::where('invoice_id', $invoice->id)
                ->where('status', 'pending')
                ->where('provider', $provider)
                ->latest('id')
                ->lockForUpdate()
                ->first();

            $clientSecret = null;

            if ($provider === 'stripe' && $open) {
                $intent = $this->gateway->retrieveStripeIntent($open->gateway_reference);

                if ($intent['status'] === 'succeeded') {
                    // Money already moved but the confirm call never arrived
                    // (tab closed mid-payment). Settle it now instead of
                    // offering a second charge.
                    $settled = $this->settle($invoice, $open, $intent['amount_minor']);

                    return isset($settled['error']) ? $settled : ['error' => [409, 'This invoice has already been paid.']];
                }

                if (in_array($intent['status'], ['requires_payment_method', 'requires_confirmation', 'requires_action'], true)) {
                    if ($intent['amount_minor'] !== $this->gateway->toMinor($amount)) {
                        $this->gateway->updateStripeIntentAmount($intent['id'], $amount);
                        $open->update(['amount' => $amount]);
                    }
                    $clientSecret = $intent['client_secret'];
                } else {
                    // processing / canceled — not reusable; start a fresh one.
                    $open->update(['status' => 'failed', 'failure_reason' => "Superseded (Stripe status: {$intent['status']})"]);
                    $open = null;
                }
            }

            if (! $open) {
                $intent = $this->gateway->createIntent($amount, [
                    'invoice_id' => (string) $invoice->id,
                    'patient_id' => (string) $invoice->patient_id,
                ]);

                $open = Payment::create([
                    'invoice_id' => $invoice->id,
                    'gateway_reference' => $intent['gateway_reference'],
                    'provider' => $intent['provider'],
                    'amount' => $amount,
                    'currency' => strtoupper($this->gateway->currency()),
                    'status' => 'pending',
                    'method' => 'card',
                ]);
                $clientSecret = $intent['client_secret'];
            }

            return ['data' => array_merge($this->gateway->clientConfig(), [
                'gateway_reference' => $open->gateway_reference,
                'client_secret' => $clientSecret,
                'amount' => number_format($amount, 2, '.', ''),
            ])];
        });

        return $this->unwrap($outcome);
    }

    /**
     * Finalise after the browser reports the card step finished. Verifies with
     * the gateway itself and only then marks the invoice paid.
     */
    public function confirm(User $user, Invoice $invoice, string $gatewayReference): Payment
    {
        $this->authorize($user, $invoice);

        $outcome = DB::transaction(function () use ($invoice, $gatewayReference) {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($invoice->status === 'paid') {
                return ['error' => [409, 'This invoice has already been paid.']];
            }

            // Only a reference this server issued for THIS invoice is accepted,
            // so an intent paid for another (cheaper) invoice cannot be replayed.
            $payment = Payment::where('invoice_id', $invoice->id)
                ->where('gateway_reference', $gatewayReference)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                return ['error' => [422, 'That payment does not belong to this invoice.']];
            }

            if ($payment->status === 'success') {
                return ['error' => [409, 'This invoice has already been paid.']];
            }

            if ($payment->provider !== 'stripe') {
                // Sandbox simulation: always authorises.
                return $this->settle($invoice, $payment, $this->gateway->toMinor((float) $invoice->total_amount));
            }

            $intent = $this->gateway->retrieveStripeIntent($gatewayReference);

            if (($intent['metadata']['invoice_id'] ?? null) !== (string) $invoice->id) {
                return ['error' => [422, 'That payment does not belong to this invoice.']];
            }

            if ($intent['currency'] !== $this->gateway->currency()) {
                return ['error' => [422, 'The payment currency does not match the invoice.']];
            }

            if ($intent['status'] === 'processing') {
                return ['error' => [409, 'Your bank is still processing this payment. Check back in a minute before trying again.']];
            }

            if ($intent['status'] !== 'succeeded') {
                // Declined or abandoned. The same intent stays open so the
                // patient can retry with another card without a second charge.
                $reason = $intent['error'] ?: 'The payment was not completed.';
                $payment->update(['failure_reason' => mb_substr($reason, 0, 255)]);

                return ['error' => [402, $reason]];
            }

            return $this->settle($invoice, $payment, $intent['amount_minor']);
        });

        return $this->unwrap($outcome);
    }

    /**
     * Payment history, scoped per caller: a patient sees only their own; an
     * Admin sees every branch; branch billing staff see their own branch.
     */
    public function scopeVisiblePayments(Builder $query, User $user): Builder
    {
        if ($user->hasRole(Role::ADMIN)) {
            return $query;
        }

        if ($user->hasRole(Role::PATIENT)) {
            return $query->whereHas('invoice', fn ($q) => $q->where('patient_id', $user->patient?->id ?? 0));
        }

        $branchId = $this->access->branchIdFor($user) ?? 0;

        return $query->whereHas('invoice', fn ($q) => $q->where('branch_id', $branchId));
    }

    /**
     * Record the settled payment and mark the invoice paid — only when what
     * the gateway captured equals the invoice total. Caller holds the lock.
     *
     * @return array{data: Payment}|array{error: array{int, string}}
     */
    private function settle(Invoice $invoice, Payment $payment, int $capturedMinor): array
    {
        $captured = round($capturedMinor / 100, 2);
        $matches = $capturedMinor === $this->gateway->toMinor((float) $invoice->total_amount);

        $payment->update([
            'status' => 'success',
            'amount' => $captured,
            'currency' => strtoupper($this->gateway->currency()),
            'received_at' => now(),
            'paid_at' => now(),
            // The invoice changed after the card was charged (e.g. a lab test
            // was appended mid-checkout). The money is recorded so billing can
            // reconcile or refund it, but the invoice is not marked paid for
            // an amount it does not match.
            'failure_reason' => $matches ? null : 'Captured amount differs from the invoice total — needs billing review.',
        ]);

        if (! $matches) {
            return ['error' => [409, 'Your payment of $'.number_format($captured, 2).' AUD was received, but the invoice total has changed. Billing staff will reconcile it — you will not be charged twice.']];
        }

        // FR39: record the paid status.
        $invoice->update(['status' => 'paid']);

        return ['data' => $payment->fresh('invoice')];
    }

    /** Raise the outcome's error (after commit) or return its data. */
    private function unwrap(array $outcome): mixed
    {
        if (isset($outcome['error'])) {
            [$status, $message] = $outcome['error'];
            abort($status, $message);
        }

        return $outcome['data'];
    }

    private function authorize(User $user, Invoice $invoice): void
    {
        if (! $this->mayPay($user, $invoice)) {
            abort(403, 'You are not authorised to pay this invoice.');
        }
    }

    /** @return array{error: array{int, string}}|null */
    private function payabilityError(Invoice $invoice): ?array
    {
        return match (true) {
            $invoice->status === 'paid' => ['error' => [409, 'This invoice has already been paid.']],
            $invoice->status === 'cancelled' => ['error' => [422, 'This invoice has been cancelled and cannot be paid.']],
            (float) $invoice->total_amount <= 0 => ['error' => [422, 'This invoice has nothing to pay.']],
            default => null,
        };
    }
}
