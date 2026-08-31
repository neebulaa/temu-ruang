<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Inertia props read better without the extra `data` envelope.
        JsonResource::withoutWrapping();

        Vite::prefetch(concurrency: 3);
    }
}
