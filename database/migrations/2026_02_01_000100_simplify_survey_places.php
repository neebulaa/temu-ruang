<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Trims a Survey Place down to the fields that actually get filled in:
 * name, surveyed toggle, location, contact, facilities, price range,
 * source link, notes and media.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_places', function (Blueprint $table) {
            $table->string('contact')->nullable()->after('address');
            $table->decimal('price_min', 15, 2)->nullable()->after('source_url');
            $table->decimal('price_max', 15, 2)->nullable()->after('price_min');
            $table->boolean('is_surveyed')->default(false)->after('longitude');
            $table->text('notes')->nullable()->after('is_surveyed');
        });

        // Carry the old values across before the columns disappear.
        DB::table('survey_places')->orderBy('id')->each(function ($place) {
            $contact = collect([$place->phone, $place->website])
                ->filter(fn ($value) => filled($value))
                ->implode(' · ');

            DB::table('survey_places')->where('id', $place->id)->update([
                'contact' => $contact ?: null,
                'price_min' => $place->price,
                'is_surveyed' => in_array($place->status, ['visited', 'reviewed', 'selected'], true),
                'notes' => $place->description,
            ]);
        });

        // Fold the separate notes rows into the place's single notes field.
        if (Schema::hasTable('notes')) {
            DB::table('notes')->orderBy('survey_place_id')->get()
                ->groupBy('survey_place_id')
                ->each(function ($rows, $placeId) {
                    $place = DB::table('survey_places')->find($placeId);

                    if (! $place) {
                        return;
                    }

                    $lines = $rows->map(fn ($note) => match ($note->type) {
                        'pro' => "+ {$note->body}",
                        'con' => "- {$note->body}",
                        default => $note->body,
                    })->implode("\n");

                    DB::table('survey_places')->where('id', $placeId)->update([
                        'notes' => trim(($place->notes ? $place->notes."\n\n" : '').$lines),
                    ]);
                });
        }

        Schema::table('survey_places', function (Blueprint $table) {
            $table->dropColumn([
                'category', 'description', 'source', 'phone',
                'website', 'price', 'price_period', 'status',
            ]);
        });

        Schema::dropIfExists('notes');
    }

    public function down(): void
    {
        Schema::table('survey_places', function (Blueprint $table) {
            $table->string('category')->nullable()->after('name');
            $table->text('description')->nullable();
            $table->string('source')->default('manual');
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->string('price_period')->default('month');
            $table->string('status')->default('not_surveyed');

            $table->dropColumn(['contact', 'price_min', 'price_max', 'is_surveyed', 'notes']);
        });

        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_place_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('general');
            $table->text('body');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }
};
