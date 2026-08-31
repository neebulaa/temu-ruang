<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'destination_id'])]
class SurveyList extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function places(): HasMany
    {
        return $this->hasMany(SurveyPlace::class)->orderBy('position')->orderBy('id');
    }

    public function scopeOwnedBy(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id);
    }

    public function surveyedCount(): int
    {
        return $this->places->where('is_surveyed', true)->count();
    }

    public function progress(): int
    {
        $total = $this->places->count();

        return $total === 0 ? 0 : (int) round($this->surveyedCount() / $total * 100);
    }
}
