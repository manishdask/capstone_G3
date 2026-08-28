<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_contact')->nullable();
            $table->enum('channel', ['sms', 'email', 'push'])->default('email');
            $table->string('template')->nullable();
            $table->text('message')->nullable();
            $table->string('related_type')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->enum('status', ['queued', 'sent', 'failed'])->default('queued');
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->index(['related_type', 'related_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
