<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\ProcedureBooking;
use App\Models\Role;
use App\Models\Staff;
use App\Services\BillingService;
use Illuminate\Database\Seeder;

/**
 * Synthetic demo data only (SRS 2.4) — never real patient, clinical or payment
 * data. Every other seeder builds the *reference* data (branches, staff,
 * patients, medicines, price lists); nothing seeded appointments, invoices,
 * prescriptions or lab orders, so a freshly seeded database showed an entirely
 * empty patient portal. This seeder fills that gap so the demo flows have
 * something to show before anyone clicks anything.
 *
 * Invoices are produced through BillingService rather than inserted directly,
 * so the seeded data exercises the same FR36/FR37 code path the app uses and
 * can never drift from it.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $billing = app(BillingService::class);

        foreach (Patient::with('user')->get()->groupBy('branch_id') as $branchId => $patients) {
            $doctors = Staff::with('user', 'doctor')
                ->where('branch_id', $branchId)
                ->where('staff_type', 'doctor')
                ->get();

            $technician = $this->staffFor($branchId, Role::LAB_TECHNICIAN);

            if ($doctors->isEmpty()) {
                continue;
            }

            // The branch's fixed demo patient first — that is the login the
            // demo instructions name, so it must always have a history — then
            // one other. The rest stay clean, so the "no records yet" empty
            // states are still demonstrable.
            $ordered = $patients
                ->sortByDesc(fn ($p) => str_starts_with((string) $p->email, 'patient.'))
                ->values()
                ->take(2);

            foreach ($ordered as $index => $patient) {
                $doctor = $doctors[$index % $doctors->count()];

                $this->seedCompletedVisit($patient, $doctor, $technician, $billing);
                $this->seedUpcomingVisit($patient, $doctor, $billing, $index);
                $this->seedFeedback($patient, $doctor);
            }
        }
    }

    /**
     * A past visit, fully worked through: consultation invoiced at booking,
     * clinical note, prescription, lab order with a released result, a
     * procedure, then completion (which appends the labs/procedures).
     */
    private function seedCompletedVisit(Patient $patient, Staff $doctor, ?Staff $technician, BillingService $billing): void
    {
        $date = now()->subDays(9)->toDateString();

        if ($this->slotTaken($doctor, $date, '10:00:00')) {
            return;
        }

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_staff_id' => $doctor->id,
            'branch_id' => $patient->branch_id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'confirmed',
            'reason' => 'General check-up',
            'created_by' => $patient->user_id,
        ]);

        $billing->generateForBooking($appointment);

        $record = MedicalRecord::create([
            'patient_id' => $patient->id,
            'author_staff_id' => $doctor->id,
            'appointment_id' => $appointment->id,
            'record_type' => 'consultation',
            'diagnosis' => 'Routine review — no acute findings.',
            'treatment_notes' => 'Blood pressure within range. Continue current management and review in three months.',
            'content' => 'Patient reports feeling well. Routine bloods requested.',
            'version' => 1,
        ]);

        $this->seedPrescription($patient, $doctor, $record);

        $order = LabOrder::create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'requester_staff_id' => $doctor->id,
            'branch_id' => $patient->branch_id,
            'test_type' => 'Full Blood Count',
            'status' => 'completed',
            'requested_at' => now()->subDays(9),
        ]);

        if ($technician) {
            LabResult::create([
                'lab_order_id' => $order->id,
                'technician_staff_id' => $technician->id,
                'result_details' => 'All indices within normal reference range. No action required.',
                'verified_by' => $technician->id,
                'verified_at' => now()->subDays(8),
                'released_at' => now()->subDays(8),
            ]);
        }

        ProcedureBooking::create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'branch_id' => $patient->branch_id,
            'name' => 'X-Ray',
            'requested_by' => $doctor->id,
            'status' => 'completed',
            'performed_at' => now()->subDays(9),
        ]);

        // Completion appends the lab + procedure onto the booking invoice
        // (FR37) exactly as marking the visit completed does in the app.
        $appointment->update(['status' => 'completed']);
        $billing->generateForAppointment($appointment);
    }

    /** An upcoming confirmed visit with an unpaid consultation invoice to pay in the demo. */
    private function seedUpcomingVisit(Patient $patient, Staff $doctor, BillingService $billing, int $index): void
    {
        $date = now()->addDays(3 + $index)->toDateString();
        $start = sprintf('%02d:00:00', 14 + $index);

        if ($this->slotTaken($doctor, $date, $start)) {
            return;
        }

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_staff_id' => $doctor->id,
            'branch_id' => $patient->branch_id,
            'appointment_date' => $date,
            'start_time' => $start,
            'end_time' => sprintf('%02d:30:00', 14 + $index),
            'status' => 'confirmed',
            'reason' => 'Follow-up consultation',
            'created_by' => $patient->user_id,
        ]);

        $billing->generateForBooking($appointment);
    }

    private function seedPrescription(Patient $patient, Staff $doctor, MedicalRecord $record): void
    {
        $medicines = Medicine::where('branch_id', $patient->branch_id)->take(2)->get();

        if ($medicines->isEmpty()) {
            return;
        }

        $prescription = Prescription::create([
            'patient_id' => $patient->id,
            'medical_record_id' => $record->id,
            'prescriber_staff_id' => $doctor->id,
            'status' => 'active',
            'issued_at' => now()->subDays(9),
        ]);

        foreach ($medicines as $medicine) {
            PrescriptionItem::create([
                'prescription_id' => $prescription->id,
                'medicine_id' => $medicine->id,
                'dosage' => '1 tablet',
                'route' => 'oral',
                'frequency' => 'twice daily',
                'duration' => '7 days',
                'instructions' => 'Take after food.',
            ]);
        }
    }

    private function seedFeedback(Patient $patient, Staff $doctor): void
    {
        Feedback::create([
            'patient_id' => $patient->id,
            'branch_id' => $patient->branch_id,
            'doctor_staff_id' => $doctor->id,
            'comment' => 'Reception was quick and the doctor explained everything clearly.',
            'rating' => 5,
        ]);
    }

    private function staffFor(int $branchId, string $roleName): ?Staff
    {
        return Staff::where('branch_id', $branchId)
            ->whereHas('user.roles', fn ($q) => $q->where('name', $roleName))
            ->first();
    }

    /** Keeps the seeder re-runnable without tripping the FR19 slot unique index. */
    private function slotTaken(Staff $doctor, string $date, string $start): bool
    {
        return Appointment::where('doctor_staff_id', $doctor->id)
            ->where('appointment_date', $date)
            ->where('start_time', $start)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();
    }
}
