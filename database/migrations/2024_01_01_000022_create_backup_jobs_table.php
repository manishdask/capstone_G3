<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('database');
            $table->dateTime('started_at');
            $table->dateTime('ended_at')->nullable();
            $table->enum('status', ['running', 'success', 'failed'])->default('running');
            $table->string('location_ref')->nullable();
            $table->text('verification_notes')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_jobs');
    }
};
