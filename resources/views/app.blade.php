<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#f7f6f4">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="TemuRuang: rencanakan, survei, catat, dan bandingkan tempat yang kamu datangi.">

        {{-- Ikon aplikasi: tanda TemuRuang yang sama dengan <BrandMark />. --}}
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
        {{-- Ikut warna pilihan pengguna; berkasnya terpisah per tema, jadi cache tidak bentrok. --}}
        <link rel="icon" href="/favicon-{{ App\Support\Theme::resolve(auth()->user()?->accent) }}.png" type="image/png" sizes="64x64">
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <title inertia>{{ config('app.name', 'TemuRuang') }}</title>

        {{-- Ditulis sebelum aset: kalau lewat JS, halaman berkedip warna bawaan dulu. --}}
        <style>{!! App\Support\Theme::cssVariables(auth()->user()?->accent) !!}</style>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-canvas font-sans">
        @inertia
    </body>
</html>
