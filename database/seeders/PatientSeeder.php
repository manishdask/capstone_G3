<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Synthetic demo patients only (SRS 2.4) — no real patient data.
 */
class PatientSeeder extends Seeder
{
    private const DEMO_PASSWORD = 'Password123!';

    public function run(): void
    {
        $branches = Branch::all();
        $patientRole = Role::where('name', Role::PATIENT)->first();

        // One fixed patient per branch so the demo instructions can name a login
        // that survives a re-seed — a faker-derived address cannot be written
        // down. The remaining patients stay random, for realistic list volume.
        $fixed = $branches->map(fn ($branch) => [
            'branch' => $branch,
            'first' => 'Demo',
            'last' => "Patient {$branch->state}",
            'email' => "patient.{$branch->state}@example.test",
            // A known allergy keeps the FR63 dispense-conflict path demonstrable.
            'allergies' => 'Penicillin',
        ])->all();

        foreach ($fixed as $person) {
            $this->createPatient(
                $person['branch'],
                $patientRole,
                $person['first'],
                $person['last'],
                $person['email'],
                $person['allergies'],
            );
        }

        foreach (range(1, 15) as $i) {
            $branch = $branches->random();
            $firstName = fake()->firstName();
            $lastName = fake()->lastName();
            $email = strtolower(Str::slug("{$firstName}.{$lastName}{$i}")).'@example.test';

            $user = User::create([
                'branch_id' => $branch->id,
                'name' => "{$firstName} {$lastName}",
                'username' => Str::slug($email, '.'),
                'email' => $email,
                'password' => self::DEMO_PASSWORD,
                'status' => 'active',
            ]);

            $user->roles()->attach($patientRole->id, ['effective_from' => now()->toDateString()]);

            $patient = Patient::create([
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'global_patient_id' => 'PENDING',
                'first_name' => $firstName,
                'last_name' => $lastName,
                'date_of_birth' => fake()->dateTimeBetween('-80 years', '-2 years')->format('Y-m-d'),
                'gender' => fake()->randomElement(['male', 'female', 'other']),
                'contact_number' => fake()->numerify('04## ### ###'),
                'email' => $email,
                'address' => fake()->address(),
                'allergies' => fake()->boolean(30) ? fake()->randomElement(['Penicillin', 'Peanuts', 'Latex', 'None known']) : null,
                'status' => 'active',
            ]);

            $patient->update(['global_patient_id' => sprintf('SGH-PT-%06d', $patient->id)]);
        }
    }

    private function createPatient(Branch $branch, Role $patientRole, string $firstName, string $lastName, string $email, ?string $allergies): void
    {
        $user = User::create([
            'branch_id' => $branch->id,
            'name' => "{$firstName} {$lastName}",
            'username' => Str::slug($email, '.'),
            'email' => $email,
            'password' => self::DEMO_PASSWORD,
            'status' => 'active',
        ]);

        $user->roles()->attach($patientRole->id, ['effective_from' => now()->toDateString()]);

        $patient = Patient::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'global_patient_id' => 'PENDING',
            'first_name' => $firstName,
            'last_name' => $lastName,
            'date_of_birth' => '1988-04-17',
            'gender' => 'female',
            'contact_number' => fake()->numerify('04## ### ###'),
            'email' => $email,
            'address' => fake()->address(),
            'allergies' => $allergies,
            'status' => 'active',
        ]);

        $patient->update(['global_patient_id' => sprintf('SGH-PT-%06d', $patient->id)]);
    }
}
