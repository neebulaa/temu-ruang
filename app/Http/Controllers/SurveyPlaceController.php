<?php

namespace App\Http\Controllers;

use App\Http\Requests\SurveyPlaceRequest;
use App\Http\Resources\FacilityResource;
use App\Http\Resources\SurveyListResource;
use App\Http\Resources\SurveyPlaceResource;
use App\Models\Facility;
use App\Models\SurveyList;
use App\Models\SurveyPlace;
use App\Support\RoadDistance;
use App\Support\TemuRuang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SurveyPlaceController extends Controller
{
    public function create(Request $request, SurveyList $survey): Response
    {
        $this->authorize('update', $survey);

        $survey->load('destination');

        return Inertia::render('Places/Form', [
            'list' => new SurveyListResource($survey),
            'place' => null,
            'facilities' => FacilityResource::collection(
                Facility::availableTo($request->user())->orderBy('name')->get()
            ),
            'vocab' => TemuRuang::vocabularies(),
        ]);
    }

    public function store(SurveyPlaceRequest $request, SurveyList $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        $data = $request->validated();

        $place = new SurveyPlace($data);
        $place->survey_list_id = $survey->id;
        $place->position = (int) $survey->places()->max('position') + 1;
        $place->surveyed_at = ($data['is_surveyed'] ?? false) ? now() : null;
        $place->save();

        $place->facilities()->sync($this->allowedFacilityIds($request, $data['facilities'] ?? []));

        return redirect("/places/{$place->id}")->with('success', 'Tempat ditambahkan ke daftar survei.');
    }

    public function show(Request $request, SurveyPlace $place): Response
    {
        $this->authorize('view', $place);

        $place->load([
            'surveyList.destination',
            'media',
            'ratings',
            'facilities',
        ]);

        // Angka jaraknya harus sama dengan yang tertulis di kartu daftarnya.
        RoadDistance::hydratePlace($place);

        return Inertia::render('Places/Show', [
            'place' => new SurveyPlaceResource($place),
            'list' => new SurveyListResource($place->surveyList),
            'facilities' => FacilityResource::collection(
                Facility::availableTo($request->user())->orderBy('name')->get()
            ),
            'vocab' => TemuRuang::vocabularies(),
        ]);
    }

    public function edit(Request $request, SurveyPlace $place): Response
    {
        $this->authorize('update', $place);

        $place->load(['surveyList.destination', 'facilities']);

        return Inertia::render('Places/Form', [
            'list' => new SurveyListResource($place->surveyList),
            'place' => new SurveyPlaceResource($place),
            'facilities' => FacilityResource::collection(
                Facility::availableTo($request->user())->orderBy('name')->get()
            ),
            'vocab' => TemuRuang::vocabularies(),
        ]);
    }

    public function update(SurveyPlaceRequest $request, SurveyPlace $place): RedirectResponse
    {
        $this->authorize('update', $place);

        $data = $request->validated();

        $place->fill($data);
        $place->surveyed_at = ($data['is_surveyed'] ?? false) ? ($place->surveyed_at ?? now()) : null;
        $place->save();

        $place->facilities()->sync($this->allowedFacilityIds($request, $data['facilities'] ?? []));

        return redirect("/places/{$place->id}")->with('success', 'Tempat diperbarui.');
    }

    public function destroy(SurveyPlace $place): RedirectResponse
    {
        $this->authorize('delete', $place);

        $listId = $place->survey_list_id;
        $place->delete();

        return redirect("/surveys/{$listId}")->with('success', 'Tempat dihapus.');
    }

    /**
     * The survey status is a single toggle: surveyed, or not yet.
     */
    public function toggleSurveyed(Request $request, SurveyPlace $place): RedirectResponse
    {
        $this->authorize('update', $place);

        $data = $request->validate([
            'is_surveyed' => ['required', 'boolean'],
        ]);

        $place->markSurveyed($data['is_surveyed']);

        return back()->with('success', $data['is_surveyed'] ? 'Ditandai sudah disurvei.' : 'Ditandai belum disurvei.');
    }

    /**
     * Never let a user attach another account's custom facility.
     *
     * @param  array<int, int>  $ids
     * @return array<int, int>
     */
    private function allowedFacilityIds(Request $request, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return Facility::availableTo($request->user())
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();
    }
}
