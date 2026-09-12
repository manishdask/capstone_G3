<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('requester_staff_id')->constrained('staff')->restrictOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->string('test_type');
            $table->enum('status', ['requested', 'in_progress', 'completed', 'cancelled'])->default('requested');
            $table->dateTime('requested_at');
            $table->timestamps();

            $table->index(['patient_id', 'requested_at']);
            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_orders');
    }
};
