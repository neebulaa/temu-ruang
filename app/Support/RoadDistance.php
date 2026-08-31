<?php

namespace App\Support;

use App\Models\Destination;
use App\Models\SurveyList;
use App\Models\SurveyPlace;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Jarak jalan sebenarnya dari tiap tempat ke tujuan daftarnya.
 *
 * Haversine di TemuRuang::distanceKm() mengukur garis lurus. Untuk memutuskan
 * "mana yang paling dekat dari kampus", yang dirasakan orang adalah jarak jalan,
 * dan keduanya bisa berbeda jauh kalau ada sungai atau tol di antaranya.
 *
 * Memakai OSRM, yang tidak memerlukan API key maupun akun. Google tidak punya
 * padanannya: Distance Matrix, Directions, dan Routes semuanya menuntut kunci
 * sekaligus akun penagihan.
 *
 * Satu permintaan menghitung seluruh daftar sekaligus lewat layanan `table`,
 * bukan satu permintaan per tempat.
 */
class RoadDistance
{
    private const ENDPOINT = 'https://router.project-osrm.org/table/v1/driving/';

    /** Jalan tidak berubah tiap hari; hasilnya boleh disimpan lama. */
    private const TTL_DAYS = 30;

    /** Server demo OSRM meminta pemakaian yang sopan, jadi dibatasi. */
    private const MAX_PLACES = 40;

    /**
     * Isi `road_distance_km` dan `road_minutes` pada tiap tempat di daftar.
     *
     * Diam-diam tidak melakukan apa-apa kalau daftarnya belum punya tujuan atau
     * tempatnya belum punya koordinat — jarak jalan adalah tambahan, bukan
     * syarat, dan halaman tetap harus tampil kalau layanannya sedang mati.
     */
    public static function hydrate(SurveyList $list): void
    {
        if (! $list->relationLoaded('places') || ! $list->destination) {
            return;
        }

        self::apply($list->destination, $list->places);
    }

    /**
     * Satu tempat, untuk halaman detailnya.
     *
     * Tanpa ini halaman detail jatuh ke garis lurus sementara daftarnya memakai
     * jarak jalan, dan tempat yang sama tampil dengan dua angka berbeda.
     */
    public static function hydratePlace(SurveyPlace $place): void
    {
        $destination = $place->surveyList?->destination;

        if (! $destination) {
            return;
        }

        self::apply($destination, collect([$place]));
    }

    /**
     * @param  \Illuminate\Support\Collection<int, SurveyPlace>  $places
     */
    private static function apply(Destination $destination, $places): void
    {
        $located = $places
            ->filter(fn ($place) => $place->latitude !== null && $place->longitude !== null)
            ->take(self::MAX_PLACES)
            ->values();

        if ($located->isEmpty()) {
            return;
        }

        $table = self::lookup($destination, $located);

        foreach ($located as $place) {
            $entry = $table[$place->id] ?? null;

            $place->road_distance_km = $entry['km'] ?? null;
            $place->road_minutes = $entry['minutes'] ?? null;
        }
    }

    /**
     * @return array<int, array{km: float, minutes: int}>
     */
    private static function lookup(Destination $destination, $places): array
    {
        // Kuncinya dari koordinat, bukan dari id: memindahkan pin berarti
        // jaraknya memang harus dihitung ulang, sedangkan mengganti nama tidak.
        $signature = $places
            ->map(fn ($place) => $place->id.':'.round((float) $place->latitude, 5).','.round((float) $place->longitude, 5))
            ->implode('|');

        // v2: sebelumnya arahnya terbalik, jadi simpanan lama harus ditinggalkan.
        $key = 'road-distance:v2:'.md5(
            round((float) $destination->latitude, 5).','.round((float) $destination->longitude, 5).'=>'.$signature
        );

        return Cache::remember(
            $key,
            now()->addDays(self::TTL_DAYS),
            fn () => self::fetch($destination, $places),
        );
    }

    /**
     * @return array<int, array{km: float, minutes: int}>
     */
    private static function fetch(Destination $destination, $places): array
    {
        // OSRM memakai urutan bujur,lintang — kebalikan dari kebiasaan.
        $coordinates = collect([$destination])
            ->concat($places)
            ->map(fn ($point) => $point->longitude.','.$point->latitude)
            ->implode(';');

        try {
            $response = Http::timeout(12)
                ->withHeaders([
                    // Tanpa User-Agent yang jelas, server demo membalas 403.
                    'User-Agent' => 'TemuRuang/1.0 (survey workspace)',
                    'Accept' => 'application/json',
                ])
                ->get(self::ENDPOINT.$coordinates, [
                    // Tempatnya yang berangkat, tujuannya yang didatangi. Arahnya
                    // penting: di jalan satu arah, pergi dan pulang bisa selisih
                    // ratusan meter, dan yang ditanyakan orang adalah "dari kos
                    // ini, berapa jauh ke kampus".
                    'sources' => collect(range(1, $places->count()))->implode(';'),
                    'destinations' => 0,
                    'annotations' => 'distance,duration',
                ]);

            if ($response->failed() || $response->json('code') !== 'Ok') {
                Log::warning('OSRM table failed', ['status' => $response->status()]);

                return [];
            }

            // Satu baris per tempat, satu kolom saja — tujuannya.
            $distances = $response->json('distances') ?? [];
            $durations = $response->json('durations') ?? [];

            $result = [];

            foreach ($places as $index => $place) {
                $metres = $distances[$index][0] ?? null;

                if ($metres === null) {
                    continue;
                }

                $result[$place->id] = [
                    'km' => round($metres / 1000, 2),
                    'minutes' => (int) round(($durations[$index][0] ?? 0) / 60),
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            Log::warning('OSRM table errored', ['message' => $e->getMessage()]);

            return [];
        }
    }
}
