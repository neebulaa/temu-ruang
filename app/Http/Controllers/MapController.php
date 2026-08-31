<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyListResource;
use App\Http\Resources\SurveyPlaceResource;
use App\Models\SurveyList;
use App\Support\GoogleMapsLink;
use App\Support\RoadDistance;
use App\Support\TemuRuang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $lists = SurveyList::ownedBy($user)
            ->with(['destination', 'places.media', 'places.ratings'])
            ->orderByDesc('updated_at')
            ->get();

        $lists->each(function (SurveyList $list) {
            $list->places->each(fn ($place) => $place->setRelation('surveyList', $list));
            RoadDistance::hydrate($list);
        });

        $listFilter = $request->integer('list') ?: null;

        $visible = $listFilter
            ? $lists->where('id', $listFilter)
            : $lists;

        // A place is mappable once it has coordinates — either read out of a
        // pasted Google Maps link, or already stored.
        $places = $visible->flatMap->places
            ->filter(fn ($place) => $place->mapsEmbedUrl() !== null)
            ->values();

        return Inertia::render('Map/Index', [
            'lists' => SurveyListResource::collection($lists),
            'places' => SurveyPlaceResource::collection($places),
            'destinations' => $visible->pluck('destination')->filter()->unique('id')->values()->map(fn ($destination) => [
                'id' => $destination->id,
                'name' => $destination->name,
                'address' => $destination->address,
                'latitude' => $destination->latitude,
                'longitude' => $destination->longitude,
                'maps_embed_url' => GoogleMapsLink::embedUrl(
                    null,
                    $destination->latitude !== null ? (float) $destination->latitude : null,
                    $destination->longitude !== null ? (float) $destination->longitude : null,
                ),
            ]),
            'filters' => ['list' => $listFilter],
            'vocab' => TemuRuang::vocabularies(),
        ]);
    }
}
