<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'type', 'category', 'path', 'original_name', 'mime_type',
    'size', 'caption', 'is_cover', 'position',
])]
class Media extends Model
{
    protected $table = 'media';

    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
            'size' => 'integer',
        ];
    }

    public function surveyPlace(): BelongsTo
    {
        return $this->belongsTo(SurveyPlace::class);
    }

    public function url(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
