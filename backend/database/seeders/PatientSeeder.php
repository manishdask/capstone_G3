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
}
