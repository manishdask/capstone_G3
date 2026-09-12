<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->enum('staff_type', [
                'doctor', 'nurse', 'receptionist', 'pharmacist',
                'lab_technician', 'branch_manager', 'admin',
            ]);
            $table->string('designation')->nullable();
            $table->string('registration_no')->nullable()->unique();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index(['branch_id', 'staff_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
