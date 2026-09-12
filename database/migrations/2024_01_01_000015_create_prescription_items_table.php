<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->string('dosage');
            $table->string('route')->nullable();
            $table->string('frequency');
            $table->string('duration')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index('prescription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
