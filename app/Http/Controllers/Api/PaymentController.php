<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Role;
use App\Services\InvoicePaymentService;
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
    public function callback(Request $request, PaymentGatewayService $gateway)
    {
        // Sandbox only. It is unauthenticated and trusts the caller's word, so
        // with a real gateway it would let anyone mark a pending Stripe payment
        // as paid without money moving. Stripe payments are settled solely by
        // InvoicePaymentService::confirm(), which verifies with Stripe itself.
        if ($gateway->provider() === 'stripe') {
            abort(404);
        }

        $data = $request->validate([
            'gateway_reference' => ['required', 'string', 'exists:payments,gateway_reference'],
            'status' => ['required', 'in:success,failed'],
        ]);

        $payment = DB::transaction(function () use ($data) {
            $payment = Payment::where('gateway_reference', $data['gateway_reference'])->lockForUpdate()->first();

            // A Stripe-created payment is never settled by this simulator,
            // even if the provider is later switched back to sandbox.
            if ($payment->provider === 'stripe') {
                abort(404);
            }

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

    /**
     * FR36–FR40 payment history. A patient sees only payments on their own
     * invoices; an Admin sees every branch; Branch Manager / Receptionist see
     * their own branch. Patients see settled payments only — an abandoned
     * checkout's pending attempt is billing detail, not history.
     */
    public function index(Request $request, InvoicePaymentService $payments)
    {
        $user = $request->user();

        // Only the patient fields a payment list shows — billing views have no
        // reason to carry encrypted health data such as allergies.
        $query = Payment::query()->with([
            'invoice.patient:id,first_name,last_name,global_patient_id',
            'invoice.branch:id,name',
            'invoice.items:id,invoice_id,description',
        ]);
        $payments->scopeVisiblePayments($query, $user);

        if ($user->hasRole(Role::PATIENT)) {
            $query->whereIn('status', ['success', 'refunded']);
        } else {
            $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
                ->when($request->filled('branch_id'), fn ($q) => $q->whereHas('invoice', fn ($i) => $i->where('branch_id', $request->integer('branch_id'))));
        }

        return response()->json(
            $query->orderByDesc('paid_at')->orderByDesc('id')->paginate(min($request->integer('per_page', 20), 100))
        );
    }

    /** Staff-initiated refund — idempotent: refunding an already-refunded payment is a no-op. */
    public function refund(Request $request, Payment $payment, PaymentGatewayService $gateway, InvoicePaymentService $payments)
    {
        // Staff may only refund payments they can see (Admin: all; branch staff: own branch).
        if (! $payments->scopeVisiblePayments(Payment::whereKey($payment->id), $request->user())->exists()) {
            abort(403, 'You are not authorised to refund this payment.');
        }

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
