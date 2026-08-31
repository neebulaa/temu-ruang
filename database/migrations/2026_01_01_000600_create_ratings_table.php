<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->string('criteria');
            $table->unsignedTinyInteger('score');
            $table->timestamps();

            $table->unique(['survey_place_id', 'criteria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
