<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FR31 (patient-initiated requests): the requirement is that a DOCTOR orders a
 * test — patients have no route to the lab. The app had no patient request
 * path at all, which left the only two options as "patients cannot ask" or
 * "patients post straight to the lab queue", the second of which bypasses the
 * clinician entirely.
 *
 * This adds the approval gate instead. A patient request is stored as a real
 * lab order in a new `pending_approval` state, addressed to a doctor the
 * patient has actually seen. It is invisible to the laboratory and is not
 * billed until that doctor approves it, at which point it becomes an ordinary
 * `requested` order with the doctor as the clinical requester.
 *
 * `requested_by_user_id` records who asked (patient or clinician) separately
 * from `requester_staff_id`, which stays the clinically responsible doctor.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE lab_orders MODIFY status ENUM('pending_approval', 'requested', 'in_progress', 'completed', 'cancelled', 'declined') NOT NULL DEFAULT 'requested'");

        Schema::table('lab_orders', function (Blueprint $table) {
            $table->foreignId('requested_by_user_id')->nullable()->after('requester_staff_id')
                ->constrained('users')->nullOnDelete();
            $table->text('request_reason')->nullable()->after('test_type');
            $table->text('decision_note')->nullable()->after('request_reason');
            $table->dateTime('decided_at')->nullable()->after('decision_note');
            $table->foreignId('decided_by_staff_id')->nullable()->after('decided_at')
                ->constrained('staff')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('requested_by_user_id');
            $table->dropConstrainedForeignId('decided_by_staff_id');
            $table->dropColumn(['request_reason', 'decision_note', 'decided_at']);
        });

        DB::statement("ALTER TABLE lab_orders MODIFY status ENUM('requested', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'requested'");
    }
};
