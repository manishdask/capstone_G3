<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->date('schedule_date')->nullable();
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('type', ['availability', 'shift', 'leave'])->default('availability');
            $table->timestamps();

            // Doctor+time lookups for availability/conflict checks (SRS 5.2).
            $table->index(['staff_id', 'schedule_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
