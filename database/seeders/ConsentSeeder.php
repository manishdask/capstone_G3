<?php

namespace Database\Seeders;

use App\Models\Consent;
use App\Models\Patient;
use Illuminate\Database\Seeder;

/**
 * FR49: backfills the baseline privacy-notice consent for patients that
 * existed before consent capture was wired into registration. New
 * registrations grant this automatically (see AuthController::register).
 */
class ConsentSeeder extends Seeder
{
    public function run(): void
    {
        Patient::whereDoesntHave('consents')->get()->each(function (Patient $patient) {
            Consent::create([
                'patient_id' => $patient->id,
                'purpose' => Consent::PURPOSE_PRIVACY_NOTICE,
                'notice_version' => Consent::CURRENT_NOTICE_VERSION,
                'state' => 'granted',
                'changed_at' => $patient->created_at ?? now(),
            ]);
        });
    }
}
