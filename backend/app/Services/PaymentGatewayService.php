<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Sandboxed payment gateway adapter (FR40, Section 2.4). Simulates a
 * Stripe/PayPal-style charge without any real credentials or card data —
 * swap this class for a real SDK-backed adapter once contracts/PCI review exist.
 */
class PaymentGatewayService
{
    /**
     * @return array{reference: string, status: string}
     */
    public function charge(float $amount, string $method = 'card'): array
    {
        return [
            'reference' => 'sandbox_'.Str::uuid(),
            'status' => 'success',
            'amount' => $amount,
            'method' => $method,
        ];
    }

    /** FR64 (proposed): sandboxed refund — same simulate-the-adapter approach as charge(). */
    public function refund(string $originalReference, float $amount): array
    {
        return [
            'reference' => 'refund_'.Str::uuid(),
            'original_reference' => $originalReference,
            'status' => 'success',
            'amount' => $amount,
        ];
    }
}
