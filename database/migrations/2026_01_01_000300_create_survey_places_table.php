<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_places', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_list_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('source')->default('manual');
            $table->string('source_url')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->string('price_period')->default('month');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('status')->default('not_surveyed');
            $table->timestamp('surveyed_at')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['survey_list_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_places');
    }
};
