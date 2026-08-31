<?php

namespace App\Policies;

use App\Models\SurveyList;
use App\Models\User;

class SurveyListPolicy
{
    public function view(User $user, SurveyList $list): bool
    {
        return $list->user_id === $user->id;
    }

    public function update(User $user, SurveyList $list): bool
    {
        return $list->user_id === $user->id;
    }

    public function delete(User $user, SurveyList $list): bool
    {
        return $list->user_id === $user->id;
    }
}
