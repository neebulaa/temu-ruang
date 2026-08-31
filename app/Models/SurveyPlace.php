<?php

namespace App\Models;

use App\Support\GoogleMapsLink;
use App\Support\TemuRuang;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'address', 'contact', 'source_url', 'maps_url', 'price_min', 'price_max',
    'latitude', 'longitude', 'is_surveyed', 'notes', 'surveyed_at', 'position',
])]
class SurveyPlace extends Model
{
    protected function casts(): array
    {
        return [
            'price_min' => 'decimal:2',
            'price_max' => 'decimal:2',
            'latitude' => 'float',
            'longitude' => 'float',
            'is_surveyed' => 'boolean',
            'surveyed_at' => 'datetime',
        ];
    }

    public function surveyList(): BelongsTo
    {
        return $this->belongsTo(SurveyList::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class)->orderBy('position')->orderBy('id');
    }

    public function photos(): HasMany
    {
        return $this->media()->where('type', 'photo');
    }

    public function videos(): HasMany
    {
        return $this->media()->where('type', 'video');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class)->withPivot('note')->withTimestamps();
    }

    /**
     * Frameable Google Maps URL for this place, or null if there is nothing
     * to show.
     *
     * Coordinates from the link win over the pin: the link is what the user
     * actually pointed at, while the pin may have been nudged by hand.
     */
    public function mapsEmbedUrl(): ?string
    {
        $coordinates = GoogleMapsLink::coordinates($this->maps_url) ?? ($this->latitude !== null && $this->longitude !== null
            ? ['latitude' => (float) $this->latitude, 'longitude' => (float) $this->longitude]
            : null);

        return GoogleMapsLink::embedUrl(
            $this->maps_url,
            $coordinates['latitude'] ?? null,
            $coordinates['longitude'] ?? null,
        );
    }

    /**
     * Flip the surveyed toggle, stamping or clearing the visit time with it.
     */
    public function markSurveyed(bool $surveyed): void
    {
        $this->is_surveyed = $surveyed;
        $this->surveyed_at = $surveyed ? ($this->surveyed_at ?? now()) : null;
        $this->save();
    }

    /**
     * Average of every criterion the user has rated, or null when unrated.
     */
    public function overallScore(): ?float
    {
        $scores = $this->relationLoaded('ratings')
            ? $this->ratings->pluck('score')
            : $this->ratings()->pluck('score');

        return $scores->isEmpty() ? null : round($scores->avg(), 1);
    }

    /**
     * Straight-line distance to the parent list's destination, in km.
     */
    public function distanceToDestination(): ?float
    {
        $destination = $this->surveyList?->destination;

        if (! $destination) {
            return null;
        }

        return TemuRuang::distanceKm(
            $this->latitude,
            $this->longitude,
            $destination->latitude,
            $destination->longitude,
        );
    }

    public function coverPhoto(): ?Media
    {
        $photos = $this->relationLoaded('media')
            ? $this->media->where('type', 'photo')
            : $this->photos()->get();

        return $photos->firstWhere('is_cover', true) ?? $photos->first();
    }
}
