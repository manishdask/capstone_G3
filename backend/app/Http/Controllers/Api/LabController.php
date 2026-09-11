<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\Notification;
use App\Models\Role;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * FR31-FR35: lab test requests, result upload, release notifications, patient access.
 */
class LabController extends Controller
{
    /**
     * FR35: authorised search by patient, branch, type, date and status.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LabOrder::query()->with(['patient', 'requester.user', 'results']);

        if ($user->hasRole(Role::PATIENT)) {
            // A patient may only ever see their own orders, regardless of query params.
            $query->where('patient_id', $user->patient?->id);
        } else {
            $query->when($request->filled('patient_id'), fn ($q) => $q->where('patient_id', $request->integer('patient_id')));
        }

        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('test_type'), fn ($q) => $q->where('test_type', $request->string('test_type')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('requested_at', $request->date('date')));

        return response()->json($query->orderByDesc('requested_at')->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR31: doctors create laboratory or imaging test requests for patients.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'test_type' => ['required', 'string', 'max:255'],
        ]);

        $order = LabOrder::create($data + [
            'requester_staff_id' => $request->user()->staff?->id,
            'status' => 'requested',
            'requested_at' => now(),
        ]);

        // Late-linked to an already-completed, invoiced appointment? Add it to
        // the existing (Pending) invoice or spawn a supplementary one (Paid).
        if ($order->appointment_id) {
            $appointment = Appointment::find($order->appointment_id);
            if ($appointment) {
                app(BillingService::class)->attachItemToCompletedAppointment(
                    $appointment,
                    $order->test_type,
                    'lab_test',
                );
            }
        }

        return response()->json(['data' => $order], 201);
    }

    /**
     * FR32: lab technicians record results and upload authorised reports.
     * Files are stored on the private disk, outside the public webroot.
     */
    public function uploadResult(Request $request, LabOrder $order)
    {
        $data = $request->validate([
            'result_details' => ['required', 'string'],
            'file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
        ]);

        $path = $request->hasFile('file')
            ? $request->file('file')->store('lab-results', 'local')
            : null;

        $result = LabResult::create([
            'lab_order_id' => $order->id,
            'technician_staff_id' => $request->user()->staff?->id,
            'result_details' => $data['result_details'],
            'file_path' => $path,
        ]);

        $order->update(['status' => 'in_progress']);

        return response()->json(['data' => $result], 201);
    }

    /**
     * FR33: an authorised verifier releases a result — notifies doctor and patient.
     */
    public function release(Request $request, LabResult $result)
    {
        $result->update([
            'verified_by' => $request->user()->staff?->id,
            'verified_at' => now(),
            'released_at' => now(),
        ]);

        $result->labOrder->update(['status' => 'completed']);
        $order = $result->labOrder()->with('patient', 'requester.user')->first();

        foreach ([$order->patient?->user_id, $order->requester?->user_id] as $recipientId) {
            if ($recipientId) {
                Notification::create([
                    'recipient_user_id' => $recipientId,
                    'channel' => 'email',
                    'template' => 'lab_result_released',
                    'message' => "Lab result for order #{$order->id} ({$order->test_type}) is now available.",
                    'related_type' => 'lab_result',
                    'related_id' => $result->id,
                    'status' => 'queued',
                ]);
            }
        }

        return response()->json(['data' => $result->fresh()]);
    }

    /**
     * FR34: patients securely view/download their own released reports.
     */
    public function download(Request $request, LabResult $result)
    {
        $order = $result->labOrder;
        $user = $request->user();

        $isOwner = $user->hasRole(Role::PATIENT) && $user->patient?->id === $order->patient_id;
        $isStaff = $user->staff !== null;

        if (! $isOwner && ! $isStaff) {
            abort(403);
        }

        if ($isOwner && ! $result->released_at) {
            abort(403, 'This result has not been released yet.');
        }

        if (! $result->file_path || ! Storage::disk('local')->exists($result->file_path)) {
            abort(404, 'No report file is attached to this result.');
        }

        return Storage::disk('local')->download($result->file_path);
    }
}
