<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SurveyListRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],

            /*
             * Tujuan boleh diisi di sini atau nanti dari halaman daftar. Ia
             * hanya titik acuan untuk mengukur jarak, jadi seluruhnya opsional.
             */
            'destination_name' => ['nullable', 'string', 'max:180'],
            'destination_address' => ['nullable', 'string', 'max:255'],
            'destination_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'destination_longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
