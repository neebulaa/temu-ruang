<?php

namespace App\Http\Controllers;

use App\Models\SurveyList;
use App\Models\SurveyPlace;
use App\Support\Theme;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $listIds = SurveyList::ownedBy($user)->pluck('id');

        return Inertia::render('Settings/Index', [
            'stats' => [
                'lists' => $listIds->count(),
                'places' => SurveyPlace::whereIn('survey_list_id', $listIds)->count(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        if ($user->email !== $data['email']) {
            $user->email_verified_at = null;
        }

        $user->fill($data)->save();

        return back()->with('success', 'Profil diperbarui.');
    }

    /**
     * Warna aksen disimpan sendiri, bukan bersama nama dan email.
     *
     * Pemilihnya menyimpan seketika saat diklik — memaksa pengguna menekan
     * "Simpan" setelah memilih warna hanya menambah langkah untuk sesuatu yang
     * hasilnya sudah langsung terlihat di layar.
     */
    public function updateAccent(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'accent' => ['required', 'string', Rule::in(array_keys(Theme::THEMES))],
        ]);

        $request->user()->update(['accent' => $data['accent']]);

        return back()->with('success', 'Warna aplikasi diperbarui.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update(['password' => $data['password']]);

        return back()->with('success', 'Kata sandi diperbarui.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Akunmu telah dihapus.');
    }
}
