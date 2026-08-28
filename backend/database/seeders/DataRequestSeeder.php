<?php

namespace Database\Seeders;

use App\Models\DataRequest;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/** FR61 (proposed) — a couple of synthetic demo requests. */
class DataRequestSeeder extends Seeder
{
    public function run(): void
    {
        $patients = Patient::inRandomOrder()->limit(2)->get();
        if ($patients->isEmpty()) {
            return;
        }

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', Role::ADMIN))->first();

        DataRequest::firstOrCreate(
            ['patient_id' => $patients[0]->id, 'type' => 'access'],
            ['details' => 'Please provide a copy of all my medical records held at this branch.', 'status' => 'pending']
        );

        if ($patients->count() > 1 && $admin) {
            DataRequest::firstOrCreate(
                ['patient_id' => $patients[1]->id, 'type' => 'correction'],
                [
                    'details' => 'My date of birth is recorded incorrectly — please correct to match my passport.',
                    'identity_verified' => true,
                    'status' => 'approved',
                    'assigned_to' => $admin->id,
                    'decision_notes' => 'Verified against submitted ID; demographic record corrected.',
                    'decided_by' => $admin->id,
                    'decided_at' => now()->subDays(2),
                ]
            );
        }
    }
}
