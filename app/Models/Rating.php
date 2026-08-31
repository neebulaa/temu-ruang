<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['criteria', 'score'])]
class Rating extends Model
{
    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    public function surveyPlace(): BelongsTo
    {
        return $this->belongsTo(SurveyPlace::class);
    }
}
