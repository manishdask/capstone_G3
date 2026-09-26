<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FR40: record which gateway took a payment, in what currency, when it
 * settled, and why an attempt failed. All columns are nullable so existing
 * payment rows stay valid untouched.
 *
 * The same change as hand-runnable SQL (the server has no shell) lives in
 * database/manual/2024_01_07_stripe_payments.sql.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider', 20)->nullable()->after('gateway_reference');
            $table->char('currency', 3)->nullable()->after('amount');
            $table->dateTime('paid_at')->nullable()->after('received_at');
            $table->string('failure_reason', 255)->nullable()->after('paid_at');
            $table->index(['invoice_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['invoice_id', 'status']);
            $table->dropColumn(['provider', 'currency', 'paid_at', 'failure_reason']);
        });
    }
};
