<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('photo');
            $table->string('category')->default('other');
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->string('caption')->nullable();
            $table->boolean('is_cover')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['survey_place_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
