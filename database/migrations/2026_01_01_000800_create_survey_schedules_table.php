<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            // scheduled | visited | skipped | rescheduled
            $table->string('status')->default('scheduled');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['survey_place_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_schedules');
    }
};
