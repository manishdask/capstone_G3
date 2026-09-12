<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Doctor;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Synthetic demo staff only (SRS 2.4). All accounts share the demo password
 * "Password123!" — never used with real credentials or real patient data.
 */
class StaffSeeder extends Seeder
{
    private const DEMO_PASSWORD = 'Password123!';

    public function run(): void
    {
        $branches = Branch::all();
        $roles = Role::all()->keyBy('name');

        $admin = $this->makeUser($branches->first(), 'System Administrator', 'admin@stgeorge.test');
        $this->attachRole($admin, $roles[Role::ADMIN]);
        Staff::create([
            'user_id' => $admin->id,
            'branch_id' => $branches->first()->id,
            'staff_type' => 'admin',
            'designation' => 'System Administrator',
            'status' => 'active',
        ]);

        $specializations = ['Cardiology', 'Paediatrics', 'Orthopaedics', 'General Medicine', 'Dermatology'];

        foreach ($branches as $index => $branch) {
            $manager = $this->makeUser($branch, "Branch Manager {$branch->state}", "manager.{$branch->state}@stgeorge.test");
            $this->attachRole($manager, $roles[Role::BRANCH_MANAGER]);
            Staff::create([
                'user_id' => $manager->id,
                'branch_id' => $branch->id,
                'staff_type' => 'branch_manager',
                'designation' => 'Branch Manager',
                'status' => 'active',
            ]);

            foreach ([Role::RECEPTIONIST, Role::NURSE, Role::PHARMACIST, Role::LAB_TECHNICIAN] as $roleName) {
                $type = match ($roleName) {
                    Role::RECEPTIONIST => 'receptionist',
                    Role::NURSE => 'nurse',
                    Role::PHARMACIST => 'pharmacist',
                    Role::LAB_TECHNICIAN => 'lab_technician',
                };

                // Display names stay synthetic/random so the UI looks real, but
                // the LOGIN is derived from role + branch state so every demo
                // account is predictable and survives a re-seed. A faker-derived
                // email cannot be written down in the demo instructions.
                $name = fake()->name();
                $user = $this->makeUser($branch, $name, "{$type}.{$branch->state}@stgeorge.test");
                $this->attachRole($user, $roles[$roleName]);
                Staff::create([
                    'user_id' => $user->id,
                    'branch_id' => $branch->id,
                    'staff_type' => $type,
                    'designation' => $roleName,
                    'status' => 'active',
                ]);
            }

            foreach (range(1, 2) as $i) {
                $gender = fake()->randomElement(['male', 'female']);
                $firstName = $gender === 'male' ? fake()->firstNameMale() : fake()->firstNameFemale();
                $name = 'Dr. '.$firstName.' '.fake()->lastName();
                $user = $this->makeUser($branch, $name, "doctor{$i}.{$branch->state}@stgeorge.test");
                $this->attachRole($user, $roles[Role::DOCTOR]);

                $staff = Staff::create([
                    'user_id' => $user->id,
                    'branch_id' => $branch->id,
                    'staff_type' => 'doctor',
                    'designation' => 'Consultant',
                    'registration_no' => 'MED-'.fake()->unique()->numerify('######'),
                    'status' => 'active',
                ]);

                Doctor::create([
                    'staff_id' => $staff->id,
                    'specialization' => $specializations[($index + $i) % count($specializations)],
                    'gender' => $gender,
                    'qualification' => 'MBBS, FRACP',
                    'consultation_fee' => fake()->randomElement([80, 100, 120, 150]),
                    'bio' => fake()->sentence(12),
                ]);

                // schedule_date left null = recurring daily availability window,
                // so booking works on any date the patient picks, not just today.
                Schedule::create([
                    'staff_id' => $staff->id,
                    'branch_id' => $branch->id,
                    'day_of_week' => null,
                    'schedule_date' => null,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'type' => 'availability',
                ]);
            }
        }
    }

    private function makeUser(Branch $branch, string $name, string $email): User
    {
        return User::firstOrCreate(
            ['email' => $email],
            [
                'branch_id' => $branch->id,
                'name' => $name,
                'username' => Str::slug($email, '.'),
                'password' => self::DEMO_PASSWORD,
                'status' => 'active',
            ]
        );
    }

    private function attachRole(User $user, Role $role): void
    {
        if (! $user->roles()->where('role_id', $role->id)->exists()) {
            $user->roles()->attach($role->id, ['effective_from' => now()->toDateString()]);
        }
    }
}
