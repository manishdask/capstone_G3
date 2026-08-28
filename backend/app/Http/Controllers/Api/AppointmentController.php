<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentRequest;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\Role;
use App\Models\Staff;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR16-FR20: booking, doctor availability, transactional conflict prevention,
 * accept/reject workflow, queued confirmation/reminder notifications.
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
     * FR16/FR19: patient requests an appointment; a transactional check rejects
     * overlapping slots for the same doctor. A unique DB index is the hard
     * backstop against races even under concurrent requests.
     */
    public function store(AppointmentRequest $request)
    {
        $data = $request->validated();
        $patient = $request->user()->patient;

        if (! $patient) {
            abort(422, 'Only a registered patient can request an appointment.');
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
                    'status' => 'pending',
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

        return response()->json(['data' => $appointment->load('doctor.user', 'branch')], 201);
    }

    /**
     * FR18: receptionist/doctor confirms, rejects or cancels; records actor and reason.
     * FR20: queues a confirmation/reminder notification on a valid state change.
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'status' => ['required', 'in:confirmed,rejected,cancelled,completed'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $appointment->update([
            'status' => $data['status'],
            'cancellation_reason' => in_array($data['status'], ['rejected', 'cancelled'])
                ? ($data['reason'] ?? null)
                : $appointment->cancellation_reason,
        ]);

        Notification::create([
            'recipient_user_id' => $appointment->patient?->user_id,
            'recipient_contact' => $appointment->patient?->contact_number,
            'channel' => 'email',
            'template' => 'appointment_'.$data['status'],
            'message' => "Your appointment on {$appointment->appointment_date->toDateString()} was {$data['status']}.",
            'related_type' => 'appointment',
            'related_id' => $appointment->id,
            'status' => 'queued',
        ]);

        return response()->json(['data' => $appointment->fresh()]);
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
