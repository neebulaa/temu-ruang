<?php

namespace App\Http\Controllers;

use App\Http\Requests\SurveyListRequest;
use App\Http\Resources\FacilityResource;
use App\Http\Resources\SurveyListResource;
use App\Models\Destination;
use App\Models\Facility;
use App\Models\SurveyList;
use App\Models\User;
use App\Support\RoadDistance;
use App\Support\TemuRuang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SurveyListController extends Controller
{
    public function index(Request $request): Response
    {
        $lists = SurveyList::ownedBy($request->user())
            ->with(['destination', 'places.media', 'places.ratings'])
            ->when($request->string('q')->toString(), fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->orderByDesc('updated_at')
            ->get();

        $lists->each(function (SurveyList $list) {
            $list->places->each(fn ($place) => $place->setRelation('surveyList', $list));
        });

        return Inertia::render('Surveys/Index', [
            'lists' => SurveyListResource::collection($lists),
            'filters' => $request->only('q'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Surveys/Form', ['list' => null]);
    }

    public function store(SurveyListRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $list = new SurveyList(['name' => $data['name']]);
        $list->user_id = $request->user()->id;
        $list->save();

        $this->syncDestination($list, $request->user(), [
            'name' => $data['destination_name'] ?? null,
            'address' => $data['destination_address'] ?? null,
            'latitude' => $data['destination_latitude'] ?? null,
            'longitude' => $data['destination_longitude'] ?? null,
        ]);

        return redirect("/surveys/{$list->id}")->with('success', 'Daftar survei dibuat.');
    }

    public function show(Request $request, SurveyList $survey): Response
    {
        $this->authorize('view', $survey);

        $survey->load([
            'destination',
            'places.media',
            'places.ratings',
            'places.facilities',
        ]);

        $survey->places->each(fn ($place) => $place->setRelation('surveyList', $survey));

        RoadDistance::hydrate($survey);

        return Inertia::render('Surveys/Show', [
            'list' => new SurveyListResource($survey),
            'facilities' => FacilityResource::collection(
                Facility::availableTo($request->user())->orderBy('name')->get()
            ),
            'vocab' => TemuRuang::vocabularies(),
            'view' => $request->string('view')->toString() ?: 'list',
        ]);
    }

    public function edit(SurveyList $survey): Response
    {
        $this->authorize('update', $survey);

        return Inertia::render('Surveys/Form', [
            'list' => new SurveyListResource($survey),
        ]);
    }

    public function update(SurveyListRequest $request, SurveyList $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        $survey->update($request->validated());

        return redirect("/surveys/{$survey->id}")->with('success', 'Daftar survei diperbarui.');
    }

    public function destroy(SurveyList $survey): RedirectResponse
    {
        $this->authorize('delete', $survey);

        $survey->delete();

        return redirect('/')->with('success', 'Daftar survei dihapus.');
    }

    /**
     * Create, update or clear a list's destination.
     *
     * Shared by list creation and the destination editor, so both routes treat
     * a blank name the same way: it means "no destination".
     *
     * @param  array{name?: ?string, address?: ?string, latitude?: mixed, longitude?: mixed}  $data
     * @return Destination|null null when the destination was cleared or never set
     */
    private function syncDestination(SurveyList $survey, User $user, array $data): ?Destination
    {
        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            $survey->update(['destination_id' => null]);

            return null;
        }

        $attributes = [
            'name' => $name,
            'address' => $data['address'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
        ];

        if ($existing = $survey->destination) {
            $existing->update($attributes);

            return $existing;
        }

        $destination = new Destination($attributes);
        $destination->user_id = $user->id;
        $destination->save();

        $survey->update(['destination_id' => $destination->id]);

        return $destination;
    }

    /**
     * The destination may be set here or when the list is created — either way
     * it is only a reference point for measuring distance.
     */
    public function updateDestination(Request $request, SurveyList $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:180'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        if ($this->syncDestination($survey, $request->user(), $data) === null) {
            return back()->with('success', 'Tujuan dihapus.');
        }

        return back()->with('success', 'Tujuan disimpan.');
    }
}
