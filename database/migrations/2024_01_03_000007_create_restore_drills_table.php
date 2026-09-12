<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** FR58 (proposed): admin-triggered restore drill against a completed backup, with its result recorded. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restore_drills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backup_job_id')->constrained('backup_jobs')->cascadeOnDelete();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['passed', 'failed'])->default('failed');
            $table->text('verification_notes')->nullable();
            $table->dateTime('ran_at');
            $table->timestamps();

            $table->index('backup_job_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restore_drills');
    }
};
