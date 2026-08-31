<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'slug', 'icon'])]
class Facility extends Model
{
    protected $table = 'facilities';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function surveyPlaces(): BelongsToMany
    {
        return $this->belongsToMany(SurveyPlace::class);
    }

    /**
     * Shared presets plus the facilities this user added themselves.
     */
    public function scopeAvailableTo(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user) {
            $query->whereNull('user_id')->orWhere('user_id', $user->id);
        });
    }
}
