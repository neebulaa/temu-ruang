<?php

namespace App\Http\Requests;

use App\Support\GoogleMapsLink;
use Illuminate\Foundation\Http\FormRequest;

class SurveyPlaceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:120'],
            'source_url' => ['nullable', 'url', 'max:255'],

            /*
             * Host-checked, not just URL-shaped: this value is rendered into an
             * <iframe src> and fetched server-side when expanding short links,
             * so anything off Google's domains has to be refused here.
             */
            'maps_url' => [
                'nullable', 'string', 'max:2048',
                fn (string $attribute, mixed $value, \Closure $fail) => GoogleMapsLink::isValid($value)
                    ? null
                    : $fail('Tautan harus berasal dari Google Maps.'),
            ],
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:999999999999', 'gte:price_min'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'is_surveyed' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],

            'facilities' => ['array'],
            'facilities.*' => ['integer', 'exists:facilities,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'price_max.gte' => 'Harga tertinggi harus lebih besar atau sama dengan terendah.',
        ];
    }
}
