<?php

namespace App\Http\Controllers;

use App\Support\GoogleMapsLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Turns a pasted Google Maps link into coordinates.
 *
 * This is TemuRuang's free alternative to a Places lookup: the user searches in
 * Google Maps — an app they already have — hits Share, and pastes the result.
 * The link carries the coordinates; we just read them.
 *
 * Short links (`maps.app.goo.gl`, what the Share button gives you on a phone)
 * carry nothing, so they are followed server-side first. Doing that here rather
 * than in the browser keeps the host whitelist enforceable and avoids CORS.
 */
class MapsLinkController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'url' => ['required', 'string', 'max:2048'],
        ]);

        $url = trim($data['url']);

        if (! GoogleMapsLink::isValid($url)) {
            return response()->json([
                'message' => 'Tautan harus berasal dari Google Maps.',
            ], 422);
        }

        $coordinates = GoogleMapsLink::coordinates($url);
        $resolved = $url;

        // Only a short link needs the network round trip.
        if ($coordinates === null && GoogleMapsLink::isShortLink($url)) {
            $expanded = Cache::remember(
                'maps-link:'.md5($url),
                now()->addDay(),
                fn () => GoogleMapsLink::expand($url) ?? '',
            );

            if (filled($expanded)) {
                $resolved = $expanded;
                $coordinates = GoogleMapsLink::coordinates($expanded);
            }
        }

        return response()->json([
            'url' => $url,
            'resolved_url' => $resolved,
            'name' => GoogleMapsLink::placeName($resolved),
            'latitude' => $coordinates['latitude'] ?? null,
            'longitude' => $coordinates['longitude'] ?? null,
            'embed_url' => GoogleMapsLink::embedUrl(
                $resolved,
                $coordinates['latitude'] ?? null,
                $coordinates['longitude'] ?? null,
            ),
        ]);
    }
}
