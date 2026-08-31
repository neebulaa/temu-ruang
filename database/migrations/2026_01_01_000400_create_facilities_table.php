<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            // Null user_id marks a shared preset available to everyone.
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('icon')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
        });

        Schema::create('facility_survey_place', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['facility_id', 'survey_place_id'], 'facility_place_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facility_survey_place');
        Schema::dropIfExists('facilities');
    }
};
