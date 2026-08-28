<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->dateTime('issued_at');
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
