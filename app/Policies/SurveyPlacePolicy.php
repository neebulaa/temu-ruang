<?php

namespace App\Policies;

use App\Models\SurveyPlace;
use App\Models\User;

class SurveyPlacePolicy
{
    public function view(User $user, SurveyPlace $place): bool
    {
        return $place->surveyList->user_id === $user->id;
    }

    public function update(User $user, SurveyPlace $place): bool
    {
        return $place->surveyList->user_id === $user->id;
    }

    public function delete(User $user, SurveyPlace $place): bool
    {
        return $place->surveyList->user_id === $user->id;
    }
}
