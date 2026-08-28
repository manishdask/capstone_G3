<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The frontend's feedback screens (already built, part of the delivered
 * scaffold) need a star rating and branch grouping — the original data
 * dictionary's Feedback entity didn't carry either. Both are simple
 * supporting fields for the existing review/feedback feature, not a new module.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('doctor_staff_id');
            $table->foreignId('branch_id')->nullable()->after('patient_id')->constrained('branches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn('rating');
        });
    }
};
