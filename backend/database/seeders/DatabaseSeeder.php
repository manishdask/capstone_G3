<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Synthetic development/test data only (SRS 2.4) — never real patient,
 * clinical or payment data. Demo accounts share the password "Password123!".
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            BranchSeeder::class,
            StaffSeeder::class,
            PatientSeeder::class,
            MedicineSeeder::class,
            ConsentSeeder::class,
            DataRequestSeeder::class,
            DuplicatePatientFlagSeeder::class,
            BreakGlassSessionSeeder::class,
            BedSeeder::class,
            AdmissionSeeder::class,
            BackupJobSeeder::class,
            SettingSeeder::class,
            DepartmentSeeder::class,
            ServiceSeeder::class,
        ]);
    }
}
