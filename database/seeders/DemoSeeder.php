<?php

namespace Database\Seeders;

use App\Models\Destination;
use App\Models\Facility;
use App\Models\SurveyList;
use App\Models\SurveyPlace;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A worked example: one account partway through three real surveys.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Nama lama sebelum rebrand, dibersihkan agar tidak menumpuk.
        User::where('email', 'demo@nestory.test')->delete();

        $user = User::updateOrCreate(
            ['email' => 'demo@temuruang.test'],
            ['name' => 'Rani Prameswari', 'password' => 'password'],
        );

        // Start clean so re-seeding never stacks duplicates.
        $user->surveyLists()->delete();
        $user->destinations()->delete();

        foreach ($this->blueprint() as $listData) {
            $places = $listData['places'];
            unset($listData['places']);

            $destinationData = $listData['destination'] ?? null;
            unset($listData['destination']);

            $destination = $destinationData
                ? tap(new Destination($destinationData), function ($destination) use ($user) {
                    $destination->user_id = $user->id;
                    $destination->save();
                })
                : null;

            $list = new SurveyList($listData);
            $list->user_id = $user->id;
            $list->destination_id = $destination?->id;
            $list->save();

            foreach ($places as $index => $placeData) {
                $this->createPlace($user, $list, $placeData, $index);
            }
        }
    }

    private function createPlace(User $user, SurveyList $list, array $data, int $index): void
    {
        $facilitySlugs = $data['facilities'] ?? [];
        $ratings = $data['ratings'] ?? [];
        $findings = $data['findings'] ?? [];
        $photos = $data['photos'] ?? [];

        unset($data['facilities'], $data['ratings'], $data['findings'], $data['photos']);

        // Pros and cons now live inline in the single notes field.
        if ($findings) {
            $lines = collect($findings)
                ->map(fn ($entry) => ($entry[0] === 'pro' ? '+ ' : '- ').$entry[1])
                ->implode('
');

            $data['notes'] = trim((($data['notes'] ?? '') ? $data['notes'].'

' : '').$lines);
        }

        $place = new SurveyPlace($data);
        $place->survey_list_id = $list->id;
        $place->position = $index + 1;
        $place->surveyed_at = ($data['is_surveyed'] ?? false) ? now()->subDays(7 - $index) : null;
        $place->save();

        if ($facilitySlugs) {
            $ids = Facility::availableTo($user)->whereIn('slug', $facilitySlugs)->pluck('id');
            $place->facilities()->sync($ids);
        }

        foreach ($ratings as $criteria => $score) {
            $place->ratings()->create(['criteria' => $criteria, 'score' => $score]);
        }

        foreach ($photos as $position => [$category, $caption, $tint]) {
            $path = $this->generatePlaceholder($place->id, $tint, $place->name, $caption);

            if (! $path) {
                continue;
            }

            $place->media()->create([
                'type' => 'photo',
                'category' => $category,
                'path' => $path,
                'original_name' => Str::slug("{$place->name}-{$caption}").'.jpg',
                'mime_type' => 'image/jpeg',
                'size' => Storage::disk('public')->size($path),
                'caption' => $caption,
                'is_cover' => $position === 0,
                'position' => $position + 1,
            ]);
        }
    }

    /**
     * Demo installs ship without real photography, so draw a calm tinted
     * placeholder instead of leaving every card empty.
     */
    private function generatePlaceholder(int $placeId, array $tint, string $title, string $caption): ?string
    {
        if (! extension_loaded('gd')) {
            return null;
        }

        [$width, $height] = [1200, 900];
        $image = imagecreatetruecolor($width, $height);

        // Soft vertical gradient between two shades of the tint.
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / $height;

            $color = imagecolorallocate(
                $image,
                (int) ($tint[0] + (255 - $tint[0]) * $ratio * 0.55),
                (int) ($tint[1] + (255 - $tint[1]) * $ratio * 0.55),
                (int) ($tint[2] + (255 - $tint[2]) * $ratio * 0.55),
            );

            imagefilledrectangle($image, 0, $y, $width, $y, $color);
        }

        // A couple of quiet geometric shapes so the images are not flat.
        $accent = imagecolorallocatealpha($image, 255, 255, 255, 105);
        imagefilledellipse($image, (int) ($width * 0.78), (int) ($height * 0.24), 460, 460, $accent);
        imagefilledrectangle($image, 0, (int) ($height * 0.74), $width, $height, $accent);

        $ink = imagecolorallocate($image, 255, 255, 255);
        imagestring($image, 5, 60, $height - 120, strtoupper($title), $ink);
        imagestring($image, 3, 60, $height - 90, strtoupper($caption), $ink);

        $path = "places/{$placeId}/".Str::random(24).'.jpg';

        ob_start();
        imagejpeg($image, null, 82);
        $contents = ob_get_clean();
        imagedestroy($image);

        Storage::disk('public')->put($path, $contents);

        return $path;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function blueprint(): array
    {
        return [
            [
                'name' => 'Kos Dekat BINUS',
                'destination' => [
                    'name' => 'BINUS University, Kampus Anggrek',
                    'address' => 'Jl. Kebon Jeruk Raya No. 27, Jakarta Barat',
                    'latitude' => -6.2018,
                    'longitude' => 106.7823,
                ],
                'places' => [
                    [
                        'name' => 'Kos Melati',
                        'address' => 'Jl. Anggrek Raya No. 12, Kemanggisan',
                        'contact' => '0812 3456 7890',
                        'price_min' => 2300000,
                        'notes' => 'Lantai dua, kamar pojok dengan jendela menghadap jalan. Pemilik tinggal di lokasi.',
                        'latitude' => -6.2032,
                        'longitude' => 106.7871,
                        'is_surveyed' => true,
                        'facilities' => ['ac', 'wifi', 'private-bathroom', 'parking', 'cctv', 'water-heater'],
                        'ratings' => [
                            'location' => 5,
                            'price' => 4,
                            'condition' => 4,
                            'facilities' => 5,
                            'environment' => 4,
                            'accessibility' => 5,
                        ],
                        'findings' => [
                            ['general', 'Kamar lebih luas dari fotonya, sekitar 3x4. Kasur baru, lemari built-in.'],
                            ['pro', 'Delapan menit jalan kaki ke gerbang Anggrek'],
                            ['pro', 'Tekanan air benar-benar bagus'],
                            ['pro', 'Pemilik di lokasi, gerbang tidak pernah dikunci'],
                            ['con', 'Berisik jalan sampai sekitar jam 10 malam'],
                            ['con', 'Listrik terpisah, sekitar 150rb/bulan'],
                        ],
                        'photos' => [
                            ['room', 'Kamar utama', [79, 111, 82]],
                            ['bathroom', 'Kamar mandi dalam', [63, 100, 132]],
                            ['parking', 'Parkir motor', [139, 135, 127]],
                        ],
                    ],
                    [
                        'name' => 'Kos Anggrek Residence',
                        'address' => 'Jl. Kemanggisan Ilir III No. 4',
                        'contact' => '0857 1122 3344',
                        'price_min' => 2000000,
                        'notes' => 'Bangunan baru, akses kartu, jemuran bersama di rooftop.',
                        'latitude' => -6.1998,
                        'longitude' => 106.7906,
                        'is_surveyed' => true,
                        'facilities' => ['ac', 'wifi', 'private-bathroom', 'laundry', 'security', 'furnished'],
                        'ratings' => [
                            'location' => 4,
                            'price' => 5,
                            'condition' => 5,
                            'facilities' => 4,
                            'environment' => 4,
                            'accessibility' => 4,
                        ],
                        'findings' => [
                            ['general', 'Paling bersih sejauh ini. Terasa seperti apartemen kecil, bukan kos.'],
                            ['pro', 'Laundry sudah termasuk harga'],
                            ['pro', 'Akses kartu, koridor tenang'],
                            ['con', 'Tidak ada dapur sama sekali'],
                            ['con', 'Parkir di pinggir jalan'],
                        ],
                        'photos' => [
                            ['room', 'Kamar dengan meja', [111, 92, 74]],
                            ['environment', 'Koridor', [90, 104, 118]],
                        ],
                    ],
                    [
                        'name' => 'Kos Pak Hendra',
                        'address' => 'Gg. Mawar No. 8, Palmerah',
                        'contact' => '0813 9988 7766',
                        'price_min' => 1650000,
                        'notes' => 'Paling murah. Bangunan lama tapi pemiliknya perhatian.',
                        'latitude' => -6.2075,
                        'longitude' => 106.7938,
                        'is_surveyed' => true,
                        'facilities' => ['wifi', 'parking', 'kitchen'],
                        'ratings' => [
                            'location' => 3,
                            'price' => 5,
                            'condition' => 3,
                        ],
                        'findings' => [
                            ['general', 'Kamar mandi bersama between four rooms. Fine, but would need to adjust the morning routine.'],
                            ['pro', 'Dapur yang benar-benar dipakai'],
                            ['pro', 'Jauh di bawah anggaran'],
                            ['con', 'Kamar mandi bersama'],
                            ['con', 'Tanpa AC, hanya kipas plafon'],
                        ],
                        'photos' => [
                            ['room', 'Kamar', [120, 108, 92]],
                            ['kitchen', 'Dapur bersama', [86, 96, 82]],
                        ],
                    ],
                    [
                        'name' => 'Kos Griya Asri',
                        'address' => 'Jl. Rawa Belong No. 21',
                        'price_min' => 2450000,
                        'notes' => 'Diiklankan full furnished dengan balkon kecil tiap kamar.',
                        'latitude' => -6.1965,
                        'longitude' => 106.7869,
                        'is_surveyed' => false,
                        'facilities' => ['ac', 'wifi', 'private-bathroom', 'furnished', 'cctv'],
                        'findings' => [
                            ['general', 'Fotonya menjanjikan tapi akunnya tidak pernah menjawab soal deposit.'],
                        ],
                        'photos' => [],
                    ],
                    [
                        'name' => 'Kos Sari Indah',
                        'address' => 'Jl. Kemanggisan Utama No. 33',
                        'price_min' => 1800000,
                        'latitude' => -6.2054,
                        'longitude' => 106.7812,
                        'is_surveyed' => false,
                        'notes' => 'Lihat papan namanya saat pulang dari kampus. Tidak ada iklan online.',
                        'facilities' => ['parking'],
                        'photos' => [],
                    ],
                ],
            ],

            [
                'name' => 'Apartemen Jakarta Selatan',
                'destination' => [
                    'name' => 'SCBD',
                    'address' => 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
                    'latitude' => -6.2251,
                    'longitude' => 106.8090,
                ],
                'places' => [
                    [
                        'name' => 'Signature Park Grande, Studio',
                        'address' => 'Jl. MT Haryono Kav. 20, Cawang',
                        'price_min' => 4500000,
                        'notes' => 'Studio di lantai 18, tidak menghadap tol.',
                        'latitude' => -6.2465,
                        'longitude' => 106.8641,
                        'is_surveyed' => true,
                        'facilities' => ['ac', 'wifi', 'furnished', 'security', 'elevator', 'private-bathroom'],
                        'ratings' => [
                            'location' => 3,
                            'price' => 4,
                            'condition' => 4,
                            'facilities' => 5,
                        ],
                        'findings' => [
                            ['pro', 'Kolam dan gym termasuk service charge'],
                            ['con', 'Jauh dari SCBD saat macet pagi'],
                        ],
                        'photos' => [['room', 'Studio', [70, 88, 112]]],
                    ],
                    [
                        'name' => 'Sudirman Suites, 1BR',
                        'address' => 'Jl. Jend. Sudirman Kav. 60',
                        'price_min' => 6200000,
                        'latitude' => -6.2274,
                        'longitude' => 106.8072,
                        'is_surveyed' => false,
                        'notes' => 'Pas di batas atas anggaran tapi sepuluh menit jalan kaki ke kantor.',
                        'facilities' => ['ac', 'furnished', 'security', 'elevator', 'laundry'],
                        'photos' => [],
                    ],
                    [
                        'name' => 'Kalibata City, 1BR',
                        'address' => 'Jl. Kalibata Raya No. 1',
                        'price_min' => 3800000,
                        'latitude' => -6.2560,
                        'longitude' => 106.8546,
                        'is_surveyed' => false,
                        'facilities' => ['ac', 'security', 'elevator'],
                        'photos' => [],
                    ],
                ],
            ],

            [
                'name' => 'Coworking Space',
                'destination' => null,
                'places' => [
                    [
                        'name' => 'Ruang Kerja Senopati',
                        'address' => 'Jl. Senopati No. 45, Kebayoran Baru',
                        'price_min' => 1500000,
                        'notes' => 'Membership hot desk. Trial sehari gratis.',
                        'latitude' => -6.2361,
                        'longitude' => 106.8047,
                        'is_surveyed' => true,
                        'facilities' => ['wifi', 'ac', 'parking', 'security'],
                        'ratings' => [
                            'location' => 5,
                            'price' => 3,
                            'condition' => 5,
                            'facilities' => 4,
                            'environment' => 5,
                        ],
                        'findings' => [
                            ['general', 'Sudah coba trial gratis. Tenang menjelang siang, dua phone booth yang tidak pernah penuh bersamaan.'],
                            ['pro', 'Wifi benar-benar kencang'],
                            ['con', 'Parkir penuh sebelum jam 9'],
                        ],
                        'photos' => [['facilities', 'Area utama', [82, 96, 88]]],
                    ],
                    [
                        'name' => 'Kolektif Blok M',
                        'address' => 'Jl. Melawai Raya No. 8, Blok M',
                        'price_min' => 950000,
                        'latitude' => -6.2441,
                        'longitude' => 106.7995,
                        'is_surveyed' => false,
                        'notes' => 'Lebih murah, di atas kafe. Belum jelas ada zona tenang atau tidak.',
                        'facilities' => ['wifi', 'ac'],
                        'photos' => [],
                    ],
                ],
            ],
        ];
    }
}
