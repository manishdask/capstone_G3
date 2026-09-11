<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentRequest;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\Role;
use App\Models\Staff;
use App\Services\BillingService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR16-FR20: booking, doctor availability, transactional conflict prevention,
 * queued confirmation/reminder notifications.
 *
 * NOTE — documented deviation from FR18: the SRS baseline says receptionists
 * "approve" appointments. Under an approved change, a booking whose slot is
 * genuinely free (FR19 transactional check + unique index) is confirmed
 * INSTANTLY and a confirmation notification is queued, with no manual approval
 * gate. Staff retain modify/cancel/reject + actor/reason recording via
 * updateStatus(), and completion now auto-generates the itemised invoice
 * (FR37) via BillingService. See FR_PROGRESS.md "Appointment booking" section.
 */
class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Appointment::query()->with(['patient', 'doctor.user', 'branch']);

        if ($user->hasRole(Role::PATIENT)) {
            $query->where('patient_id', $user->patient?->id);
        } elseif ($user->hasRole(Role::DOCTOR) && $user->staff) {
            $query->where('doctor_staff_id', $user->staff->id);
        } elseif ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->orderByDesc('appointment_date')->orderByDesc('start_time')
            ->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR17: current doctor availability by date/time — schedules minus already-booked slots.
     */
    public function availability(Request $request, Staff $doctor)
    {
        $date = $request->filled('date') ? \Carbon\Carbon::parse($request->string('date')->value()) : today();

        $schedules = $doctor->schedules()
            ->whereIn('type', ['availability', 'shift'])
            ->where(fn ($q) => $q->whereDate('schedule_date', $date)->orWhereNull('schedule_date'))
            ->get(['start_time', 'end_time']);

        $booked = $doctor->appointments()
            ->whereDate('appointment_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get(['start_time', 'end_time']);

        return response()->json([
            'data' => [
                'doctor_staff_id' => $doctor->id,
                'date' => $date->toDateString(),
                'schedules' => $schedules,
                'booked_slots' => $booked,
            ],
        ]);
    }

    /**
     * FR16/FR19: patient books an appointment with an available doctor. The
     * transactional conflict check rejects overlapping slots for the same
     * doctor, and the appointment is confirmed INSTANTLY when the slot is free
     * (approved deviation from FR18's manual receptionist approval gate). A
     * unique DB index is the hard backstop against races even under concurrent
     * requests. FR20 confirmation notification is queued immediately.
     */
    public function store(AppointmentRequest $request)
    {
        $data = $request->validated();
        $patient = $request->user()->patient;

        if (! $patient) {
            abort(422, 'Only a registered patient can book an appointment.');
        }

        try {
            $appointment = DB::transaction(function () use ($data, $patient, $request) {
                $conflict = Appointment::where('doctor_staff_id', $data['doctor_staff_id'])
                    ->where('appointment_date', $data['appointment_date'])
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('start_time', '<', $data['end_time'])
                    ->where('end_time', '>', $data['start_time'])
                    ->lockForUpdate()
                    ->exists();

                if ($conflict) {
                    abort(409, 'That time slot is no longer available.');
                }

                return Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_staff_id' => $data['doctor_staff_id'],
                    'branch_id' => $data['branch_id'],
                    'appointment_date' => $data['appointment_date'],
                    'start_time' => $data['start_time'],
                    'end_time' => $data['end_time'],
                    'status' => 'confirmed', // instant confirmation — slot is free (FR19 passed)
                    'reason' => $data['reason'] ?? null,
                    'created_by' => $request->user()->id,
                ]);
            });
        } catch (QueryException $e) {
            // Backstop: unique(doctor_staff_id, appointment_date, start_time) tripped by a race.
            return response()->json([
                'message' => 'That time slot is no longer available.',
                'alternatives' => $this->suggestAlternatives($data),
            ], 409);
        }

        $this->notifyAppointment($appointment, 'confirmed');

        // FR36: invoice the consultation immediately so the patient sees a bill
        // right after booking and can pay. Completion appends labs/procedures.
        $invoice = app(BillingService::class)->generateForBooking($appointment, $request->user());

        return response()->json([
            'data' => $appointment->load('doctor.user', 'branch'),
            'invoice_id' => $invoice?->id,
        ], 201);
    }

    /**
     * FR18 (retained tools): receptionist/doctor/admin modifies, rejects or
     * cancels an appointment, recording actor (audit middleware) and reason.
     * FR20: queues a confirmation/reminder notification on a valid state change.
     * FR37: marking an appointment COMPLETED appends appointment-linked labs and
     * procedures to the booking invoice (or issues a supplementary one if it was
     * already paid) via BillingService — the consultation is never double-charged.
     * Rejecting/cancelling voids any unpaid Pending booking invoice.
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'status' => ['required', 'in:confirmed,rejected,cancelled,completed'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        // A patient reaches this route only to cancel their own booking — every
        // other transition (confirm/reject/complete) stays a staff action, and
        // one patient must never touch another's appointment.
        if ($user->hasRole(Role::PATIENT)) {
            if ($appointment->patient_id !== $user->patient?->id) {
                abort(403, 'You are not authorised to perform this action.');
            }

            if ($data['status'] !== 'cancelled') {
                abort(403, 'You can only cancel your own appointment.');
            }

            if (in_array($appointment->status, ['completed', 'cancelled', 'rejected'], true)) {
                abort(422, 'This appointment can no longer be cancelled.');
            }
        }

        $appointment->update([
            'status' => $data['status'],
            'cancellation_reason' => in_array($data['status'], ['rejected', 'cancelled'])
                ? ($data['reason'] ?? null)
                : $appointment->cancellation_reason,
        ]);

        $this->notifyAppointment($appointment, $data['status']);

        // If the booking is rejected/cancelled, drop any unpaid Pending invoice
        // so the patient is never asked to pay for a visit that won't happen.
        if (in_array($data['status'], ['rejected', 'cancelled'])) {
            $this->voidPendingBookingInvoice($appointment);
        }

        // Auto-bill the completed visit (FR36/FR37): appends appointment-linked
        // labs/procedures to the booking invoice, or issues a supplementary
        // invoice if the booking was already paid. Consultation is never
        // double-charged.
        $invoice = $data['status'] === 'completed'
            ? app(BillingService::class)->generateForAppointment($appointment, $request->user())
            : null;

        return response()->json([
            'data' => $appointment->fresh(),
            'invoice_id' => $invoice?->id,
        ]);
    }

    /** FR20: queue one confirmation/reminder notification for a status change. */
    private function notifyAppointment(Appointment $appointment, string $status): void
    {
        Notification::create([
            'recipient_user_id' => $appointment->patient?->user_id,
            'recipient_contact' => $appointment->patient?->contact_number,
            'channel' => 'email',
            'template' => 'appointment_'.$status,
            'message' => "Your appointment on {$appointment->appointment_date->toDateString()} was {$status}.",
            'related_type' => 'appointment',
            'related_id' => $appointment->id,
            'status' => 'queued',
        ]);
    }

    /** Remove an unpaid Pending booking invoice when its appointment is cancelled/rejected. */
    private function voidPendingBookingInvoice(Appointment $appointment): void
    {
        $invoice = $appointment->invoice;

        if ($invoice && $invoice->status === 'pending' && $invoice->payments()->count() === 0) {
            $invoice->items()->delete();
            $invoice->delete();
        }
    }

    private function suggestAlternatives(array $data): array
    {
        $taken = Appointment::where('doctor_staff_id', $data['doctor_staff_id'])
            ->where('appointment_date', $data['appointment_date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('start_time')
            ->all();

        $duration = strtotime($data['end_time']) - strtotime($data['start_time']);
        $cursor = strtotime($data['end_time']);
        $suggestions = [];

        for ($i = 0; $i < 3; $i++) {
            $slot = date('H:i', $cursor);

            if (! in_array($slot, $taken, true)) {
                $suggestions[] = $slot;
            }

            $cursor += $duration;
        }

        return $suggestions;
    }
}
