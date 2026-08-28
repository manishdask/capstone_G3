<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_order_id')->constrained('lab_orders')->cascadeOnDelete();
            $table->foreignId('technician_staff_id')->constrained('staff')->restrictOnDelete();
            $table->text('result_details')->nullable();
            // File stored outside the public webroot; served through an authorised, audited route.
            $table->string('file_path')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->dateTime('verified_at')->nullable();
            $table->dateTime('released_at')->nullable();
            $table->timestamps();

            $table->index('lab_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};
