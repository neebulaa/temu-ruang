<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\SurveyPlace;
use App\Support\TemuRuang;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MediaController extends Controller
{
    public function store(Request $request, SurveyPlace $place): RedirectResponse
    {
        $this->authorize('update', $place);

        $data = $request->validate([
            // Tidak ditanyakan lagi saat mengunggah — memilih area sambil
            // berdiri di lokasi hanya memperlambat. Kolomnya tetap ada untuk
            // data lama, dan bisa diubah lewat PATCH bila suatu saat perlu.
            'category' => ['sometimes', Rule::in(array_keys(TemuRuang::MEDIA_CATEGORIES))],
            'files' => ['required', 'array', 'max:20'],
            'files.*' => [
                'file',
                'mimetypes:image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm',
                'max:51200', // 50 MB
            ],
        ]);

        $position = (int) $place->media()->max('position');

        foreach ($data['files'] as $file) {
            $isVideo = str_starts_with((string) $file->getMimeType(), 'video/');

            $path = $file->store("places/{$place->id}", 'public');

            $place->media()->create([
                'type' => $isVideo ? 'video' : 'photo',
                'category' => $data['category'] ?? 'other',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'position' => ++$position,
            ]);
        }

        // Jumlahnya ikut disebut: mengunggah beberapa kali berturut-turut jadi
        // punya bunyi yang berbeda, bukan kalimat sama yang membingungkan.
        $count = count($data['files']);

        return back()->with(
            'success',
            $count === 1 ? 'Dokumentasi diunggah.' : "{$count} dokumentasi diunggah."
        );
    }

    public function update(Request $request, Media $medium): RedirectResponse
    {
        $this->authorize('update', $medium->surveyPlace);

        $data = $request->validate([
            'category' => ['sometimes', Rule::in(array_keys(TemuRuang::MEDIA_CATEGORIES))],
            'caption' => ['sometimes', 'nullable', 'string', 'max:300'],
            'is_cover' => ['sometimes', 'boolean'],
        ]);

        if (($data['is_cover'] ?? false) && $medium->type === 'photo') {
            $medium->surveyPlace->media()->where('id', '!=', $medium->id)->update(['is_cover' => false]);
        }

        $medium->update($data);

        return back()->with('success', 'Media diperbarui.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        $this->authorize('update', $medium->surveyPlace);

        Storage::disk('public')->delete($medium->path);
        $medium->delete();

        return back()->with('success', 'Media dihapus.');
    }
}
