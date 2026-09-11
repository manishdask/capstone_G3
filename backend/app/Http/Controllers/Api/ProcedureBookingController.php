<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ProcedureBooking;
use App\Models\Role;
use App\Services\BillingService;
use Illuminate\Http\Request;

/**
 * FR37: procedures (imaging, minor procedures, …) recorded against a visit so a
 * completed appointment's invoice itemises them. Staff-facing; patients never
 * create procedures.
 */
class ProcedureBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = ProcedureBooking::query()->with(['patient.user', 'appointment', 'branch']);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }
        if ($request->filled('appointment_id')) {
            $query->where('appointment_id', $request->integer('appointment_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->orderByDesc('id')->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $booking = ProcedureBooking::create($data + [
            'requested_by' => $request->user()?->staff?->id,
            'status' => 'requested',
        ]);

        // Late-linked to an already-completed, invoiced appointment? Add it to
        // the existing (Pending) invoice or spawn a supplementary one (Paid).
        if ($booking->appointment_id) {
            $appointment = Appointment::find($booking->appointment_id);
            if ($appointment) {
                app(BillingService::class)->attachItemToCompletedAppointment(
                    $appointment,
                    $booking->name,
                    'other',
                );
            }
        }

        return response()->json(['data' => $booking->load('branch', 'appointment')], 201);
    }

    /** Mark a procedure performed; anything billed on a completed visit reflects this. */
    public function updateStatus(Request $request, ProcedureBooking $booking)
    {
        $data = $request->validate([
            'status' => ['required', 'in:completed,cancelled'],
        ]);

        $booking->update([
            'status' => $data['status'],
            'performed_at' => $data['status'] === 'completed' ? now() : $booking->performed_at,
        ]);

        return response()->json(['data' => $booking->fresh()]);
    }
}