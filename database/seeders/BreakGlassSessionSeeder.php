<?php

namespace Database\Seeders;

use App\Models\BreakGlassSession;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/** FR51 (proposed) — a couple of synthetic demo emergency-access grants. */
class BreakGlassSessionSeeder extends Seeder
{
    public function run(): void
    {
        $patients = Patient::inRandomOrder()->limit(2)->get();
        $doctor = User::whereHas('roles', fn ($q) => $q->where('name', Role::DOCTOR))->first();
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', Role::ADMIN))->first();

        if ($patients->isEmpty() || ! $doctor) {
            return;
        }

        BreakGlassSession::firstOrCreate(
            ['user_id' => $doctor->id, 'patient_id' => $patients[0]->id, 'status' => 'active'],
            [
                'reason' => 'Patient presented unconscious to Emergency; treating clinician needs immediate history access.',
                'granted_at' => now()->subMinutes(5),
                'expires_at' => now()->addMinutes(25),
            ]
        );

        if ($patients->count() > 1 && $admin) {
            BreakGlassSession::firstOrCreate(
                ['user_id' => $doctor->id, 'patient_id' => $patients[1]->id, 'status' => 'expired'],
                [
                    'reason' => 'On-call cover for another branch — needed medication history before prescribing overnight.',
                    'granted_at' => now()->subDays(3),
                    'expires_at' => now()->subDays(3)->addMinutes(30),
                    'reviewed_by' => $admin->id,
                    'reviewed_at' => now()->subDays(2),
                    'review_notes' => 'Reviewed — consistent with on-call roster for that night. No action needed.',
                ]
            );
        }
    }
}
