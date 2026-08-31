<?php

namespace App\Http\Controllers;

use App\Models\SurveyPlace;
use App\Support\TemuRuang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    /**
     * Replace the whole rating sheet for a place in one submit.
     */
    public function store(Request $request, SurveyPlace $place): RedirectResponse
    {
        $this->authorize('update', $place);

        $data = $request->validate([
            'ratings' => ['required', 'array'],
            'ratings.*' => ['nullable', 'integer', 'between:1,5'],
        ]);

        foreach (array_keys(TemuRuang::RATING_CRITERIA) as $criteria) {
            $score = $data['ratings'][$criteria] ?? null;

            if ($score === null) {
                $place->ratings()->where('criteria', $criteria)->delete();

                continue;
            }

            $place->ratings()->updateOrCreate(['criteria' => $criteria], ['score' => $score]);
        }

        return back()->with('success', 'Penilaian disimpan.');
    }
}
