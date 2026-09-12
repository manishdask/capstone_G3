<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataRequest;
use App\Models\Role;
use Illuminate\Http\Request;

/**
 * FR61 (proposed): patient access/correction requests — identity
 * verification, staff assignment, decision and audit trail. AuditMiddleware
 * already logs every write here (actor, action, object, outcome).
 */
class DataRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DataRequest::query()->with(['patient', 'assignee', 'decider']);

        if ($user->hasRole(Role::PATIENT)) {
            $query->where('patient_id', $user->patient?->id);
        } else {
            $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        }

        return response()->json($query->latest()->paginate($request->integer('per_page', 20)));
    }

    /** FR61: patient submits an access or correction request. */
    public function store(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient;

        if (! $patient) {
            abort(422, 'Only a registered patient can submit a data request.');
        }

        $data = $request->validate([
            'type' => ['required', 'in:access,correction'],
            'details' => ['required', 'string', 'max:2000'],
        ]);

        $dataRequest = DataRequest::create($data + [
            'patient_id' => $patient->id,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $dataRequest], 201);
    }

    /**
     * FR61: staff picks up a pending request — records who is handling it
     * and confirms the requester's identity before any decision can be made.
     */
    public function assign(Request $request, DataRequest $dataRequest)
    {
        $data = $request->validate([
            'identity_verified' => ['required', 'boolean'],
        ]);

        $dataRequest->update([
            'assigned_to' => $request->user()->id,
            'identity_verified' => $data['identity_verified'],
            'status' => 'in_review',
        ]);

        return response()->json(['data' => $dataRequest->fresh(['patient', 'assignee'])]);
    }

    /** FR61: authorised staff records the decision. */
    public function decide(Request $request, DataRequest $dataRequest)
    {
        if (! $dataRequest->identity_verified) {
            abort(422, 'Identity must be verified before a decision can be recorded.');
        }

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'decision_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $dataRequest->update([
            'status' => $data['status'],
            'decision_notes' => $data['decision_notes'] ?? null,
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        return response()->json(['data' => $dataRequest->fresh(['patient', 'assignee', 'decider'])]);
    }
}
