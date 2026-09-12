<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** FR54 (proposed): daily ward observation log feeding the generated discharge summary. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ward_observations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained('admissions')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->restrictOnDelete();
            $table->dateTime('observed_at');
            $table->decimal('temperature_celsius', 4, 1)->nullable();
            $table->unsignedSmallInteger('pulse_bpm')->nullable();
            $table->unsignedSmallInteger('respiratory_rate')->nullable();
            $table->string('blood_pressure', 12)->nullable();
            $table->unsignedTinyInteger('spo2_percent')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['admission_id', 'observed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ward_observations');
    }
};
