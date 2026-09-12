<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('batch_number')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('threshold')->default(10);
            $table->date('expiry_date');
            $table->string('supplier')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'expiry_date']);
            $table->index(['branch_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
