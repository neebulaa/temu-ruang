<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creating a survey list should need nothing but a name. The destination stays
 * (it is what distances are measured against) but is set from the list page
 * afterwards rather than being asked for up front.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_lists', function (Blueprint $table) {
            $table->dropColumn([
                'description', 'category', 'target_location',
                'budget_min', 'budget_max', 'survey_date', 'notes', 'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('survey_lists', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('category')->default('living');
            $table->string('target_location')->nullable();
            $table->decimal('budget_min', 15, 2)->nullable();
            $table->decimal('budget_max', 15, 2)->nullable();
            $table->date('survey_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('planning');
        });
    }
};
