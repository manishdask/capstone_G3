<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Bed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR52 (proposed): admit/transfer/discharge, preserving bed history — a
 * transfer closes the current admission row and opens a new one rather than
 * overwriting bed_id, so the full sequence of beds for a stay stays queryable.
 * FR53 (proposed): allocation is transactional with a row lock on the target
 * bed, so two concurrent admits/transfers can never land on the same bed.
 */
class AdmissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Admission::query()->with(['patient', 'bed', 'admittingStaff.user']);

        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        $query->when($request->filled('patient_id'), fn ($q) => $q->where('patient_id', $request->integer('patient_id')));

        return response()->json(['data' => $query->latest('admitted_at')->get()]);
    }

    public function show(Admission $admission)
    {
        $admission->load(['patient', 'bed', 'admittingStaff.user', 'transferredFrom', 'transferredTo', 'observations.staff.user']);

        return response()->json(['data' => $admission]);
    }

    public function admit(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'bed_id' => ['required', 'exists:beds,id'],
        ]);

        $admission = DB::transaction(function () use ($data, $request) {
            $bed = Bed::whereKey($data['bed_id'])->lockForUpdate()->firstOrFail();

            if ($bed->status !== 'available') {
                abort(422, 'That bed is not available.');
            }

            $admission = Admission::create([
                'patient_id' => $data['patient_id'],
                'branch_id' => $bed->branch_id,
                'bed_id' => $bed->id,
                'admitting_staff_id' => $request->user()->staff?->id,
                'admitted_at' => now(),
                'status' => 'admitted',
            ]);

            $bed->update(['status' => 'occupied']);

            return $admission;
        });

        return response()->json(['data' => $admission->load(['patient', 'bed'])], 201);
    }

    public function transfer(Request $request, Admission $admission)
    {
        $data = $request->validate([
            'bed_id' => ['required', 'exists:beds,id'],
        ]);

        if ($admission->status !== 'admitted') {
            abort(422, 'Only a currently-admitted stay can be transferred.');
        }

        if ((int) $data['bed_id'] === $admission->bed_id) {
            abort(422, 'That is the patient\'s current bed.');
        }

        $newAdmission = DB::transaction(function () use ($data, $admission, $request) {
            $newBed = Bed::whereKey($data['bed_id'])->lockForUpdate()->firstOrFail();

            if ($newBed->status !== 'available') {
                abort(422, 'The target bed is not available.');
            }

            $admission->update(['status' => 'transferred', 'discharged_at' => now()]);
            Bed::whereKey($admission->bed_id)->update(['status' => 'available']);

            $newAdmission = Admission::create([
                'patient_id' => $admission->patient_id,
                'branch_id' => $newBed->branch_id,
                'bed_id' => $newBed->id,
                'transferred_from_id' => $admission->id,
                'admitting_staff_id' => $request->user()->staff?->id,
                'admitted_at' => now(),
                'status' => 'admitted',
            ]);

            $newBed->update(['status' => 'occupied']);

            return $newAdmission;
        });

        return response()->json(['data' => $newAdmission->load(['patient', 'bed', 'transferredFrom'])]);
    }

    public function discharge(Request $request, Admission $admission)
    {
        $data = $request->validate([
            'discharge_summary' => ['nullable', 'string'],
        ]);

        if ($admission->status !== 'admitted') {
            abort(422, 'This stay is not currently admitted.');
        }

        DB::transaction(function () use ($data, $admission) {
            $admission->update([
                'status' => 'discharged',
                'discharged_at' => now(),
                'discharge_summary' => $data['discharge_summary'] ?? $this->generateDischargeSummary($admission),
            ]);

            Bed::whereKey($admission->bed_id)->update(['status' => 'available']);
        });

        return response()->json(['data' => $admission->fresh(['patient', 'bed', 'observations'])]);
    }

    /** FR54: builds a discharge summary from the admission timeline and its observation log. */
    private function generateDischargeSummary(Admission $admission): string
    {
        $admission->loadMissing(['bed', 'admittingStaff.user', 'observations' => fn ($q) => $q->orderByDesc('observed_at')]);

        $lines = [
            "Admitted {$admission->admitted_at->format('Y-m-d H:i')} to Bed {$admission->bed->bed_number} (Ward: {$admission->bed->ward}), under {$admission->admittingStaff?->user?->name}.",
        ];

        $count = $admission->observations->count();
        $lines[] = $count > 0
            ? "{$count} ward observation(s) recorded during this stay."
            : 'No ward observations were recorded during this stay.';

        $last = $admission->observations->first();
        if ($last) {
            $vitals = collect([
                $last->temperature_celsius !== null ? "Temp {$last->temperature_celsius}\u{00B0}C" : null,
                $last->pulse_bpm !== null ? "Pulse {$last->pulse_bpm} bpm" : null,
                $last->blood_pressure ? "BP {$last->blood_pressure}" : null,
                $last->spo2_percent !== null ? "SpO2 {$last->spo2_percent}%" : null,
            ])->filter()->implode(', ');

            if ($vitals !== '') {
                $lines[] = "Last recorded vitals ({$last->observed_at->format('Y-m-d H:i')}): {$vitals}.";
            }
        }

        $lines[] = 'Discharged '.now()->format('Y-m-d H:i').'.';

        return implode(' ', $lines);
    }
}
