<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FR37: procedure bookings performed as part of a visit/admission — imaging,
 * minor procedures etc. Linked to an appointment and priced from the branch
 * `services` list when an invoice for the visit is generated.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procedure_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->string('name'); // mirrors a service price-list name, e.g. "X-Ray"
            $table->foreignId('requested_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->enum('status', ['requested', 'completed', 'cancelled'])->default('requested');
            $table->dateTime('performed_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'appointment_id']);
            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procedure_bookings');
    }
};