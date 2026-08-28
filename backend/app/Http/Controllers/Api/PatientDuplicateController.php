<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientDuplicateFlag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR62 (proposed): authorised review of possible-duplicate patient records
 * before any merge — nothing is merged automatically.
 */
class PatientDuplicateController extends Controller
{
    /** Tables carrying a direct patient_id foreign key that a merge must reassign. */
    private const PATIENT_OWNED_TABLES = [
        'appointments', 'medical_records', 'admissions', 'lab_orders',
        'prescriptions', 'invoices', 'consents', 'feedback', 'data_requests',
    ];

    public function index(Request $request)
    {
        $query = PatientDuplicateFlag::query()->with(['patient', 'matchedPatient', 'reviewer']);

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')),
            fn ($q) => $q->where('status', 'pending'));

        return response()->json(['data' => $query->latest()->get()]);
    }

    /** Reviewed and judged not a duplicate — leaves both patient records untouched. */
    public function dismiss(Request $request, PatientDuplicateFlag $patientDuplicateFlag)
    {
        $patientDuplicateFlag->update([
            'status' => 'dismissed',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['data' => $patientDuplicateFlag]);
    }

    /**
     * Confirms the duplicate: reassigns every clinical/financial record from
     * the losing patient to the surviving one, then deactivates (never
     * deletes) the losing record so history stays intact and auditable.
     */
    public function merge(Request $request, PatientDuplicateFlag $patientDuplicateFlag)
    {
        $data = $request->validate([
            'primary_patient_id' => ['required', 'exists:patients,id'],
        ]);

        $primaryId = (int) $data['primary_patient_id'];
        $pair = [$patientDuplicateFlag->patient_id, $patientDuplicateFlag->matched_patient_id];

        if (! in_array($primaryId, $pair, true)) {
            abort(422, 'The chosen primary patient must be one of the two flagged records.');
        }

        $loserId = $pair[0] === $primaryId ? $pair[1] : $pair[0];

        DB::transaction(function () use ($primaryId, $loserId, $patientDuplicateFlag, $request) {
            foreach (self::PATIENT_OWNED_TABLES as $table) {
                DB::table($table)->where('patient_id', $loserId)->update(['patient_id' => $primaryId]);
            }

            Patient::whereKey($loserId)->update(['status' => 'inactive']);

            $patientDuplicateFlag->update([
                'status' => 'merged',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'notes' => "Merged into patient #{$primaryId}; patient #{$loserId} deactivated.",
            ]);
        });

        return response()->json(['data' => $patientDuplicateFlag->fresh(['patient', 'matchedPatient'])]);
    }
}
