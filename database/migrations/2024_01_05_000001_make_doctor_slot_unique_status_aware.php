<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FR19 fix: the `doctor_slot_unique` backstop was status-blind.
 *
 * `AppointmentController::availability()` only counts `pending`/`confirmed`
 * appointments as booked, so once a visit was completed (or the patient
 * cancelled), the UI correctly offered that time again — but the unique index
 * still saw the old row and rejected the booking with a 409 forever. A slot was
 * effectively burned by its first appointment for the life of the database.
 *
 * The backstop itself is worth keeping exactly as documented (it is what makes
 * FR18's instant auto-confirm safe under concurrent requests), so rather than
 * dropping it, the index is narrowed to only the statuses that actually occupy
 * the doctor's time. MySQL has no partial indexes, so the standard equivalent
 * is a generated column that is NULL for terminal statuses — NULLs never
 * collide in a MySQL unique index, so cancelled/rejected/completed rows stop
 * blocking the slot while active ones still cannot double-book.
 */
return new class extends Migration
{
    public function up(): void
    {
        // The appointments_doctor_staff_id foreign key is currently leaning on
        // doctor_slot_unique for its own index, so give it a dedicated one
        // first — otherwise MySQL refuses the drop with error 1553.
        Schema::table('appointments', function ($table) {
            $table->index('doctor_staff_id', 'appointments_doctor_staff_id_index');
        });

        Schema::table('appointments', function ($table) {
            $table->dropUnique('doctor_slot_unique');
        });

        // NULL while the appointment no longer occupies the slot; otherwise a
        // deterministic key over the same three columns the old index used.
        DB::statement("
            ALTER TABLE appointments
            ADD COLUMN active_slot_key VARCHAR(64)
            GENERATED ALWAYS AS (
                CASE WHEN status IN ('pending', 'confirmed')
                     THEN CONCAT(doctor_staff_id, '|', appointment_date, '|', start_time)
                     ELSE NULL
                END
            ) STORED
        ");

        Schema::table('appointments', function ($table) {
            $table->unique('active_slot_key', 'doctor_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function ($table) {
            $table->dropUnique('doctor_slot_unique');
        });

        DB::statement('ALTER TABLE appointments DROP COLUMN active_slot_key');

        Schema::table('appointments', function ($table) {
            $table->unique(['doctor_staff_id', 'appointment_date', 'start_time'], 'doctor_slot_unique');
            $table->dropIndex('appointments_doctor_staff_id_index');
        });
    }
};
