<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->integer('quantity');
            $table->enum('type', ['stock_in', 'dispense', 'adjustment', 'purchase_order'])->default('stock_in');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference')->nullable();
            $table->string('notes')->nullable();
            // Append-only ledger of stock movements; no updated_at.
            $table->timestamp('created_at')->useCurrent();

            $table->index(['branch_id', 'medicine_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
