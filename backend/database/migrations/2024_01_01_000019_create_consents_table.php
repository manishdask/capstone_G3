<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->string('purpose');
            $table->string('notice_version');
            $table->enum('state', ['granted', 'withdrawn'])->default('granted');
            $table->dateTime('changed_at');
            $table->timestamps();

            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};
