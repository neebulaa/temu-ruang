<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SurveyPlaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cover = $this->coverPhoto();

        return [
            'id' => $this->id,
            'survey_list_id' => $this->survey_list_id,
            'name' => $this->name,
            'address' => $this->address,
            'contact' => $this->contact,
            'source_url' => $this->source_url,
            'maps_url' => $this->maps_url,
            // Built here, never in JSX: the embed URL is the one thing that
            // reaches an <iframe src>, so it stays server-controlled.
            'maps_embed_url' => $this->mapsEmbedUrl(),
            'price_min' => $this->price_min !== null ? (float) $this->price_min : null,
            'price_max' => $this->price_max !== null ? (float) $this->price_max : null,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_surveyed' => $this->is_surveyed,
            'notes' => $this->notes,
            'surveyed_at' => $this->surveyed_at?->format('Y-m-d\TH:i:s'),
            'overall_score' => $this->overallScore(),
            'distance_km' => $this->distanceToDestination(),
            // Diisi RoadDistance::hydrate() bila tersedia; null artinya
            // layanannya tidak terjangkau dan garis lurus yang dipakai.
            'road_distance_km' => $this->road_distance_km,
            'road_minutes' => $this->road_minutes,
            'cover_url' => $cover?->url(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'photos_count' => $this->whenLoaded('media', fn () => $this->media->where('type', 'photo')->count()),
            'videos_count' => $this->whenLoaded('media', fn () => $this->media->where('type', 'video')->count()),

            'facilities' => FacilityResource::collection($this->whenLoaded('facilities')),
            'media' => MediaResource::collection($this->whenLoaded('media')),
            'ratings' => $this->whenLoaded('ratings', fn () => $this->ratings->pluck('score', 'criteria')),
        ];
    }
}
