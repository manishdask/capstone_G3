<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\WardObservation;
use Illuminate\Http\Request;

/** FR54 (proposed): daily ward observation log — feeds the auto-generated discharge summary. */
class WardObservationController extends Controller
{
    public function index(Admission $admission)
    {
        $observations = $admission->observations()->with('staff.user')->orderByDesc('observed_at')->get();

        return response()->json(['data' => $observations]);
    }

    public function store(Request $request, Admission $admission)
    {
        if ($admission->status !== 'admitted') {
            abort(422, 'Observations can only be logged against a currently-admitted stay.');
        }

        $data = $request->validate([
            'temperature_celsius' => ['nullable', 'numeric', 'between:30,45'],
            'pulse_bpm' => ['nullable', 'integer', 'between:20,250'],
            'respiratory_rate' => ['nullable', 'integer', 'between:5,60'],
            'blood_pressure' => ['nullable', 'string', 'max:12'],
            'spo2_percent' => ['nullable', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string'],
        ]);

        $observation = WardObservation::create([
            ...$data,
            'admission_id' => $admission->id,
            'staff_id' => $request->user()->staff?->id,
            'observed_at' => now(),
        ]);

        return response()->json(['data' => $observation->load('staff.user')], 201);
    }
}
