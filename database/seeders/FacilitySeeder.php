<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Support\TemuRuang;
use Illuminate\Database\Seeder;

class FacilitySeeder extends Seeder
{
    /**
     * Shared presets (user_id = null) available to every account.
     */
    public function run(): void
    {
        foreach (TemuRuang::presetFacilities() as $facility) {
            Facility::updateOrCreate(
                ['user_id' => null, 'slug' => $facility['slug']],
                ['name' => $facility['name'], 'icon' => $facility['icon']],
            );
        }
    }
}
