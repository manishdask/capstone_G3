<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * FR36/FR37: invoice generation. The precedent is a billable account for a
 * visit/admission: one itemised invoice per appointment, priced from the
 * branch's configured `services` price list (the "configured charges" FR36
 * requires) rather than hardcoded figures.
 *
 * The consultation is invoiced UP FRONT when the appointment is booked (so the
 * patient immediately sees a bill and can pay via checkout). Anything else
 * linked to the appointment is itemised onto that same invoice once the visit
 * completes — labs and procedures never double-bill the consultation:
 *  - booking creates a Pending invoice with the consultation line only;
 *  - completion APPENDS every linked lab order and procedure booking;
 *  - if the patient already paid the booking invoice, completion instead
 *    issues a supplementary invoice for the remaining linked services.
 *
 * A late-linked service (added after completion) is appended to the existing
 * Pending invoice, or triggers a supplementary invoice if that one is Paid.
 *
 * If a linked service has no price-list entry it still appears on the invoice
 * as a $0.00 line rather than silently disappearing — billing input is always
 * visible for staff reconciliation.
 */
class BillingService
{
    public const CONSULT_GENERAL = 'General Consultation';
    public const CONSULT_SPECIALIST = 'Specialist Consultation';

    /**
     * Generate the consultation invoice immediately when an appointment is
     * booked and confirmed (FR16/FR19). Idempotent. The patient can view and
     * pay this at once; completion appends the remaining items.
     */
    public function generateForBooking(Appointment $appointment, ?User $actor = null): ?Invoice
    {
        if ($existing = $this->invoiceFor($appointment)) {
            return $existing;
        }

        return $this->createInvoice($appointment, [$this->consultationItem($appointment)], $actor, 'appointment_booking');
    }

    /**
     * Called when an appointment is marked COMPLETED.
     *
     * If a booking invoice already exists (the normal path), the linked labs
     * and procedures are APPENDED to it — never re-charging the consultation.
     * If the booking invoice was already Paid, a supplementary invoice is
     * created for the remaining linked services. For a legacy appointment with
     * no booking invoice, the full itemised invoice is generated as before.
     */
    public function generateForAppointment(Appointment $appointment, ?User $actor = null): ?Invoice
    {
        if ($existing = $this->invoiceFor($appointment)) {
            return $this->appendLinkedItems($appointment, $existing, $actor) ?? $existing;
        }

        return $this->createInvoice($appointment, [
            $this->consultationItem($appointment),
            ...$this->labItems($appointment),
            ...$this->procedureItems($appointment),
        ], $actor, 'appointment_completion');
    }

    /**
     * Late-link: when a lab order or procedure booking is linked to an
     * appointment that has already been COMPLETED and invoiced, append the
     * new item to the existing Pending invoice, or create a supplementary
     * invoice if the original is already Paid.
     *
     * @return Invoice|null the invoice the item was added to, or null when
     *         no action was needed (appointment not yet completed / no invoice).
     */
    public function attachItemToCompletedAppointment(
        Appointment $appointment,
        string $description,
        string $itemType,
    ): ?Invoice {
        if ($appointment->status !== 'completed') {
            return null;
        }

        $invoice = $this->invoiceFor($appointment);

        if (! $invoice) {
            return null;
        }

        $item = $this->pricedItem($description, $itemType, $appointment);

        if ($invoice->status === 'pending') {
            DB::transaction(function () use ($invoice, $item) {
                $invoice->items()->create($item);
                $invoice->recalculateTotal();
            });

            return $invoice;
        }

        if ($invoice->status === 'paid') {
            return $this->createSupplementaryInvoice($invoice, [$item], 'late_linked_service');
        }

        return null;
    }

    /**
     * The appointment's invoice, always resolved against the database.
     *
     * `$appointment->invoice` caches its result — including a null one — so a
     * caller that generates and then re-reads within a single request would
     * otherwise act on a stale answer.
     */
    private function invoiceFor(Appointment $appointment): ?Invoice
    {
        return $appointment->invoice()->first();
    }

    /** Append the current linked labs + procedures onto the appointment's existing invoice. */
    private function appendLinkedItems(Appointment $appointment, Invoice $invoice, ?User $actor = null): ?Invoice
    {
        $items = array_merge($this->labItems($appointment), $this->procedureItems($appointment));

        if (! $items) {
            return null;
        }

        if ($invoice->status === 'pending') {
            DB::transaction(function () use ($invoice, $items) {
                foreach ($items as $item) {
                    $invoice->items()->create($item);
                }
                $invoice->recalculateTotal();
            });

            return $invoice;
        }

        if ($invoice->status === 'paid') {
            return $this->createSupplementaryInvoice($invoice, $items, 'appointment_completion');
        }

        return null;
    }

    /** Open a fresh Pending invoice for an appointment and notify the patient. */
    private function createInvoice(Appointment $appointment, array $items, ?User $actor, string $source): Invoice
    {
        $invoice = DB::transaction(function () use ($appointment, $items, $actor, $source) {
            $invoice = Invoice::create([
                'patient_id' => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'branch_id' => $appointment->branch_id,
                'status' => 'pending',
                'issued_at' => now(),
            ]);

            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            $invoice->recalculateTotal();

            AuditLog::record([
                'actor_id' => $actor?->id,
                'actor_role' => $actor?->roles()->pluck('name')->join(','),
                'action' => 'INVOICE_AUTO_GENERATED',
                'object_type' => 'invoice',
                'object_id' => $invoice->id,
                'outcome' => 'success',
                'ip_address' => request()->ip(),
                'source' => $source,
            ]);

            return $invoice;
        });

        if ($appointment->patient) {
            Notification::create([
                'recipient_user_id' => $appointment->patient->user_id,
                'recipient_contact' => $appointment->patient->contact_number,
                'channel' => 'email',
                'template' => 'invoice_ready',
                'message' => "Your invoice for the visit on {$appointment->appointment_date->toDateString()} is ready to view and pay.",
                'related_type' => 'invoice',
                'related_id' => $invoice->id,
                'status' => 'queued',
            ]);
        }

        // Keep the caller's in-memory model in step with the database. Without
        // this, a process that books and then completes the same Appointment
        // instance still sees the stale null relation and raises a second full
        // invoice — double-charging the consultation.
        $appointment->setRelation('invoice', $invoice);

        return $invoice->load('items');
    }

    /**
     * Create a new Pending invoice for the given items, referencing the same
     * appointment and patient as the original. Used when the original invoice
     * is already Paid and more services arrive (late-linked or at completion).
     */
    private function createSupplementaryInvoice(Invoice $original, array $items, string $source): Invoice
    {
        $supp = DB::transaction(function () use ($original, $items) {
            $supp = Invoice::create([
                'patient_id' => $original->patient_id,
                'appointment_id' => $original->appointment_id,
                'branch_id' => $original->branch_id,
                'status' => 'pending',
                'issued_at' => now(),
            ]);

            foreach ($items as $item) {
                $supp->items()->create($item);
            }

            $supp->recalculateTotal();

            return $supp;
        });

        AuditLog::record([
            'actor_id' => null,
            'actor_role' => null,
            'action' => 'INVOICE_SUPPLEMENTARY_CREATED',
            'object_type' => 'invoice',
            'object_id' => $supp->id,
            'outcome' => 'success',
            'ip_address' => request()->ip(),
            'source' => $source,
        ]);

        $patient = $original->patient;

        if ($patient) {
            $label = count($items) === 1 ? $items[0]['description'] : 'additional services';
            $total = array_sum(array_column($items, 'amount'));
            Notification::create([
                'recipient_user_id' => $patient->user_id,
                'recipient_contact' => $patient->contact_number,
                'channel' => 'email',
                'template' => 'invoice_ready',
                'message' => "A supplementary invoice for {$label} ({$total} AUD) has been added to your account and is ready to pay.",
                'related_type' => 'invoice',
                'related_id' => $supp->id,
                'status' => 'queued',
            ]);
        }

        return $supp->load('items');
    }

    private function consultationItem(Appointment $appointment): array
    {
        // A General-practice doctor bills the General price; any other
        // specialization (Cardiology, Orthopaedics, …) bills Specialist.
        $specialization = strtolower(optional($appointment->doctor?->doctor)->specialization ?? '');
        $isSpecialist = ! Str::contains($specialization, ['general', 'gp', 'primary care']);

        return $this->pricedItem(
            $isSpecialist ? self::CONSULT_SPECIALIST : self::CONSULT_GENERAL,
            'consultation',
            $appointment,
        );
    }

    private function labItems(Appointment $appointment): array
    {
        return $appointment->labOrders()
            ->whereIn('status', ['requested', 'in_progress', 'completed'])
            ->get()
            ->map(fn ($lab) => $this->pricedItem($lab->test_type, 'lab_test', $appointment))
            ->all();
    }

    private function procedureItems(Appointment $appointment): array
    {
        return $appointment->procedureBookings()
            ->whereIn('status', ['requested', 'completed'])
            ->get()
            ->map(fn ($proc) => $this->pricedItem($proc->name, 'other', $appointment))
            ->all();
    }

    /** One invoice line: resolve the branch price for $name, or $0.00 if unmapped. */
    private function pricedItem(string $name, string $itemType, Appointment $appointment): array
    {
        $service = $this->resolveService($appointment->branch, $name);
        $price = $service ? (float) $service->price : 0.0;

        return [
            'description' => $service ? $service->name : $name,
            'item_type' => $itemType,
            'quantity' => 1,
            'unit_price' => $price,
            'amount' => $price,
        ];
    }

    private function resolveService($branch, string $name): ?Service
    {
        return Service::query()
            ->where('branch_id', $branch?->id)
            ->where('status', 'active')
            ->whereRaw('LOWER(name) = ?', [strtolower(trim($name))])
            ->first();
    }
}
