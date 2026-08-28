<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('author_staff_id')->constrained('staff')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->enum('record_type', ['consultation', 'diagnosis', 'note', 'vitals'])->default('consultation');
            $table->text('diagnosis')->nullable();
            $table->text('treatment_notes')->nullable();
            $table->text('content')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->index(['patient_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};
