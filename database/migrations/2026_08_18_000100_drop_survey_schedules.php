<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Drops visit scheduling.
 *
 * TemuRuang records a survey that already happened; deciding *when* to go is
 * something the user's own calendar does better. The schedule screen, the route
 * planner and the place "Jadwal" tab all went with it.
 *
 * A place that had a visit marked "visited" is folded into `is_surveyed` first,
 * so nothing the user actually recorded is lost.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('survey_schedules')) {
            return;
        }

        $visited = DB::table('survey_schedules')
            ->where('status', 'visited')
            ->pluck('survey_place_id')
            ->unique();

        if ($visited->isNotEmpty()) {
            DB::table('survey_places')
                ->whereIn('id', $visited)
                ->where('is_surveyed', false)
                ->update([
                    'is_surveyed' => true,
                    'surveyed_at' => now(),
                ]);
        }

        Schema::drop('survey_schedules');
    }

    public function down(): void
    {
        Schema::create('survey_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->string('status')->default('scheduled');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['survey_place_id', 'scheduled_at']);
        });
    }
};
