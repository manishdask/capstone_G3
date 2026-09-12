<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Role;
use App\Services\DuplicatePatientDetector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR11-FR15: patient registration, global patient ID, role-scoped record access.
 *
 * Prototype scope note: full "assigned-patient" clinical scoping (SRS 6.2) is
 * deferred — any authenticated staff role may access any patient record, while
 * a Patient-role user may only ever access their own. This matches the SRS's
 * allowance for the student prototype to prioritise core end-to-end workflows.
 */
class PatientController extends Controller
{
    public function index(Request $request)
    {
        $patients = Patient::query()
            ->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search')->value().'%';
                $q->where(function ($q) use ($term) {
                    $q->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('global_patient_id', 'like', $term);
                });
            })
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return response()->json($patients);
    }

    /**
     * FR11: receptionist registers a patient using validated demographic details.
     * FR12: assigns one globally unique patient ID across all branches.
     */
    public function store(Request $request, DuplicatePatientDetector $duplicateDetector)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'contact_number' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string', 'max:2000'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
        ]);

        $patient = DB::transaction(function () use ($data) {
            $patient = Patient::create($data + ['global_patient_id' => 'PENDING']);
            $patient->update(['global_patient_id' => sprintf('SGH-PT-%06d', $patient->id)]);

            return $patient;
        });

        // FR62: possible-duplicate review — never blocks registration itself.
        $duplicateDetector->detectAndFlag($patient);

        return response()->json(['data' => $patient], 201);
    }

    public function show(Request $request, Patient $patient)
    {
        $this->ensureAccess($request, $patient);

        return response()->json(['data' => $patient->load('branch')]);
    }

    /**
     * FR13: allow authorised staff to update only the patient fields permitted
     * for their role; patients may update their own contact details only.
     */
    public function update(Request $request, Patient $patient)
    {
        $this->ensureAccess($request, $patient);

        $isPatientSelf = $request->user()->hasRole(Role::PATIENT);

        $rules = $isPatientSelf
            ? [
                'contact_number' => ['sometimes', 'string', 'max:30'],
                'email' => ['sometimes', 'nullable', 'email', 'max:255'],
                'address' => ['sometimes', 'nullable', 'string'],
                'emergency_contact_name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'emergency_contact_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            ]
            : [
                'contact_number' => ['sometimes', 'string', 'max:30'],
                'email' => ['sometimes', 'nullable', 'email', 'max:255'],
                'address' => ['sometimes', 'nullable', 'string'],
                'allergies' => ['sometimes', 'nullable', 'string', 'max:2000'],
                'emergency_contact_name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'emergency_contact_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
                'status' => ['sometimes', 'in:active,inactive'],
            ];

        $patient->update($request->validate($rules));

        return response()->json(['data' => $patient]);
    }

    /**
     * FR14/FR15: preserved medical history, visible to the owning patient or authorised staff.
     */
    public function medicalRecords(Request $request, Patient $patient)
    {
        $this->ensureAccess($request, $patient);

        return response()->json([
            'data' => $patient->medicalRecords()->with('author.user')->latest()->paginate(20),
        ]);
    }

    private function ensureAccess(Request $request, Patient $patient): void
    {
        $user = $request->user();

        if ($user->hasRole(Role::PATIENT) && $user->patient?->id !== $patient->id) {
            abort(403, 'You are not authorised to view this record.');
        }
    }
}
