<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->unique()->constrained('staff')->cascadeOnDelete();
            $table->string('specialization');
            $table->string('qualification')->nullable();
            $table->decimal('consultation_fee', 8, 2)->nullable();
            $table->text('bio')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->timestamps();

            $table->index('specialization');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
