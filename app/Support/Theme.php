<?php

namespace App\Support;

/**
 * Warna aksen yang bisa dipilih pengguna.
 *
 * Sengaja daftar tertutup, bukan pemilih warna bebas. Dua alasannya nyata:
 *
 *  1. Kontras. Tombol utama memakai teks putih di atas aksen; setiap warna di
 *     sini sudah diperiksa mencapai minimal 4:1. Warna bebas membuat pengguna
 *     bisa memilih kuning muda dan membuat tombolnya tak terbaca.
 *  2. Logo. Tandanya berkas raster, jadi setiap warna butuh berkas turunannya
 *     sendiri yang dibuat lebih dulu oleh `tools/build-icons.php`.
 *
 * `soft` dipakai sebagai latar tenang (sorotan tabel, lencana), `ink` sebagai
 * teks di atas `soft` maupun di atas permukaan terang.
 */
class Theme
{
    public const DEFAULT = 'coral';

    /** @var array<string, array{label: string, accent: string, soft: string, ink: string}> */
    public const THEMES = [
        'coral' => ['label' => 'Coral', 'accent' => '#d94440', 'soft' => '#ffeceb', 'ink' => '#b93b39'],
        'grape' => ['label' => 'Anggur', 'accent' => '#7c62e8', 'soft' => '#eeeaff', 'ink' => '#5b45d6'],
        'blossom' => ['label' => 'Sakura', 'accent' => '#cf4770', 'soft' => '#ffe8ee', 'ink' => '#a8355a'],
        'sky' => ['label' => 'Langit', 'accent' => '#2183bd', 'soft' => '#e3f2fc', 'ink' => '#1a6a99'],
        'mint' => ['label' => 'Mint', 'accent' => '#128f77', 'soft' => '#dcf5ef', 'ink' => '#0d7361'],
        'butter' => ['label' => 'Madu', 'accent' => '#9c6d08', 'soft' => '#fdf1d9', 'ink' => '#7d5706'],
        'peach' => ['label' => 'Persik', 'accent' => '#c85b28', 'soft' => '#ffe9dd', 'ink' => '#a34820'],
    ];

    public static function resolve(?string $key): string
    {
        return isset(self::THEMES[$key]) ? $key : self::DEFAULT;
    }

    /** @return array{label: string, accent: string, soft: string, ink: string} */
    public static function colours(?string $key): array
    {
        return self::THEMES[self::resolve($key)];
    }

    /**
     * Menimpa token aksen di `:root`.
     *
     * Ditulis langsung ke dokumen oleh Blade, bukan lewat JavaScript, supaya
     * halaman tidak sempat berkedip dengan warna bawaan lebih dulu.
     */
    public static function cssVariables(?string $key): string
    {
        $colours = self::colours($key);

        return sprintf(
            ':root{--color-accent:%s;--color-accent-soft:%s;--color-accent-ink:%s}',
            $colours['accent'],
            $colours['soft'],
            $colours['ink'],
        );
    }

    /** Bentuk yang dipakai React untuk menggambar pemilih tema. */
    public static function options(): array
    {
        return collect(self::THEMES)
            ->map(fn (array $theme, string $key) => [
                'value' => $key,
                'label' => $theme['label'],
                'accent' => $theme['accent'],
                'soft' => $theme['soft'],
            ])
            ->values()
            ->all();
    }
}
