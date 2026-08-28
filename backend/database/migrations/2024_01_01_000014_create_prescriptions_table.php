<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('medical_record_id')->nullable()->constrained('medical_records')->nullOnDelete();
            $table->foreignId('prescriber_staff_id')->constrained('staff')->restrictOnDelete();
            $table->enum('status', ['active', 'dispensed', 'cancelled'])->default('active');
            $table->dateTime('issued_at');
            $table->timestamps();

            $table->index(['patient_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
