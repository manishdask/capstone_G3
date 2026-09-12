<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->foreignId('bed_id')->constrained('beds')->restrictOnDelete();
            $table->foreignId('admitting_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->dateTime('admitted_at');
            $table->dateTime('discharged_at')->nullable();
            $table->enum('status', ['admitted', 'discharged', 'transferred'])->default('admitted');
            $table->text('discharge_summary')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['patient_id', 'admitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};
