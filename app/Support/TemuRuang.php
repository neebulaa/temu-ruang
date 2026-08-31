<?php

namespace App\Support;

/**
 * Single source of truth for the vocabularies used across validation,
 * the seeder and the React select inputs.
 */
class TemuRuang
{
    public const MEDIA_CATEGORIES = [
        'room' => 'Kamar',
        'bathroom' => 'Kamar mandi',
        'kitchen' => 'Dapur',
        'parking' => 'Parkir',
        'facilities' => 'Fasilitas',
        'environment' => 'Lingkungan',
        'entrance' => 'Pintu masuk',
        'other' => 'Lainnya',
    ];

    public const RATING_CRITERIA = [
        'location' => 'Lokasi',
        'price' => 'Harga',
        'condition' => 'Kondisi',
        'facilities' => 'Fasilitas',
        'environment' => 'Lingkungan',
        'accessibility' => 'Akses',
    ];

    /**
     * Facilities every account starts with.
     *
     * @return array<int, array{name: string, slug: string, icon: string}>
     */
    public static function presetFacilities(): array
    {
        return [
            ['name' => 'AC', 'slug' => 'ac', 'icon' => 'wind'],
            ['name' => 'WiFi', 'slug' => 'wifi', 'icon' => 'wifi'],
            ['name' => 'CCTV', 'slug' => 'cctv', 'icon' => 'cctv'],
            ['name' => 'Parkir', 'slug' => 'parking', 'icon' => 'square-parking'],
            ['name' => 'Kamar Mandi Dalam', 'slug' => 'private-bathroom', 'icon' => 'shower-head'],
            ['name' => 'Dapur', 'slug' => 'kitchen', 'icon' => 'cooking-pot'],
            ['name' => 'Laundry', 'slug' => 'laundry', 'icon' => 'washing-machine'],
            ['name' => 'Furnished', 'slug' => 'furnished', 'icon' => 'armchair'],
            ['name' => 'Keamanan', 'slug' => 'security', 'icon' => 'shield-check'],
            ['name' => 'Water Heater', 'slug' => 'water-heater', 'icon' => 'thermometer-sun'],
            ['name' => 'Lift', 'slug' => 'elevator', 'icon' => 'move-vertical'],
            ['name' => 'Boleh Hewan', 'slug' => 'pet-friendly', 'icon' => 'paw-print'],
        ];
    }

    /**
     * Turn a `key => label` map into the `[{value, label}]` shape the React selects expect.
     */
    public static function options(array $map): array
    {
        return collect($map)
            ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }

    /**
     * Everything the front end needs to render its dropdowns and badges.
     */
    public static function vocabularies(): array
    {
        return [
            'mediaCategories' => self::options(self::MEDIA_CATEGORIES),
            'ratingCriteria' => self::options(self::RATING_CRITERIA),
        ];
    }

    /**
     * Great-circle distance between two coordinates, in kilometres.
     */
    public static function distanceKm(?float $lat1, ?float $lon1, ?float $lat2, ?float $lon2): ?float
    {
        if ($lat1 === null || $lon1 === null || $lat2 === null || $lon2 === null) {
            return null;
        }

        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return round($earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }
}
