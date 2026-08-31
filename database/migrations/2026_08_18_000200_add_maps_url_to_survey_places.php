<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A place can carry the Google Maps link it was found at.
 *
 * Separate from `source_url` on purpose: the source is *where you found it*
 * (an Instagram post, a listing site), while this is the place itself on the
 * map. It also doubles as a location input — the link carries coordinates, so
 * pasting one can drop the pin without any paid Places lookup.
 *
 * Long column because Google's own share URLs carry a large `data=` blob.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_places', function (Blueprint $table) {
            $table->string('maps_url', 2048)->nullable()->after('source_url');
        });
    }

    public function down(): void
    {
        Schema::table('survey_places', function (Blueprint $table) {
            $table->dropColumn('maps_url');
        });
    }
};
