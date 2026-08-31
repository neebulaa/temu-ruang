<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'category' => $this->category,
            'url' => $this->url(),
            'caption' => $this->caption,
            'is_cover' => $this->is_cover,
            'original_name' => $this->original_name,
            'size' => $this->size,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
