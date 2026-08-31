<?php

namespace App\Http\Resources;

use App\Support\GoogleMapsLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SurveyListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'updated_at_human' => $this->updated_at?->diffForHumans(),

            'destination' => $this->whenLoaded('destination', fn () => $this->destination ? [
                'id' => $this->destination->id,
                'name' => $this->destination->name,
                'address' => $this->destination->address,
                'latitude' => $this->destination->latitude,
                'longitude' => $this->destination->longitude,
                'maps_embed_url' => GoogleMapsLink::embedUrl(
                    null,
                    $this->destination->latitude !== null ? (float) $this->destination->latitude : null,
                    $this->destination->longitude !== null ? (float) $this->destination->longitude : null,
                ),
            ] : null),

            'places_count' => $this->whenLoaded('places', fn () => $this->places->count(), $this->places_count ?? 0),
            'surveyed_count' => $this->whenLoaded('places', fn () => $this->surveyedCount()),
            'progress' => $this->whenLoaded('places', fn () => $this->progress()),

            'places' => SurveyPlaceResource::collection($this->whenLoaded('places')),
        ];
    }
}
