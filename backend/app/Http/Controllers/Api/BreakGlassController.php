<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BreakGlassSession;
use Illuminate\Http\Request;

/**
 * FR51 (proposed): privileged override for emergency access to a patient
 * record — a mandatory reason, a time-boxed grant, an immediate alert (the
 * audit log entry below), and a queue for retrospective compliance review.
 */
class BreakGlassController extends Controller
{
    private const SESSION_MINUTES = 30;

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $session = BreakGlassSession::create([
            'user_id' => $request->user()->id,
            'patient_id' => $data['patient_id'],
            'reason' => $data['reason'],
            'granted_at' => now(),
            'expires_at' => now()->addMinutes(self::SESSION_MINUTES),
            'status' => 'active',
        ]);

        // The alert FR51 requires: a distinctly-tagged, immediately visible
        // audit entry, on top of the retrospective review queue below.
        AuditLog::record([
            'actor_id' => $request->user()->id,
            'actor_role' => $request->user()->roles()->pluck('name')->join(','),
            'action' => 'BREAK_GLASS_ACCESS_GRANTED',
            'object_type' => 'patient',
            'object_id' => $data['patient_id'],
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return response()->json(['data' => $session->load('patient')], 201);
    }

    public function index(Request $request)
    {
        // Lazily expire sessions past their window before listing — no scheduler exists yet.
        BreakGlassSession::where('status', 'active')->where('expires_at', '<', now())->update(['status' => 'expired']);

        $query = BreakGlassSession::query()->with(['requester', 'patient', 'reviewer']);
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));

        return response()->json(['data' => $query->latest()->get()]);
    }

    /** Ends an active grant early — e.g. once the emergency has passed. */
    public function revoke(Request $request, BreakGlassSession $breakGlassSession)
    {
        if ($breakGlassSession->status !== 'active') {
            abort(422, 'This session is not active.');
        }

        $breakGlassSession->update(['status' => 'revoked', 'revoked_at' => now()]);

        return response()->json(['data' => $breakGlassSession]);
    }

    /** Retrospective compliance sign-off — independent of how the grant ended. */
    public function review(Request $request, BreakGlassSession $breakGlassSession)
    {
        $data = $request->validate([
            'review_notes' => ['required', 'string'],
        ]);

        $breakGlassSession->update([
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $data['review_notes'],
        ]);

        return response()->json(['data' => $breakGlassSession]);
    }
}
