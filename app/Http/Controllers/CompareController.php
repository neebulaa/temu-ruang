<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyListResource;
use App\Http\Resources\SurveyPlaceResource;
use App\Models\SurveyList;
use App\Support\RoadDistance;
use App\Support\TemuRuang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompareController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $lists = SurveyList::ownedBy($user)
            ->withCount('places')
            ->orderByDesc('updated_at')
            ->get();

        $selectedList = $request->filled('list')
            ? $lists->firstWhere('id', (int) $request->integer('list'))
            : $lists->firstWhere('places_count', '>', 0);

        $places = collect();

        if ($selectedList) {
            $selectedList->load(['destination', 'places.media', 'places.ratings', 'places.facilities']);
            $selectedList->places->each(fn ($place) => $place->setRelation('surveyList', $selectedList));

            RoadDistance::hydrate($selectedList);

            $places = $selectedList->places;
        }

        return Inertia::render('Compare/Index', [
            'lists' => SurveyListResource::collection($lists),
            'selectedList' => $selectedList ? new SurveyListResource($selectedList) : null,
            'places' => SurveyPlaceResource::collection($places),
            'selectedIds' => array_map('intval', (array) $request->input('places', [])),
            'vocab' => TemuRuang::vocabularies(),
        ]);
    }
}
