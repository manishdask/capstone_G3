<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SRS 3.2 explicitly requires gender-wise doctor filtration for appointment
 * booking; the doctors table had no field to filter on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('specialization');
        });
    }

    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn('gender');
        });
    }
};
