<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            // general | pro | con
            $table->string('type')->default('general');
            $table->text('body');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['survey_place_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
