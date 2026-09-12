<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\Role;
use Illuminate\Http\Request;

/**
 * FR49: privacy notice/consent version, purpose, grant/withdrawal time and
 * evidence per patient. Each row is an immutable event (grant or withdrawal);
 * current status per purpose is simply the latest row — withdrawing never
 * deletes or overwrites the earlier grant (Appendix D: "withdrawal does not
 * erase the historical evidence").
 */
class ConsentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Consent::query()->with('patient')->orderByDesc('changed_at');

        if ($user->hasRole(Role::PATIENT)) {
            $query->where('patient_id', $user->patient?->id);
        } else {
            $query->when($request->filled('patient_id'), fn ($q) => $q->where('patient_id', $request->integer('patient_id')));
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * FR49: grant consent for a purpose (e.g. at registration, or later for a
     * new purpose such as marketing communications).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'purpose' => ['required', 'string', 'max:255'],
        ]);

        $this->authorizePatientAccess($request, (int) $data['patient_id']);

        $consent = Consent::create([
            'patient_id' => $data['patient_id'],
            'purpose' => $data['purpose'],
            'notice_version' => Consent::CURRENT_NOTICE_VERSION,
            'state' => 'granted',
            'changed_at' => now(),
        ]);

        return response()->json(['data' => $consent], 201);
    }

    /**
     * FR49: withdraw a previously granted purpose — writes a new withdrawal
     * event rather than mutating the grant it withdraws.
     */
    public function withdraw(Request $request, Consent $consent)
    {
        $this->authorizePatientAccess($request, $consent->patient_id);

        $withdrawal = Consent::create([
            'patient_id' => $consent->patient_id,
            'purpose' => $consent->purpose,
            'notice_version' => $consent->notice_version,
            'state' => 'withdrawn',
            'changed_at' => now(),
        ]);

        return response()->json(['data' => $withdrawal], 201);
    }

    private function authorizePatientAccess(Request $request, int $patientId): void
    {
        $user = $request->user();

        if ($user->hasRole(Role::PATIENT) && $user->patient?->id !== $patientId) {
            abort(403, 'You are not authorised to manage consent for this patient.');
        }
    }
}
