<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CompareController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\MapsLinkController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\SurveyListController;
use App\Http\Controllers\SurveyPlaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);

    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // The survey lists ARE the home page — there is no landing or stats screen.
    Route::get('/', [SurveyListController::class, 'index'])->name('home');
    Route::get('/surveys', fn () => redirect('/'))->name('surveys.index');
    Route::get('/surveys/create', [SurveyListController::class, 'create'])->name('surveys.create');
    Route::post('/surveys', [SurveyListController::class, 'store'])->name('surveys.store');
    Route::get('/surveys/{survey}', [SurveyListController::class, 'show'])->name('surveys.show');
    Route::get('/surveys/{survey}/edit', [SurveyListController::class, 'edit'])->name('surveys.edit');
    Route::put('/surveys/{survey}', [SurveyListController::class, 'update'])->name('surveys.update');
    Route::delete('/surveys/{survey}', [SurveyListController::class, 'destroy'])->name('surveys.destroy');
    Route::put('/surveys/{survey}/destination', [SurveyListController::class, 'updateDestination'])->name('surveys.destination');

    // Places live under a list when created, and stand alone once they exist.
    Route::get('/surveys/{survey}/places/create', [SurveyPlaceController::class, 'create'])->name('places.create');
    Route::post('/surveys/{survey}/places', [SurveyPlaceController::class, 'store'])->name('places.store');
    Route::get('/places/{place}', [SurveyPlaceController::class, 'show'])->name('places.show');
    Route::get('/places/{place}/edit', [SurveyPlaceController::class, 'edit'])->name('places.edit');
    Route::put('/places/{place}', [SurveyPlaceController::class, 'update'])->name('places.update');
    Route::delete('/places/{place}', [SurveyPlaceController::class, 'destroy'])->name('places.destroy');
    Route::patch('/places/{place}/surveyed', [SurveyPlaceController::class, 'toggleSurveyed'])->name('places.surveyed');

    // Documentation
    Route::post('/places/{place}/media', [MediaController::class, 'store'])->name('media.store');
    Route::patch('/media/{medium}', [MediaController::class, 'update'])->name('media.update');
    Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');

    // Findings
    Route::post('/places/{place}/ratings', [RatingController::class, 'store'])->name('ratings.store');

    // Facilities
    Route::post('/facilities', [FacilityController::class, 'store'])->name('facilities.store');
    Route::delete('/facilities/{facility}', [FacilityController::class, 'destroy'])->name('facilities.destroy');
    Route::post('/places/{place}/facilities', [FacilityController::class, 'sync'])->name('facilities.sync');

    // Reads coordinates out of a pasted Google Maps link.
    // This is the only location input there is — see PROJECT_CONTEXT §13.
    Route::post('/maps-link', MapsLinkController::class)->name('maps-link');

    // Decision support
    Route::get('/map', MapController::class)->name('map');
    Route::get('/compare', CompareController::class)->name('compare');

    // Settings
    Route::get('/settings', [ProfileController::class, 'edit'])->name('settings');
    Route::put('/settings/profile', [ProfileController::class, 'update'])->name('settings.profile');
    Route::put('/settings/accent', [ProfileController::class, 'updateAccent'])->name('settings.accent');
    Route::put('/settings/password', [ProfileController::class, 'updatePassword'])->name('settings.password');
    Route::delete('/settings/account', [ProfileController::class, 'destroy'])->name('settings.destroy');
});
