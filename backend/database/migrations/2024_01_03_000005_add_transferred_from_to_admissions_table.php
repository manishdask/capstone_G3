<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FR52 (proposed): a transfer closes the current admission row and opens a
 * new one for the new bed, rather than overwriting bed_id in place — this
 * column chains the two so the full bed history for a stay stays queryable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->foreignId('transferred_from_id')->nullable()->after('bed_id')
                ->constrained('admissions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transferred_from_id');
        });
    }
};
