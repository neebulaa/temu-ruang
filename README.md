# TemuRuang

> **Plan. Survey. Document. Compare.**

A personal survey workspace. You bring the places you want to look at — from Google
Maps, Instagram, a listing site, a friend, a walk around the block — and TemuRuang keeps
the survey itself organised: locations, photos, notes, ratings and comparison.

TemuRuang is **not** a marketplace, a listing platform or a booking tool. It never
searches for places on your behalf.

---

## Stack

| Layer     | Choice                                     |
| --------- | ------------------------------------------ |
| Backend   | Laravel 13 (PHP 8.3+)                      |
| Bridge    | Inertia.js 3                               |
| Frontend  | React 19 + Vite 8 + Tailwind CSS 4         |
| Database  | MySQL                                      |
| Maps      | Google Maps embeds, keyless (`output=embed`)        |
| Locations | Read from Google Maps links the user pastes         |
| Fonts     | Quicksand (display) + Plus Jakarta Sans     |
| Storage   | Laravel `public` disk via `storage:link`   |
| Bahasa    | Indonesian (`APP_LOCALE=id`)               |

---

## Getting started

Requires PHP 8.3+, Composer, Node 20+, and a running MySQL (XAMPP's works as-is).

```bash
composer install
```

```bash
npm install
```

Copy the environment file and generate a key:

```bash
cp .env.example .env
```

```bash
php artisan key:generate
```

Create the database (XAMPP defaults — user `root`, no password):

```bash
mysql -u root -e "CREATE DATABASE nestory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

Then migrate, link storage and seed the worked example:

```bash
php artisan migrate --seed
```

```bash
php artisan storage:link
```

Run it:

```bash
php artisan serve
```

```bash
npm run dev
```

Open <http://127.0.0.1:8000>.

### Demo account

The seeder creates one account partway through three real surveys.

```
demo@temuruang.test
password
```

Re-running `php artisan db:seed` resets that account's data (and only that account's).

---

### Peta: Google Maps tanpa key, tanpa daftar

TemuRuang tidak punya konfigurasi peta sama sekali. Tidak ada API key, tidak ada
akun, tidak ada billing — dan sejak 18 Agustus 2026, tidak ada OpenStreetMap.

**Cara mengisi lokasi**

1. Cari tempatnya di aplikasi Google Maps.
2. Tekan **Bagikan**, salin tautannya.
3. Tempel di kolom *Tautan Google Maps*, tekan **Ambil lokasi**.

Koordinatnya dibaca dari tautan itu, dan nama tempat di dalamnya mengisi kolom
alamat kalau masih kosong. Google yang melakukan pencarian; TemuRuang cuma
membaca hasilnya.

Tautan pendek (`maps.app.goo.gl`, bentuk yang diberi tombol Bagikan di ponsel)
tidak memuat koordinat, jadi server mengikutinya dulu lewat `POST /maps-link`.

**Cara petanya ditampilkan**

```
https://www.google.com/maps?q=<lat>,<lng>&z=17&hl=id&output=embed
```

Iframe biasa. `output=embed` tidak memerlukan API key.

Dua batasan yang perlu diketahui:

- **Satu embed = satu lokasi.** Penanda ganda butuh Maps JavaScript API yang
  berbayar. Karena itu `/map` dan tampilan Peta di detail daftar bekerja dengan
  cara memilih: klik tempat di daftar, petanya mengikuti.
- **`output=embed` tidak didokumentasikan Google.** Jalan dan gratis, tapi bukan
  Embed API resmi (yang itu gratis tanpa batas kuota, tapi tetap minta key dan
  akun billing). Anggap praktis, bukan jaminan.

**Keamanan**

Tautan yang ditempel masuk ke `<iframe src>` dan di-fetch server saat resolve,
jadi hanya host Google yang diterima — dicek di `SurveyPlaceRequest` saat simpan
dan di `MapsLinkController` saat resolve. URL embed selalu dibangun di server,
tidak pernah dirakit di JSX.

---

## How the app is organised

### The core object: a Survey List

One list per decision. Each holds the candidate places, plus an optional
**destination** — a campus, office or station used purely as a reference point for
measuring distance. It is never used to find places.

```
Survey List: Kos Dekat BINUS
  destination: BINUS University
  ├── Kos Melati          Surveyed      ★4.5   550 m
  ├── Kos Anggrek         Surveyed      ★4.3   940 m
  ├── Kos Pak Hendra      Surveyed      ★3.7   1.4 km
  ├── Kos Griya Asri      Not surveyed  —      780 m
  └── Kos Sari Indah      Not surveyed
```

### A place has one status, and it is a toggle

```
Not surveyed  ⇄  Surveyed
```

Flipping it on stamps `surveyed_at` and counts toward the list's progress bar;
flipping it off clears the stamp. There is no multi-step status flow.

### Schema

```
users
 ├─ destinations
 └─ survey_lists ─── survey_places ─┬─ media          (photos + videos, filed by area)
                                    ├─ ratings        (6 criteria, 1–5, averaged)
                                    └─ facilities     (many-to-many)
```

Facilities with a `null` user_id are shared presets; anything a user adds themselves
is scoped to that user and reusable across their places.

---

## Features

**Survey lists** — a list needs only a name. Search, rename, delete. An optional
**destination** (campus, office, station) can be set from the list page; distances are
measured against it.

**Places** — name, a surveyed / not-surveyed toggle, location, contact, facilities,
price range, a Google Maps link, an optional source link, and notes. Nothing else.

**Location** — paste a **Google Maps link** and press *Ambil lokasi*. The coordinates
are read straight out of the link, and the place name in it prefills an empty address.
Short `maps.app.goo.gl` links — what the Share button gives you on a phone — are
followed server-side first. That is the whole location input: no geocoding service, no
API key, no account anywhere. Distance to the list's destination is computed from the
coordinates.

**Maps** — every map in the app is a keyless Google `output=embed` iframe, view only.
Only Google hosts are accepted, checked both when saving and when resolving, and the
framed URL is always built server-side.

Because a keyless embed shows exactly one location, the map screens work by selection
rather than by showing every pin at once: pick a place in the list and the map follows
it. Multiple custom markers would need the paid Maps JavaScript API.

**Documentation** — an in-app **camera** shoots a photo or records a clip (60 s cap)
and uploads it the moment you let go, so you can work through a place without leaving
the viewfinder. Drag-and-drop and the file picker are still there for shots already on
the device. Everything is filed by room / bathroom / kitchen / parking / facilities /
environment / entrance, and **each file takes its own optional description**. Any photo
can be promoted to the card cover.

**Viewer** — clicking a thumbnail opens a full-screen overlay: arrow keys or on-screen
arrows step through the set, Escape closes, and the description can be written right
there without leaving the image.

The camera needs a secure context — `https://` or `localhost`. On a plain `http://`
host (Laragon's `.test` domains, say) the browser refuses camera access, and the app
falls back to the device's own camera app via a `capture` file input.

**Rating** — location, price, condition, facilities, environment and accessibility,
each 1–5. TemuRuang averages whatever you filled in into an overall score.

**Comparison** — pick any subset of a list and see them side by side: one column per
place, one row per thing you recorded. Price, distance, address and notes; then every
rating criterion; then a facility-by-facility checklist built from whatever the chosen
places have between them. The best value in each row is highlighted, and each column
is labelled with what it wins — cheapest, closest, highest score, most facilities.

**Map view** — every located place as a status-coloured numbered marker, with the
destination as a square marker. Per-list filtering, and a linked side list.

---

## No landing page, no dashboard

Opening the app puts you straight into your survey lists. `/` **is** the working
surface — there is no marketing page to click past and no stats screen to read before
doing anything. Progress is shown inline on each list card — a thin bar, not a widget.

Login still exists, because survey notes are personal.

---

## Design

Flat and quiet. No drop shadows anywhere, no blurred colour washes, no decorative
emoji — depth comes from a hairline border and the step between canvas and surface.
Colour is carried by the content: each survey list is assigned one of six pastels from
its id, so it keeps the same identity on the home grid and in its detail header.

Type is deliberately restrained — Quicksand for display headings, Plus Jakarta Sans
for everything else, and only four weights (400 body / 500 labels / 600 buttons and
card titles / 700 page titles).

The shell is an app layout, not an admin panel: a slim top bar and a floating pill
dock centred at the bottom — the same on phone and desktop. There is no sidebar.

Colour, radius and shadow live as Tailwind v4 theme tokens in `resources/css/app.css`,
and the per-list colour rotation in `resources/js/lib/palette.js` — changing the six
hex values restyles the whole app.

---

## Notes and limitations

- **Distances are straight-line** (haversine), not routed — good for ranking
  candidates, not for travel time.
- **One location per map.** A keyless embed cannot draw several markers, so `/map` and
  the list map view select a place and show that. Seeing every pin on one canvas needs
  the Maps JavaScript API, which needs a key and a billing account.
- **`output=embed` is undocumented.** It works and needs no key, but it is not Google's
  official Embed API, so treat it as convenient rather than guaranteed.
- **Uploads go to the local `public` disk.** For production, point the `public` disk at
  object storage — no application code needs to change.
- **Demo photos are generated placeholders** drawn with GD, since the repo ships no
  real photography.
- Videos are uploaded and played back, but not transcoded or thumbnailed.

---

## Layout

```
app/
├── Http/
│   ├── Controllers/     SurveyList, SurveyPlace, Media, Rating, Facility,
│   │                    Geocode, Compare, Map, Profile, Auth
│   ├── Requests/        SurveyListRequest, SurveyPlaceRequest
│   ├── Resources/       SurveyList, SurveyPlace, Media, Rating-bearing shapes
│   └── Middleware/      HandleInertiaRequests
├── Models/              SurveyList, SurveyPlace, Destination, Facility,
│                        Media, Rating, User
├── Policies/            SurveyListPolicy, SurveyPlacePolicy
└── Support/TemuRuang.php  vocabularies + distance helper, shared with the front end

resources/js/
├── Pages/               Surveys (Index = home), Places, Auth,
│                        Map, Compare, Settings
├── Components/          GoogleMap, PlaceMapBrowser, LocationField, MediaUploader,
│                        MediaGallery, RatingSheet, FacilityPicker, SurveyCard,
│                        PlaceCard, Modal, Flash, Ui
├── Layouts/             AppLayout, AuthLayout
└── lib/                 format.js, status.js, palette.js
```

Every vocabulary (statuses, sources, categories, rating criteria, media areas) is
defined once in `app/Support/TemuRuang.php` and shared to React as `vocab` props, so
validation rules and dropdown options can never drift apart.
