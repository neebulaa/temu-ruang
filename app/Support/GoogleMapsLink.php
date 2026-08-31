<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Everything TemuRuang knows about a pasted Google Maps link.
 *
 * Two jobs:
 *
 *  1. Pull coordinates out of the link, so pasting one drops the pin. That
 *     turns Google Maps into a free location source — the user does the
 *     searching in an app they already have, and TemuRuang just reads the
 *     result. No Places API, no key, no billing.
 *  2. Build a frameable embed URL, so the place page can show the Google map
 *     itself.
 *
 * The embed uses `https://www.google.com/maps?...&output=embed`, which needs no
 * API key. It is not part of Google's documented Embed API (that one wants a
 * key), so treat it as convenient rather than contractual.
 */
class GoogleMapsLink
{
    /**
     * Hosts a link is allowed to point at.
     *
     * This is a security control, not a convenience: the URL ends up in an
     * <iframe src> and is fetched server-side when expanding short links, so
     * nothing outside this list may reach either.
     */
    private const HOSTS = [
        'google.com',
        'www.google.com',
        'maps.google.com',
        'maps.app.goo.gl',
        'goo.gl',
    ];

    /** Short links carry no coordinates — they have to be followed first. */
    private const SHORT_HOSTS = ['maps.app.goo.gl', 'goo.gl'];

    public static function isValid(?string $url): bool
    {
        if (blank($url)) {
            return false;
        }

        $host = mb_strtolower((string) parse_url($url, PHP_URL_HOST));
        $scheme = mb_strtolower((string) parse_url($url, PHP_URL_SCHEME));

        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        // Regional domains: google.co.id, google.com.au, …
        if (preg_match('/^(www\.|maps\.)?google\.[a-z.]{2,6}$/', $host)) {
            return true;
        }

        return in_array($host, self::HOSTS, true);
    }

    public static function isShortLink(?string $url): bool
    {
        if (blank($url)) {
            return false;
        }

        return in_array(mb_strtolower((string) parse_url($url, PHP_URL_HOST)), self::SHORT_HOSTS, true);
    }

    /**
     * Coordinates carried by the link, if any.
     *
     * Order matters. `!3d…!4d…` is the pin Google actually dropped, `q=`/`ll=`
     * is an explicit request, and `@lat,lng,zoom` is only the centre of the
     * viewport — close, but not the place, so it is the last resort.
     *
     * @return array{latitude: float, longitude: float}|null
     */
    public static function coordinates(?string $url): ?array
    {
        if (blank($url)) {
            return null;
        }

        $patterns = [
            '/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/',
            '/[?&](?:q|query|ll|center|daddr|sll)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i',
            '/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/',
        ];

        foreach ($patterns as $pattern) {
            if (! preg_match($pattern, $url, $matches)) {
                continue;
            }

            $latitude = (float) $matches[1];
            $longitude = (float) $matches[2];

            if (abs($latitude) > 90 || abs($longitude) > 180) {
                continue;
            }

            return ['latitude' => $latitude, 'longitude' => $longitude];
        }

        return null;
    }

    /**
     * The place name Google put in the URL path, if there is one.
     *
     * `/maps/place/Universitas+Bina+Nusantara/@…` → "Universitas Bina Nusantara".
     * Good enough to prefill an empty address field; the user can correct it.
     */
    public static function placeName(?string $url): ?string
    {
        if (! self::isValid($url)) {
            return null;
        }

        if (! preg_match('#/maps/place/([^/@?]+)#', (string) $url, $matches)) {
            return null;
        }

        $name = trim(urldecode(str_replace('+', ' ', $matches[1])));

        // Google falls back to the raw coordinates when a place has no name.
        if ($name === '' || preg_match('/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/', $name)) {
            return null;
        }

        return mb_substr($name, 0, 255);
    }

    /**
     * Follow a short link to the full URL that carries the coordinates.
     *
     * Redirects are followed manually so every hop can be checked against the
     * host list — an open redirect on Google's side must not turn this into a
     * request to an arbitrary address.
     */
    public static function expand(string $url, int $maxHops = 5): ?string
    {
        if (! self::isValid($url)) {
            return null;
        }

        $current = $url;

        try {
            for ($hop = 0; $hop < $maxHops; $hop++) {
                $response = Http::timeout(6)
                    ->withHeaders([
                        // Google hands a bare client the short link's own page;
                        // with a browser UA it answers with the real redirect.
                        'User-Agent' => 'Mozilla/5.0 (compatible; TemuRuang/1.0)',
                        'Accept-Language' => 'id',
                    ])
                    ->withoutRedirecting()
                    ->get($current);

                $next = $response->header('Location');

                if (blank($next)) {
                    /*
                     * Tidak semua tautan pendek membalas dengan header Location.
                     * Sebagian memulangkan halaman antara yang menaruh tujuannya
                     * di dalam badan — meta refresh, tautan kanonis, atau
                     * pengalihan JavaScript. Jadi badannya ikut diperiksa
                     * sebelum menyerah.
                     */
                    $next = self::destinationInBody((string) $response->body());

                    if (blank($next)) {
                        return $current === $url ? null : $current;
                    }
                }

                if (! str_starts_with($next, 'http')) {
                    $next = 'https://'.parse_url($current, PHP_URL_HOST).$next;
                }

                if (! self::isValid($next)) {
                    return null;
                }

                $current = $next;

                if (self::coordinates($current) !== null) {
                    return $current;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Google Maps link expand failed', ['message' => $e->getMessage()]);

            return null;
        }

        return $current === $url ? null : $current;
    }

    /**
     * Cari URL Google Maps di dalam badan halaman antara.
     *
     * Diambil yang pertama membawa koordinat kalau ada; kalau tidak, yang
     * pertama saja — hop berikutnya masih akan diperiksa hostnya seperti biasa.
     */
    private static function destinationInBody(string $body): ?string
    {
        if ($body === '') {
            return null;
        }

        /*
         * Dinormalkan lebih dulu, bukan sesudah dicocokkan: di dalam JavaScript
         * garis miringnya ditulis `https:\/\/`, dan pola apa pun yang menunggu
         * `//` tidak akan pernah cocok kalau escape-nya belum dibuka.
         */
        $normalised = str_replace(
            ['\\/', '\\u003d', '\\u0026', '\\u002f', '\\x3d', '\\x26'],
            ['/', '=', '&', '/', '=', '&'],
            html_entity_decode($body, ENT_QUOTES),
        );

        preg_match_all(
            '#https?://(?:www\.|maps\.)?google\.[a-z.]{2,6}/maps[^\s"\'<>\\\\]+#i',
            $normalised,
            $matches,
        );

        $candidates = array_map(
            fn (string $candidate) => rtrim($candidate, '.,);'),
            $matches[0] ?? [],
        );

        foreach ($candidates as $candidate) {
            if (self::coordinates($candidate) !== null) {
                return $candidate;
            }
        }

        return $candidates[0] ?? null;
    }

    /**
     * A URL that can go straight into an <iframe src>.
     *
     * Coordinates are preferred: they frame reliably and do not depend on
     * Google still resolving the original link. A short link can never be
     * framed directly — it redirects to a page that refuses to be embedded.
     */
    public static function embedUrl(?string $url, ?float $latitude = null, ?float $longitude = null): ?string
    {
        if ($latitude !== null && $longitude !== null) {
            return 'https://www.google.com/maps?'.http_build_query([
                'q' => $latitude.','.$longitude,
                'z' => 17,
                'hl' => 'id',
                'output' => 'embed',
            ]);
        }

        if (! self::isValid($url) || self::isShortLink($url)) {
            return null;
        }

        return $url.(str_contains($url, '?') ? '&' : '?').'output=embed';
    }
}
