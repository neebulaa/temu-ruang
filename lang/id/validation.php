<?php

/*
 * Only the rules TemuRuang actually uses are translated. Laravel falls back to
 * the English file for anything not listed here.
 */
return [
    'accepted' => ':attribute harus disetujui.',
    'after' => ':attribute harus tanggal setelah :date.',
    'after_or_equal' => ':attribute harus tanggal setelah atau sama dengan :date.',
    'array' => ':attribute harus berupa daftar.',
    'before' => ':attribute harus tanggal sebelum :date.',
    'between' => [
        'array' => ':attribute harus berisi antara :min sampai :max item.',
        'file' => 'Ukuran :attribute harus antara :min sampai :max kilobyte.',
        'numeric' => ':attribute harus antara :min sampai :max.',
        'string' => ':attribute harus antara :min sampai :max karakter.',
    ],
    'boolean' => ':attribute harus bernilai ya atau tidak.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'current_password' => 'Kata sandi salah.',
    'date' => ':attribute bukan tanggal yang valid.',
    'email' => ':attribute harus berupa alamat email yang valid.',
    'exists' => ':attribute yang dipilih tidak valid.',
    'file' => ':attribute harus berupa berkas.',
    'gte' => [
        'numeric' => ':attribute harus lebih besar atau sama dengan :value.',
    ],
    'image' => ':attribute harus berupa gambar.',
    'in' => ':attribute yang dipilih tidak valid.',
    'integer' => ':attribute harus berupa angka bulat.',
    'max' => [
        'array' => ':attribute maksimal :max item.',
        'file' => 'Ukuran :attribute maksimal :max kilobyte.',
        'numeric' => ':attribute maksimal :max.',
        'string' => ':attribute maksimal :max karakter.',
    ],
    'mimetypes' => 'Tipe berkas :attribute tidak didukung.',
    'mimes' => ':attribute harus berupa berkas bertipe: :values.',
    'min' => [
        'array' => ':attribute minimal :min item.',
        'file' => 'Ukuran :attribute minimal :min kilobyte.',
        'numeric' => ':attribute minimal :min.',
        'string' => ':attribute minimal :min karakter.',
    ],
    'numeric' => ':attribute harus berupa angka.',
    'required' => ':attribute wajib diisi.',
    'required_with' => ':attribute wajib diisi bila ada :values.',
    'string' => ':attribute harus berupa teks.',
    'unique' => ':attribute sudah digunakan.',
    'url' => ':attribute harus berupa tautan yang valid.',

    'password' => [
        'letters' => ':attribute harus mengandung minimal satu huruf.',
        'mixed' => ':attribute harus mengandung huruf besar dan kecil.',
        'numbers' => ':attribute harus mengandung minimal satu angka.',
        'symbols' => ':attribute harus mengandung minimal satu simbol.',
        'uncompromised' => ':attribute pernah bocor di kebocoran data. Pilih yang lain.',
    ],

    'custom' => [
        'password' => [
            'confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ],
    ],

    /*
     * Field names as the user sees them, so messages read naturally.
     */
    'attributes' => [
        'name' => 'Nama',
        'email' => 'Email',
        'password' => 'Kata sandi',
        'password_confirmation' => 'Konfirmasi kata sandi',
        'current_password' => 'Kata sandi saat ini',
        'address' => 'Alamat',
        'contact' => 'Kontak',
        'source_url' => 'Tautan sumber',
        'price_min' => 'Harga terendah',
        'price_max' => 'Harga tertinggi',
        'latitude' => 'Lintang',
        'longitude' => 'Bujur',
        'is_surveyed' => 'Status survei',
        'notes' => 'Catatan',
        'facilities' => 'Fasilitas',
        'note' => 'Catatan',
        'status' => 'Status',
        'category' => 'Kategori',
        'caption' => 'Deskripsi',
        'files' => 'Berkas',
        'q' => 'Kata kunci',
        'places' => 'Tempat',
    ],
];
