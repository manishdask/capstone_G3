<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** FR51 (proposed): privileged emergency-access override — mandatory reason, time-boxed, logged for retrospective review. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('break_glass_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->text('reason');
            $table->dateTime('granted_at');
            $table->dateTime('expires_at');
            $table->dateTime('revoked_at')->nullable();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['user_id']);
            $table->index(['patient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('break_glass_sessions');
    }
};
