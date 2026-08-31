<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\SurveyPlace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FacilityController extends Controller
{
    /**
     * Add a custom facility to the user's own vocabulary, optionally
     * attaching it to the place they are editing right now.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'survey_place_id' => ['nullable', 'integer', 'exists:survey_places,id'],
        ]);

        $slug = Str::slug($data['name']);

        $existing = Facility::availableTo($request->user())->where('slug', $slug)->first();

        $facility = $existing ?? Facility::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'slug' => $slug,
            'icon' => 'check',
        ]);

        if (! empty($data['survey_place_id'])) {
            $place = SurveyPlace::findOrFail($data['survey_place_id']);
            $this->authorize('update', $place);

            $place->facilities()->syncWithoutDetaching([$facility->id]);
        }

        return back()->with('success', "\"{$facility->name}\" ditambahkan.");
    }

    /**
     * Replace the facility set attached to a place.
     */
    public function sync(Request $request, SurveyPlace $place): RedirectResponse
    {
        $this->authorize('update', $place);

        $data = $request->validate([
            'facilities' => ['array'],
            'facilities.*' => ['integer', 'exists:facilities,id'],
        ]);

        $ids = Facility::availableTo($request->user())
            ->whereIn('id', $data['facilities'] ?? [])
            ->pluck('id')
            ->all();

        $place->facilities()->sync($ids);

        return back()->with('success', 'Fasilitas diperbarui.');
    }

    public function destroy(Request $request, Facility $facility): RedirectResponse
    {
        abort_unless($facility->user_id === $request->user()->id, 403);

        $facility->delete();

        return back()->with('success', 'Fasilitas dihapus.');
    }
}
