<?php

namespace App\Services;

use Illuminate\Support\Str;
use Stripe\StripeClient;

/**
 * Payment gateway adapter (FR40, Section 2.4). Dispatches between two backends;
 * the active one is configuration-only via config/payments.php:
 *
 *  - sandbox (default; no credentials set): a pure simulation that returns a
 *    sandbox_* reference and always succeeds. No external calls, no card data,
 *    nothing to configure. This is what the app runs on until real test keys
 *    are supplied.
 *  - stripe: real Stripe TEST-mode via PaymentIntents. Raw card details are
 *    tokenized client-side by Stripe.js Elements, so only a pi_* intent ID
 *    (and never a card number) reaches the server. The backend secret key is
 *    read from config and never leaves the server.
 *
 * The sandbox swap-in was scaffolded exactly for this — see the git history of
 * this class and the FR40 row in FR_PROGRESS.md.
 */
class PaymentGatewayService
{
    private ?StripeClient $stripe = null;

    /**
     * The effective provider, gracefully degrading from a configured "stripe"
     * provider back to "sandbox" when no secret key is present.
     */
    public function provider(): string
    {
        $wants = strtolower((string) config('payments.provider', 'sandbox'));

        return $wants === 'stripe' && $this->configured() ? 'stripe' : 'sandbox';
    }

    public function configured(): bool
    {
        return (bool) config('payments.secret_key');
    }

    /** Safe-to-share gateway config for the browser (publishable key, not the secret). */
    public function clientConfig(): array
    {
        return [
            'provider' => $this->provider(),
            'publishable_key' => $this->provider() === 'stripe' ? config('payments.publishable_key') : null,
            'currency' => strtoupper($this->currency()),
        ];
    }

    /**
     * Initialise a checkout for an invoice.
     *
     * stripe: creates a real PaymentIntent and returns its client_secret, which
     *         is handed to Stripe.js Elements so the card is captured
     *         client-side. The id (pi_*) becomes the gateway_reference.
     * sandbox: fabricates a reference and returns no client_secret — the
     *          frontend just finalises with confirmIntent().
     *
     * @return array{provider: string, gateway_reference: string, client_secret: ?string}
     */
    public function createIntent(float $amount, array $metadata = []): array
    {
        if ($this->provider() === 'stripe') {
            $intent = $this->stripe()->paymentIntents->create([
                'amount' => $this->toMinor($amount),
                'currency' => $this->currency(),
                // Card only: the Elements card field is the one payment UI we
                // render, and redirect-based methods would need a return URL.
                'payment_method_types' => ['card'],
                'description' => 'SGH App invoice payment',
                // Ties the intent to one invoice. confirm() checks it, so a
                // succeeded intent can never settle a different invoice.
                'metadata' => $metadata,
            ]);

            return [
                'provider' => 'stripe',
                'gateway_reference' => $intent->id,
                'client_secret' => $intent->client_secret,
            ];
        }

        return [
            'provider' => 'sandbox',
            'gateway_reference' => 'sandbox_'.Str::uuid(),
            'client_secret' => null,
        ];
    }

    /**
     * Confirm a previously created intent and report its terminal status.
     *
     * stripe: retrieves the intent and maps its status; "success" only when
     *         Stripe reports the card authorised.
     * sandbox: the simulation always succeeds for any reference it handed out.
     *
     * @return array{provider: string, gateway_reference: string, status: string, amount: float}
     */
    public function confirmIntent(string $gatewayReference): array
    {
        if ($this->provider() === 'stripe') {
            $intent = $this->stripe()->paymentIntents->retrieve($gatewayReference);

            return [
                'provider' => 'stripe',
                'gateway_reference' => $intent->id,
                'status' => match ($intent->status) {
                    'succeeded' => 'success',
                    'processing' => 'pending',
                    default => 'failed',
                },
                'amount' => $this->fromMinor($intent->amount),
            ];
        }

        return [
            'provider' => 'sandbox',
            'gateway_reference' => $gatewayReference,
            'status' => 'success',
            'amount' => 0.0, // sandbox records the invoice total on the caller's side
        ];
    }

    /**
     * FR64: refund a settled payment.
     * stripe: issues a real Stripe refund against the original PaymentIntent.
     * sandbox: simulation — fabricates a refund_* reference and succeeds.
     *
     * @return array{reference: string, status: string, amount: float}
     */
    public function refund(string $originalReference, float $amount): array
    {
        // Only a real Stripe PaymentIntent is refunded through Stripe; a
        // sandbox_* payment taken before the switch is refunded in simulation.
        if ($this->provider() === 'stripe' && str_starts_with($originalReference, 'pi_')) {
            $refund = $this->stripe()->refunds->create(['payment_intent' => $originalReference]);

            return [
                'reference' => $refund->id,
                'status' => $refund->status === 'succeeded' ? 'success' : 'pending',
                'amount' => $this->fromMinor($refund->amount),
            ];
        }

        return [
            'reference' => 'refund_'.Str::uuid(),
            'status' => 'success',
            'amount' => $amount,
        ];
    }

    /**
     * Full server-side view of a Stripe PaymentIntent — the source of truth
     * for whether money moved. Never derived from anything the browser sent.
     *
     * @return array{id: string, status: string, amount_minor: int, currency: string, metadata: array, client_secret: ?string, error: ?string, decline_code: ?string}
     */
    public function retrieveStripeIntent(string $intentId): array
    {
        $intent = $this->stripe()->paymentIntents->retrieve($intentId);

        return [
            'id' => $intent->id,
            'status' => $intent->status,
            'amount_minor' => (int) $intent->amount,
            'currency' => strtolower((string) $intent->currency),
            'metadata' => $intent->metadata ? $intent->metadata->toArray() : [],
            'client_secret' => $intent->client_secret,
            // Stripe's reason for the most recent failed attempt, e.g. a decline.
            'error' => $intent->last_payment_error?->message,
            'decline_code' => $intent->last_payment_error?->decline_code,
        ];
    }

    /** Re-price an open intent when the invoice total changed (e.g. a lab test was added). */
    public function updateStripeIntentAmount(string $intentId, float $amount): void
    {
        $this->stripe()->paymentIntents->update($intentId, ['amount' => $this->toMinor($amount)]);
    }

    public function currency(): string
    {
        return strtolower((string) config('payments.currency', 'aud'));
    }

    public function toMinor(float $amount): int
    {
        return (int) round($amount * 100);
    }

    private function stripe(): StripeClient
    {
        return $this->stripe ??= new StripeClient(config('payments.secret_key'));
    }

    private function fromMinor(int $minor): float
    {
        return round($minor / 100, 2);
    }
}
