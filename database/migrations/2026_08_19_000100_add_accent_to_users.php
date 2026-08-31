<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Warna aksen pilihan pengguna.
 *
 * Menyimpan kunci tema (`coral`, `mint`, …), bukan nilai heksadesimal: warnanya
 * sendiri hidup di App\Support\Theme, jadi paletnya bisa disetel ulang tanpa
 * memigrasi data siapa pun.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('accent', 20)->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('accent');
        });
    }
};
