<?php

namespace Tests\Support;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;

/**
 * Builds the cast the brief asks every workflow to be proven against:
 * two patients, two doctors in one branch, a third doctor in a second branch,
 * and a lab technician per branch. Everything is created through the real
 * models so the tests exercise the same relationships the API does.
 *
 * Nothing here is hardcoded into application code — ids are always read back
 * from the objects this fixture returns.
 */
trait CareTeamFixture
{
    protected Branch $nsw;

    protected Branch $vic;

    /** Doctors: two at NSW (so "wrong doctor" is observable), one at VIC. */
    protected Staff $doctorA;

    protected Staff $doctorB;

    protected Staff $doctorVic;

    protected Staff $labTechNsw;

    protected Staff $labTechVic;

    protected Staff $receptionist;

    protected Patient $patientOne;

    protected Patient $patientTwo;

    protected function seedCareTeam(): void
    {
        foreach (Role::ALL as $name) {
            Role::firstOrCreate(['name' => $name]);
        }

        $this->nsw = Branch::create([
            'name' => 'Test Kogarah', 'state' => 'NSW', 'address' => '1 Test St',
            'contact_number' => '02 0000 0000', 'capacity' => 50, 'status' => 'active',
            'email' => 'nsw@test.local',
        ]);

        $this->vic = Branch::create([
            'name' => 'Test Melbourne', 'state' => 'VIC', 'address' => '2 Test St',
            'contact_number' => '03 0000 0000', 'capacity' => 40, 'status' => 'active',
            'email' => 'vic@test.local',
        ]);

        $this->doctorA = $this->makeDoctor($this->nsw, 'Dr A Nsw', 'doctor.a@test.local');
        $this->doctorB = $this->makeDoctor($this->nsw, 'Dr B Nsw', 'doctor.b@test.local');
        $this->doctorVic = $this->makeDoctor($this->vic, 'Dr C Vic', 'doctor.c@test.local');

        $this->labTechNsw = $this->makeStaff($this->nsw, 'lab_technician', Role::LAB_TECHNICIAN, 'Lab Nsw', 'lab.nsw@test.local');
        $this->labTechVic = $this->makeStaff($this->vic, 'lab_technician', Role::LAB_TECHNICIAN, 'Lab Vic', 'lab.vic@test.local');
        $this->receptionist = $this->makeStaff($this->nsw, 'receptionist', Role::RECEPTIONIST, 'Recep Nsw', 'recep.nsw@test.local');

        $this->patientOne = $this->makePatient($this->nsw, 'Pat', 'One', 'patient.one@test.local');
        $this->patientTwo = $this->makePatient($this->nsw, 'Pat', 'Two', 'patient.two@test.local');

        foreach ([$this->nsw, $this->vic] as $branch) {
            foreach ([['General Consultation', 80], ['Specialist Consultation', 150], ['Full Blood Count', 45]] as [$name, $price]) {
                Service::create(['branch_id' => $branch->id, 'name' => $name, 'price' => $price, 'status' => 'active']);
            }
        }
    }

    protected function makeDoctor(Branch $branch, string $name, string $email): Staff
    {
        $staff = $this->makeStaff($branch, 'doctor', Role::DOCTOR, $name, $email);

        Doctor::create([
            'staff_id' => $staff->id,
            'specialization' => 'General Medicine',
            'gender' => 'female',
            'qualification' => 'MBBS',
            'consultation_fee' => 80,
        ]);

        Schedule::create([
            'staff_id' => $staff->id,
            'branch_id' => $branch->id,
            'day_of_week' => null,
            'schedule_date' => null,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'type' => 'availability',
        ]);

        return $staff;
    }

    protected function makeStaff(Branch $branch, string $type, string $roleName, string $name, string $email): Staff
    {
        $user = User::create([
            'branch_id' => $branch->id,
            'name' => $name,
            'username' => str_replace(['@', '.'], '_', $email),
            'email' => $email,
            'password' => 'Password123!',
            'status' => 'active',
        ]);

        $user->roles()->attach(Role::where('name', $roleName)->first()->id, [
            'effective_from' => now()->toDateString(),
        ]);

        return Staff::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'staff_type' => $type,
            'designation' => $roleName,
            'status' => 'active',
        ]);
    }

    protected function makePatient(Branch $branch, string $first, string $last, string $email): Patient
    {
        $user = User::create([
            'branch_id' => $branch->id,
            'name' => "$first $last",
            'username' => str_replace(['@', '.'], '_', $email),
            'email' => $email,
            'password' => 'Password123!',
            'status' => 'active',
        ]);

        $user->roles()->attach(Role::where('name', Role::PATIENT)->first()->id, [
            'effective_from' => now()->toDateString(),
        ]);

        $patient = Patient::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'global_patient_id' => 'PENDING-'.$user->id,
            'first_name' => $first,
            'last_name' => $last,
            'date_of_birth' => '1990-01-01',
            'gender' => 'female',
            'contact_number' => '0400000000',
            'email' => $email,
            'status' => 'active',
        ]);

        $patient->update(['global_patient_id' => sprintf('SGH-PT-%06d', $patient->id)]);

        return $patient;
    }

    /** Books directly through the model, bypassing the API, for arrange steps. */
    protected function bookFor(Patient $patient, Staff $doctor, string $date, string $start = '10:00', string $status = 'confirmed'): Appointment
    {
        return Appointment::create([
            'patient_id' => $patient->id,
            'doctor_staff_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'appointment_date' => $date,
            'start_time' => $start,
            'end_time' => date('H:i', strtotime($start) + 1800),
            'status' => $status,
            'reason' => 'Test visit',
            'created_by' => $patient->user_id,
        ]);
    }
}
