<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR64 (proposed): idempotent gateway callback handling + a staff-initiated
 * refund flow. Builds on the sandboxed PaymentGatewayService (FR40) and the
 * payments.gateway_reference unique constraint that was already scaffolded
 * for exactly this purpose.
 */
class PaymentController extends Controller
{
    /**
     * Simulates an asynchronous gateway webhook confirming/rejecting a charge
     * that BillingController::pay() initiated. Deliberately unauthenticated —
     * real gateways call back without a user session; this sandbox mirrors
     * that by trusting the unique gateway_reference instead of a bearer token.
     */
    public function callback(Request $request)
    {
        $data = $request->validate([
            'gateway_reference' => ['required', 'string', 'exists:payments,gateway_reference'],
            'status' => ['required', 'in:success,failed'],
        ]);

        $payment = DB::transaction(function () use ($data) {
            $payment = Payment::where('gateway_reference', $data['gateway_reference'])->lockForUpdate()->first();

            // Idempotent: gateways commonly redeliver the same notification —
            // an already-applied terminal outcome is a no-op, not an error,
            // and never produces a second Payment row.
            if (in_array($payment->status, ['success', 'failed', 'refunded'], true)) {
                return $payment;
            }

            $payment->update(['status' => $data['status'], 'received_at' => $payment->received_at ?? now()]);

            if ($data['status'] === 'success' && $payment->invoice->status !== 'paid') {
                $payment->invoice->update(['status' => 'paid']);
            }

            return $payment;
        });

        return response()->json(['data' => $payment->fresh('invoice')]);
    }

    /** Staff-initiated refund — idempotent: refunding an already-refunded payment is a no-op. */
    public function refund(Payment $payment, PaymentGatewayService $gateway)
    {
        if ($payment->status === 'refunded') {
            return response()->json(['data' => $payment]);
        }

        if ($payment->status !== 'success') {
            abort(422, 'Only a successfully completed payment can be refunded.');
        }

        $gateway->refund($payment->gateway_reference, (float) $payment->amount);

        $payment->update(['status' => 'refunded']);

        return response()->json(['data' => $payment->fresh('invoice')]);
    }
}
