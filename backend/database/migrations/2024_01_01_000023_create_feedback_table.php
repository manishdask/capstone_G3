<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('doctor_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('comment');
            // Sentiment is advisory only (FR47); the original comment is always retained.
            $table->enum('sentiment', ['positive', 'neutral', 'negative'])->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
