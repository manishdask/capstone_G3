<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** FR62 (proposed): possible-duplicate patient detection, pending authorised review before merge. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_duplicate_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('matched_patient_id')->constrained('patients')->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->enum('status', ['pending', 'dismissed', 'merged'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['patient_id', 'matched_patient_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_duplicate_flags');
    }
};
