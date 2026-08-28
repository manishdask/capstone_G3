<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Services\DuplicatePatientDetector;
use Illuminate\Database\Seeder;

/**
 * FR62 (proposed) demo data: clones one existing patient with a near-identical
 * name/DOB/contact, then runs the real detector against it so the admin
 * review screen has a realistic flag to work with (not a hand-faked row).
 */
class DuplicatePatientFlagSeeder extends Seeder
{
    public function run(): void
    {
        $original = Patient::where('status', 'active')->first();
        if (! $original) {
            return;
        }

        // Look for an existing clone (excluding the original itself) before
        // creating another — firstOrCreate() would otherwise just match the
        // original's own row, since its search key is drawn from that row.
        $clone = Patient::where('id', '!=', $original->id)
            ->where('contact_number', $original->contact_number)
            ->where('date_of_birth', $original->date_of_birth)
            ->first();

        if (! $clone) {
            $clone = Patient::create([
                'branch_id' => $original->branch_id,
                'global_patient_id' => 'PENDING',
                'first_name' => $original->first_name,
                'last_name' => $original->last_name,
                'date_of_birth' => $original->date_of_birth,
                'gender' => $original->gender,
                'contact_number' => $original->contact_number,
                'email' => null,
                'status' => 'active',
            ]);
            $clone->update(['global_patient_id' => sprintf('SGH-PT-%06d', $clone->id)]);
        }

        app(DuplicatePatientDetector::class)->detectAndFlag($clone);
    }
}
