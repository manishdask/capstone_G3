<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Services\InvoicePaymentService;
use App\Services\PaymentGatewayService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Exception\ApiErrorException;

/**
 * FR36-FR40: itemised invoices, payment status tracking, sandboxed gateway integration.
 */
class BillingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::query()->with(['patient', 'branch', 'items']);

        if ($user->hasRole(Role::PATIENT)) {
            $query->where('patient_id', $user->patient?->id);
        } else {
            $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
                ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        }

        return response()->json($query->orderByDesc('issued_at')->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR36/FR37: calculate configured charges and generate an itemised invoice.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'admission_id' => ['nullable', 'exists:admissions,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.item_type' => ['required', 'in:consultation,medication,lab_test,other'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $invoice = DB::transaction(function () use ($data) {
            $invoice = Invoice::create([
                'patient_id' => $data['patient_id'],
                'branch_id' => $data['branch_id'],
                'appointment_id' => $data['appointment_id'] ?? null,
                'admission_id' => $data['admission_id'] ?? null,
                'status' => 'pending',
                'issued_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $invoice->items()->create([
                    'description' => $item['description'],
                    'item_type' => $item['item_type'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            $invoice->recalculateTotal();

            return $invoice;
        });

        return response()->json(['data' => $invoice->load('items')], 201);
    }

    /**
     * FR38: patients securely view/download their own invoice.
     */
    public function show(Request $request, Invoice $invoice)
    {
        $user = $request->user();

        if ($user->hasRole(Role::PATIENT) && $user->patient?->id !== $invoice->patient_id) {
            abort(403);
        }

        return response()->json(['data' => $invoice->load('items', 'payments', 'patient', 'branch')]);
    }

    /**
     * FR37/FR38 output form: dynamically generated PDF invoice (SRS 4.1.4).
     */
    public function downloadPdf(Request $request, Invoice $invoice)
    {
        $user = $request->user();

        if ($user->hasRole(Role::PATIENT) && $user->patient?->id !== $invoice->patient_id) {
            abort(403);
        }

        $invoice->load('items', 'patient', 'branch');

        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);

        return $pdf->download("invoice-{$invoice->id}.pdf");
    }

    /**
     * FR40: one-shot sandbox payment (legacy). Only valid for the sandbox
     * provider. For the Stripe provider use checkout()/confirm() instead, so the
     * card is tokenized client-side by Stripe.js Elements and never reaches the
     * server. No full card details are ever stored — only the gateway reference.
     */
    public function pay(Request $request, Invoice $invoice, PaymentGatewayService $gateway, InvoicePaymentService $payments)
    {
        if (! $payments->mayPay($request->user(), $invoice)) {
            abort(403, 'You are not authorised to pay this invoice.');
        }

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Invoice is already paid.'], 409);
        }

        if ($gateway->provider() === 'stripe') {
            return response()->json(['message' => 'Use checkout to initialise a Stripe PaymentIntent.'], 400);
        }

        $data = $request->validate(['method' => ['nullable', 'string', 'max:50']]);

        $intent = $gateway->createIntent((float) $invoice->total_amount);
        $result = $gateway->confirmIntent($intent['gateway_reference']);

        $payment = DB::transaction(function () use ($invoice, $result) {
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'gateway_reference' => $result['gateway_reference'],
                'provider' => $result['provider'],
                'amount' => (float) $invoice->total_amount,
                'currency' => strtoupper($gateway->currency()),
                'status' => $result['status'],
                'method' => 'card',
                'received_at' => now(),
                'paid_at' => $result['status'] === 'success' ? now() : null,
            ]);

            // FR39: record valid paid/pending/cancelled status.
            if ($result['status'] === 'success') {
                $invoice->update(['status' => 'paid']);
            }

            return $payment;
        });

        return response()->json(['data' => $payment->load('invoice')], 201);
    }

    /**
     * FR40: initialise (or resume) a checkout. The amount is the invoice total
     * from MySQL; the invoice's single open PaymentIntent is reused so a second
     * tab or double tap can never produce a second charge. Returns client-safe
     * config: provider, publishable key, client_secret, amount, currency.
     */
    public function checkout(Request $request, Invoice $invoice, InvoicePaymentService $payments)
    {
        return $this->viaGateway(fn () => response()->json([
            'data' => $payments->checkout($request->user(), $invoice),
        ]));
    }

    /**
     * FR40: finalise a checkout. The intent is re-retrieved from Stripe on the
     * server and must be succeeded, for this invoice, in AUD, for its exact
     * total — the browser's word is never enough to mark an invoice paid.
     */
    public function confirm(Request $request, Invoice $invoice, InvoicePaymentService $payments)
    {
        $data = $request->validate(['gateway_reference' => ['required', 'string', 'max:255']]);

        return $this->viaGateway(fn () => response()->json([
            'data' => $payments->confirm($request->user(), $invoice, $data['gateway_reference']),
        ], 201));
    }

    /**
     * A Stripe outage or rejected request becomes a clear 502 instead of a
     * 500. The key is never part of a Stripe error message, so nothing secret
     * reaches the client or the log.
     */
    private function viaGateway(callable $call)
    {
        try {
            return $call();
        } catch (ApiErrorException $e) {
            report($e);

            return response()->json([
                'message' => 'The payment provider could not be reached. No money was taken — please try again shortly.',
            ], 502);
        }
    }
}