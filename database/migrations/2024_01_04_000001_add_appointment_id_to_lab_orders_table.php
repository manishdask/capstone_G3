<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FR37: link lab orders to the appointment they belong to so a completed
 * visit's invoice can itemise its tests. Additive — existing lab orders keep a
 * NULL appointment_id and behave exactly as before.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            $table->foreignId('appointment_id')->nullable()->after('branch_id')
                ->constrained('appointments')->nullOnDelete();
            $table->index('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropIndex(['appointment_id']);
            $table->dropColumn('appointment_id');
        });
    }
};