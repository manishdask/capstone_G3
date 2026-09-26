<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FR20/FR33 fix: notifications were written to this table and never read by
 * anything. There was no dispatcher, no in-app surface and no way to tell a
 * delivered message from one that had merely been recorded — every row sat at
 * `queued` forever.
 *
 * This adds what delivery needs to be honest about itself:
 *  - `in_app` as a first-class channel, so the bell in the app is a real
 *    notification rather than a second copy of the email;
 *  - `read_at`, so the in-app list can show what is new;
 *  - `failure_reason` and `attempts`, so a message that could not be sent says
 *    why (e.g. no SMS provider configured) instead of silently claiming success.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE notifications MODIFY channel ENUM('sms', 'email', 'push', 'in_app') NOT NULL DEFAULT 'in_app'");

        Schema::table('notifications', function (Blueprint $table) {
            $table->dateTime('read_at')->nullable()->after('sent_at');
            $table->string('failure_reason')->nullable()->after('read_at');
            $table->unsignedSmallInteger('attempts')->default(0)->after('failure_reason');

            $table->index(['recipient_user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        // The composite index below ends up serving the recipient_user_id
        // foreign key, so dropping it outright fails with MySQL error 1553.
        // Give the key a dedicated index to fall back on first.
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('recipient_user_id', 'notifications_recipient_user_id_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['recipient_user_id', 'read_at']);
            $table->dropColumn(['read_at', 'failure_reason', 'attempts']);
        });

        DB::statement("ALTER TABLE notifications MODIFY channel ENUM('sms', 'email', 'push') NOT NULL DEFAULT 'email'");
    }
};
