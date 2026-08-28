<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Bed;
use App\Models\Patient;
use App\Models\Staff;
use App\Models\WardObservation;
use Illuminate\Database\Seeder;

/** FR52/FR54 (proposed) — a demo in-progress admission with a couple of ward observations. */
class AdmissionSeeder extends Seeder
{
    public function run(): void
    {
        $patient = Patient::first();
        $bed = Bed::where('status', 'available')->first();
        $nurse = Staff::where('staff_type', 'nurse')->first();

        if (! $patient || ! $bed || ! $nurse) {
            return;
        }

        $admission = Admission::firstOrCreate(
            ['patient_id' => $patient->id, 'bed_id' => $bed->id, 'status' => 'admitted'],
            ['branch_id' => $bed->branch_id, 'admitting_staff_id' => $nurse->id, 'admitted_at' => now()->subHours(6)]
        );

        if ($admission->wasRecentlyCreated) {
            $bed->update(['status' => 'occupied']);

            WardObservation::create([
                'admission_id' => $admission->id,
                'staff_id' => $nurse->id,
                'observed_at' => now()->subHours(4),
                'temperature_celsius' => 37.1,
                'pulse_bpm' => 82,
                'respiratory_rate' => 16,
                'blood_pressure' => '122/78',
                'spo2_percent' => 98,
                'notes' => 'Stable, resting comfortably.',
            ]);

            WardObservation::create([
                'admission_id' => $admission->id,
                'staff_id' => $nurse->id,
                'observed_at' => now()->subHours(1),
                'temperature_celsius' => 36.9,
                'pulse_bpm' => 76,
                'respiratory_rate' => 15,
                'blood_pressure' => '118/76',
                'spo2_percent' => 99,
                'notes' => 'Improving, tolerating oral fluids.',
            ]);
        }
    }
}
