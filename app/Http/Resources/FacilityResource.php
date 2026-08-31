<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'is_custom' => $this->user_id !== null,
            'note' => $this->whenPivotLoaded('facility_survey_place', fn () => $this->pivot->note),
        ];
    }
}
