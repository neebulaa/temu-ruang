<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable(['name', 'email', 'password', 'accent'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function surveyLists(): HasMany
    {
        return $this->hasMany(SurveyList::class);
    }

    public function destinations(): HasMany
    {
        return $this->hasMany(Destination::class);
    }

    /**
     * Facilities this user created on top of the shared presets.
     */
    public function facilities(): HasMany
    {
        return $this->hasMany(Facility::class);
    }

    /**
     * Up to two letters used as the avatar fallback.
     */
    public function initials(): string
    {
        $words = preg_split('/\s+/', trim($this->name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $letters = collect($words)->take(2)->map(fn ($word) => Str::upper(Str::substr($word, 0, 1)));

        return $letters->implode('') ?: Str::upper(Str::substr($this->email, 0, 1));
    }
}
