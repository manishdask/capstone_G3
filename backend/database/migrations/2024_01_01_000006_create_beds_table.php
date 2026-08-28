<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->string('ward');
            $table->string('room_number');
            $table->string('bed_number');
            $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
            $table->timestamps();

            $table->unique(['branch_id', 'ward', 'room_number', 'bed_number']);
            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beds');
    }
};
