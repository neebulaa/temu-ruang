# TemuRuang — Project Context

> Paste this file into a new chat to pick the project up cold. It describes what
> TemuRuang is, how it is built, the decisions already made, and what is left.

---

## 1. What TemuRuang is

**TemuRuang is a personal survey workspace.** The user brings their own candidate
places — found on Google Maps, Instagram, a listing site, from a friend, or by
walking past — and TemuRuang organises the *survey* of those places: locations,
photos, notes, ratings and comparison.

**Tagline:** Plan. Survey. Document. Compare.

### What it is NOT

TemuRuang is **not** a marketplace, property listing site, kos-search engine, or
booking platform. It never searches for or recommends places. If a feature idea
implies "find places for the user", it is out of scope by definition.

### The core object

A **Survey List** = one decision. It holds the candidate **Places** plus an
optional **Destination** (a campus, office, station) used *only* as a reference
point for measuring distance — never for finding places.

```
Survey List: "Kos Dekat BINUS"   destination: BINUS University
  ├── Kos Melati          Surveyed     ★4.5   550 m
  ├── Kos Anggrek         Surveyed     ★4.3   940 m
  ├── Kos Pak Hendra      Surveyed     ★3.7   1.4 km
  ├── Kos Griya Asri      Not surveyed —      780 m
  └── Kos Sari Indah      Not surveyed —      420 m
```

### Place status is a single toggle

```
Not surveyed  ⇄  Surveyed
```

- `SurveyPlace::markSurveyed(bool)` stamps `surveyed_at` on the way in and
  clears it on the way out.
- Surveyed places drive the list progress bar (`SurveyList::surveyedCount()`).
- There is no scheduled/reviewed/selected state. An earlier five-state flow was
  replaced on request — do not reintroduce it.

---

## 2. Stack

| Layer     | Choice                                          |
| --------- | ----------------------------------------------- |
| Backend   | Laravel 13 (PHP 8.5 locally, requires 8.3+)     |
| Bridge    | Inertia.js 3 (`inertiajs/inertia-laravel` ^3.3) |
| Frontend  | React 19 + Vite 8 + Tailwind CSS 4              |
| Database  | MySQL (XAMPP, `root` / no password, db `nestory`) |

> The database and the project folder are still named `nestory` — only the product
> name changed. Renaming either is a separate job and would need the data copied over.
| Maps      | Google Maps embeds, keyless (`output=embed`) — no Leaflet |
| Locations | Read from pasted Google Maps links (`POST /maps-link`) |
| Icons     | lucide-react                                    |
| Fonts     | Quicksand + Plus Jakarta Sans via Bunny         |
| Bahasa    | Indonesian (`APP_LOCALE=id`, `lang/id/*`)      |
| Storage   | Laravel `public` disk + `storage:link`          |

There is **no Ziggy** — routes are plain path strings in JSX (`/surveys/${id}`).

`JsonResource::withoutWrapping()` is set in `AppServiceProvider` so Inertia props
arrive as plain arrays with no `data` envelope.

---

## 3. Local setup

```bash
composer install && npm install
```

```bash
php artisan migrate --seed && php artisan storage:link
```

```bash
php artisan serve
```

`npm run dev` for HMR, `npm run build` for production assets.

**Demo account:** `demo@temuruang.test` / `password`

⚠️ `php artisan db:seed` **wipes and recreates all survey lists and destinations
belonging to `demo@temuruang.test`** (only that account). Other accounts are
untouched. Do not re-seed if that demo data has been edited by hand.

`.env` essentials:

```
APP_TIMEZONE=Asia/Jakarta
DB_CONNECTION=mysql
DB_DATABASE=nestory
DB_USERNAME=root
DB_PASSWORD=
FILESYSTEM_DISK=public
```

`config/app.php` was changed to read `env('APP_TIMEZONE', 'UTC')` — stock
Laravel 13 hardcodes `'UTC'`.

---

## 4. Navigation model — IMPORTANT

**There is no landing page and no stats dashboard.** This was an explicit product
decision: the user opens the URL and is immediately in the tool.

- `/` **is** the survey-list index (`SurveyListController@index`), rendering
  `Pages/Surveys/Index.jsx`, which is a plain header + search/filters + a grid of
  solid pastel list cards.
- `/surveys` 301s to `/` (kept so old links do not break).
- `Pages/Welcome.jsx`, `Pages/Dashboard.jsx` and `DashboardController` were
  **deleted**. Do not reintroduce them.
- `/` carries no status line. It used to show the next scheduled visit; that
  went with scheduling and nothing replaced it — progress lives inline on each
  list card as a thin bar.
- Login/register still exist because survey data is personal and per-user. Auth
  redirects go to `/`.

### There is no sidebar

The shell is an **app layout, not an admin panel**: a sticky top bar (brand +
avatar + log out) and a floating pill dock centred at the bottom of the viewport,
identical on mobile and desktop. A fixed left rail was tried and rejected — it is
the thing that made the app read as a dashboard.

**Every page uses one container width: `max-w-5xl` (1024px).** The top bar and
the content share it, so nothing shifts when navigating between screens. There is
no `wide` prop any more, and pages must not add their own `max-w-*` wrapper —
a form card spans the same width as the page header above it.

(Modals are the exception: they size themselves via the `size` prop.)

Dock (4 items, one nav for every breakpoint) — the label only renders for the
active tab, keeping it compact:

| Item    | Href        | Active for                    |
| ------- | ----------- | ----------------------------- |
| Surveys | `/`         | `/`, `/surveys*`, `/places*`  |
| Map     | `/map`      | `/map`                        |
| Compare | `/compare`  | `/compare`                    |
| Me      | `/settings` | `/settings`                   |

It was five items until visit scheduling was removed — see §12.

Because the column is ~768px, **narrow pages are single-column** — the old
`lg:grid-cols-[1fr_22rem]` form layouts were stacked. Only `wide` pages use
side-by-side columns.

`AppLayout` resolves the active tab via `isActive(href, path)`.

---

## 5. Design language

**Flat, quiet, and Indonesian.** The palette is still pastel, but the chrome is
neutral and the decoration is gone.

**Rules that keep it from drifting back to a generic "AI" look:**

- **No drop shadows anywhere.** There are no `shadow-*` tokens left; depth comes
  from a hairline border and the canvas/surface step.
- **A surface gets a border OR a tint, never both plus a shadow.**
- **No blurred colour blobs**, no `backdrop-blur`, no hover lift/translate.
- **No decorative emoji anywhere**, including empty states. `EmptyState` has no
  `emoji` prop any more and `palette.js` no longer carries `CATEGORY_EMOJI` — both
  were removed on 19 Aug 2026 because the emoji made the app read as generated.
  Empty states take a lucide `icon` instead.
- **No em dashes in anything the user reads.** Use a colon, a full stop, or
  parentheses. The one exception is the en dash `–` standing in for an empty
  value in a table cell. This covers seeded demo data too, not just UI strings.
- **One hover rule for every button.** Filled variants darken their fill a clear
  step; outlined and ghost variants gain a `line` fill (and outlined also darkens
  its border). White→`sunken` is a 4% step that read as dead on hover — do not go
  back to it.
- **Selectable pills are `ToggleChip`, icon-only buttons are `IconButton`**, both
  in `Ui.jsx`. The chip pattern had been written five times with five different
  radii, the icon button eleven times. Chips use `rounded-lg`, per the radius rule
  above — not `rounded-full`, which is what the copies had drifted to.
- **Nested radii have to add up.** A chip at 8px inside a container with 4px of
  padding needs a 12px container — the Daftar/Peta switch was left at
  `rounded-full` after the chips moved to 8px, and the active chip read as a box
  jammed inside a capsule.
- **Flash toasts sit top-right, under the app bar** (`top-[4.5rem]`, centred on
  mobile), in a soft tint with a hairline border — not a saturated block bottom-
  centre, which landed in the reading path and covered the dock.
- **Mobile is not an afterthought.** No horizontal page overflow at 375px on any
  screen; wide content scrolls inside its own card. A fixed-height scroll area
  inside the scrolling page is a mobile bug, not a layout — `PlaceMapBrowser`
  only caps and scrolls its list from `lg:` up. Touch targets are at least 36px.
- **No helper text under an input.** `Field` has no `hint` prop any more — it was
  removed on request, along with every use of it. If a field needs explaining,
  the explanation goes in the placeholder, the label, or an empty state where the
  content will appear. It never goes in a line of grey text under the box. The
  same applies to trailing notes under a card ("Kosongkan salah satu jika…").
  Where a hint described an action, give it a button instead — that is how
  "Kosongkan untuk menghapus tujuan" became `DestinationEditor`'s Hapus tujuan.
- Radii are moderate: cards 16px, buttons 12px, chips 8px. Nothing is a full pill
  except avatars.
- Every `<select>` gets its chevron from a single `select.field` rule in
  `app.css` (an inline SVG background), not from a wrapper element — so any new
  dropdown is styled automatically and nothing can conflict with width classes.
- Colour is carried by content (the pastel list cards), not by the chrome.

**No dashboard patterns anywhere.** No stat-tile grids, no metric headlines, no
"here are your numbers" panels. Screens show the user's actual content — lists,
places, notes — and any status is expressed inline (a thin progress bar, one
quiet line of text), never as a widget.

### Language

The whole interface is **Bahasa Indonesia**. Strings are translated in place in
the JSX (there is no runtime i18n layer and no language switcher). Server-side:

- `APP_LOCALE=id`, `APP_FALLBACK_LOCALE=en`
- `lang/id/validation.php` covers the rules actually used, with an `attributes`
  map so messages read as "Nama wajib diisi." rather than "name wajib diisi."
- `lang/id/auth.php` and `lang/id/passwords.php` for auth flows
- Flash messages in controllers are Indonesian literals
- `formatDate` / `formatTime` use the `id-ID` locale; `formatDayLabel` returns
  "Hari ini" / "Besok" / "Kemarin"

If you add a screen, write its strings in Indonesian directly.

### Typography — the part that is easiest to get wrong

Two faces, four weights, and nothing heavier than 700:

| Role                                   | Face              | Weight |
| -------------------------------------- | ----------------- | ------ |
| Page title (`h1`)                      | Quicksand         | 700    |
| Card / section headings (`h2`, `h3`)   | Quicksand         | 600    |
| Buttons, active nav, numbers           | Plus Jakarta Sans | 600    |
| Labels, secondary emphasis, nav        | Plus Jakarta Sans | 500    |
| Body copy, descriptions, all meta text | Plus Jakarta Sans | 400    |

Rules that keep it from turning muddy again:

- `--font-display` (Quicksand) is **only** for display headings. Quicksand's
  strokes thin out badly below ~16px, so anything small uses `font-sans`.
- Small text (`text-xs` and below) is **never** heavier than 500.
- `text-muted` copy is body text — weight 400, never semibold.
- In-card section headings like "Basic information" are UI labels, not display
  type: `text-sm font-medium font-sans`.
- The earlier build set `font-extrabold` on every heading and `font-bold` on most
  body text. It read as shouting. If a change needs emphasis, use colour or size
  before reaching for weight.

### Tokens — `resources/css/app.css` (Tailwind v4 `@theme`)

```
canvas   #fbf8fb    surface  #ffffff    sunken     #f5f1fa
line     #efe9f6    line-strong #ded4ee
ink      #302a42    ink-soft #5f5878    muted      #9c94b0

grape   #8b7cf6  / soft #efeaff / ink #5f49d8    ← brand primary
blossom #ff8bab  / soft #ffe9f1 / ink #d95179
sky     #56b8f0  / soft #e2f3fe / ink #1f83c1
mint    #45cdb2  / soft #daf7f1 / ink #17957c
butter  #fcbf42  / soft #fff4d8 / ink #c4870a
peach   #ff9e6b  / soft #ffeadf / ink #e06f39
```

Semantic aliases point at the pastels, so restyling is a one-file change.
On 19 Aug 2026 the brand moved from grape to the coral of the new logo:
`accent → coral #d94440`, `warn → butter`, `info → sky`, `danger → #a01810`.

The accent is deliberately darker than the logo's own coral (`#ef7a78`): white
text on the logo colour only reaches 2.7:1, while `#d94440` reaches 4.33:1.
`danger` had to go much deeper still, or destructive buttons would have looked
like primary ones.

Two shadow tokens: `shadow-soft` (resting) and `shadow-lift` (hover).

### Component classes (also in `app.css`)

`.card` (28px radius) · `.field` (2px border, pill-ish) · `.label` · `.btn` +
`.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger` (all pill,
`active:scale-[0.97]`) · `.chip` · `.no-scrollbar`

**Tailwind v4 gotcha:** you cannot `@apply` a class defined in the same
`@layer components`. The button base is therefore a grouped selector
(`.btn, .btn-primary, …`) rather than `.btn-primary { @apply btn }`.

### Colour identity per list

`resources/js/lib/palette.js` maps each list id → one of the six pastels
(`pastelFor(id)`), so a list keeps the same colour on the home grid and in its
detail header. It also holds `CATEGORY_EMOJI` and `PLACE_EMOJI`.

### Status colours

`resources/js/lib/status.js` — `PLACE_STATUS_STYLES`, `LIST_STATUS_STYLES`,
`SCHEDULE_STATUS_STYLES`, plus `PLACE_STATUS_FLOW` / `nextPlaceStatus()`.

---

## 6. Database schema

```
users
 ├─ destinations            (name, address, lat, lng)
 └─ survey_lists            (name, description, category, target_location,
     │                       budget_min/max, survey_date, notes, status,
     │                       destination_id)
     └─ survey_places       (name, address, contact, source_url,
         │                   price_min, price_max, lat, lng,
         │                   is_surveyed, notes, surveyed_at, position)
         ├─ media           (type photo|video, category room|bathroom|…,
         │                   path, caption, is_cover, position)
         ├─ ratings         (criteria, score 1–5) unique(place, criteria)
         └─ facilities      (many-to-many via facility_survey_place)
```

### A Survey List has exactly two fields

`name` and an optional `destination_id`. **Creating a list asks for the name and
nothing else.** `description`, `category`, `target_location`, `budget_min/max`,
`survey_date`, `notes` and `status` were all dropped
(migration `2026_02_01_000200_simplify_survey_lists`).

The **destination** survived because distances are measured against it, but it
is no longer part of creation — it is set afterwards from the list page via
`DestinationEditor` (`PUT /surveys/{survey}/destination`). Clearing its name
removes it.

### A Survey Place has exactly these fields

Deliberately trimmed (migration `2026_02_01_000100_simplify_survey_places`):

| Field                    | Notes                                              |
| ------------------------ | -------------------------------------------------- |
| `name`                   | required                                            |
| `is_surveyed`            | **boolean toggle** — the whole survey status        |
| `address` + `lat`/`lng`  | filled by place search or by dropping a pin         |
| `contact`                | the **place's** contact — owner/manager, free text   |
| `price_min`, `price_max` | a range; either side may be blank                   |
| `source_url`             | optional link back to where it was found            |
| `maps_url`               | the place's Google Maps link — see §13              |
| `notes`                  | one plain textarea                                  |
| facilities               | many-to-many                                        |
| media                    | photos + videos, **each with its own description**  |

`maps_url` was added on 18 Aug 2026 at the user's request — it is the one field
added back since the trim, and it was asked for explicitly.

**Creating a list may now also set the destination**, in a collapsed optional
panel (asked for 19 Aug 2026). This softens the earlier "creation asks for the
name and nothing else" rule, but only for the destination and only as an optional
disclosure — the panel starts closed, so the fast path is still just a name.
`SurveyListController::syncDestination()` is shared by creation and the
destination editor, so both treat a blank name the same way: it clears it.

**Removed and not coming back:** `category`, `description`, `source` (the type
dropdown), `phone`, `website`, `price`, `price_period`, the five-state `status`,
and the whole `notes` table (pro/con/general). The old data was folded into
`contact` / `notes` / `is_surveyed` by the migration rather than dropped.

### The standing instruction on fields

The user has trimmed both forms once already. **Do not add fields back, and do
not invent new ones**, unless asked. If a feature seems to need a new field, say
so first rather than adding it. `app/Support/TemuRuang.php` now only holds `MEDIA_CATEGORIES` and
`RATING_CRITERIA` — everything else lost its input.

`facilities.user_id IS NULL` = shared preset available to everyone.
Non-null = that user's custom facility, reusable across their places.
`Facility::availableTo($user)` scopes to "presets + mine".

---

## 7. Backend layout

```
app/
├── Http/Controllers/
│   ├── SurveyListController      index (= home), create, store, show, edit, update, destroy
│   ├── SurveyPlaceController     create, store, show, edit, update, destroy, updateStatus
│   ├── MediaController           store (multi-upload), update (caption/cover), destroy
│   ├── RatingController          store (replaces the whole rating sheet)
│   ├── NoteController            store, update, destroy
│   ├── FacilityController        store (custom), sync (to place), destroy
│   ├── CompareController         __invoke
│   ├── MapController             __invoke
│   ├── MapsLinkController        __invoke (Google Maps link → coordinates)
│   ├── ProfileController         edit, update, updatePassword, destroy
│   └── Auth/                     AuthenticatedSessionController, RegisteredUserController
├── Http/Requests/                SurveyListRequest, SurveyPlaceRequest
├── Http/Resources/               SurveyList, SurveyPlace, Media, Facility
├── Http/Middleware/              HandleInertiaRequests (shares auth, flash)
├── Models/                       SurveyList, SurveyPlace, Destination, Facility,
│                                 Media, Rating, User
├── Policies/                     SurveyListPolicy, SurveyPlacePolicy (ownership only)
└── Support/TemuRuang.php           vocabularies + distanceKm() helper
```

### `app/Support/TemuRuang.php` is the single source of truth

Every vocabulary — place/list statuses, categories, sources, price periods, media
areas, rating criteria, note types, schedule statuses — is defined **once** there.
It feeds both `Rule::in(...)` validation and the `vocab` prop that React uses to
render every dropdown, so options and validation can never drift apart.

`TemuRuang::vocabularies()` returns `{ mediaCategories, ratingCriteria }`, each
`[{ value, label }]`. It used to carry nine keys; the rest lost their inputs.

### Authorisation

Ownership only, via policies. Nested resources check the parent:
`$this->authorize('update', $medium->surveyPlace)`. `allowedFacilityIds()` in
`SurveyPlaceController` prevents attaching another account's custom facility.

---

## 8. Frontend layout

```
resources/js/
├── app.jsx                    Inertia bootstrap, grape progress bar
├── Layouts/
│   ├── AppLayout.jsx          rail + mobile tabs + blurred pastel blobs + Flash
│   └── AuthLayout.jsx         centred card + 4-step explainer
├── Pages/
│   ├── Surveys/Index.jsx      ← THE HOME PAGE (greeting, Coming up, filters, grid)
│   ├── Surveys/Form.jsx       create/edit list + inline destination picker
│   ├── Surveys/Show.jsx       list detail, List/Map toggle, sort, multi-select
│   ├── Places/Form.jsx        create/edit place
│   ├── Places/Show.jsx        4 tabs: Overview / Documentation / Notes & rating / Schedule
│   ├── Map/Index.jsx          all located places + side list
│   ├── Compare/Index.jsx      side-by-side table, best-value highlighting,
│   │                          facility checklist, per-column "wins" chips
│   ├── Settings/Index.jsx     profile, password, custom facilities, delete account
│   └── Auth/Login.jsx, Auth/Register.jsx
├── Components/
│   ├── Ui.jsx                 cn, Card, PageHeader, EmptyState, SectionTitle,
│   │                          Badge, Progress, Input, Textarea, Select, Field, Button
│   ├── GoogleMap.jsx          view-only Google embed (one location)
│   ├── PlaceMapBrowser.jsx    pick a place from a list, the map follows it
│   ├── LocationField.jsx      paste a Maps link → coordinates + preview
│   ├── MediaUploader.jsx      drag-drop / file picker → queue, then upload
│   ├── CameraCapture.jsx      in-app camera: shoot or record, auto-uploads
│   │                          (no area picker — see §14)
│   ├── MediaLightbox.jsx      full-screen viewer, arrows, inline caption
│   ├── MediaGallery.jsx       grid, area filter, set-cover, delete
│   ├── RatingSheet.jsx        6 criteria, saved in one submit
│   ├── FacilityPicker.jsx     toggle presets, add custom inline
│   ├── SurveyCard.jsx, PlaceCard.jsx, Stars.jsx, Modal.jsx, Flash.jsx, Brand.jsx
└── lib/
    ├── format.js              money (IDR), distance, duration, dates, greeting
    ├── status.js              SURVEYED_STYLES, labelFor
    └── palette.js             pastelFor(id), CATEGORY_EMOJI, PLACE_EMOJI
```

---

## 9. Conventions and traps

These were learned the hard way — please keep to them.

1. **Inertia `setData` must use the functional form** when merging into nested
   state: `setData(current => ({ ...current, ratings: {...} }))`. The object form
   reads a stale render closure, so two clicks in one tick silently lose one.
   Bug already fixed in `RatingSheet.jsx` and `Surveys/Form.jsx`.
2. **The map iframe carries `key={src}`.** Changing an iframe's `src` alone does
   not reliably re-render the Google embed — the key forces a remount instead.
   `PlaceMapBrowser` depends on this every time the selection changes.
3. **No nested `<form>`.** `LocationField` and `FacilityPicker` render *inside*
   page forms, so they use `<div>` + `type="button"`, and `LocationField`'s Enter
   handler calls `preventDefault()` before reading the link. A nested form is
   invalid HTML and hijacks the outer submit.
4. **`surveyed_at` is emitted offset-free.** `SurveyPlaceResource` formats with
   `'Y-m-d\TH:i:s'` (no `toIso8601String()`) so the browser does not re-interpret
   a wall-clock time against its own zone.
5. **Never `@apply` a same-layer component class** (Tailwind v4). See §5.
6. **Do not edit files with PowerShell `Get-Content`/`Set-Content` round-trips** —
   it mangles UTF-8 (em dashes, curly quotes) into mojibake. Use the editor tools,
   or `[System.IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)`.
7. **Eager-load before serialising places.** `SurveyPlaceResource` calls
   `distanceToDestination()` and `coverPhoto()`, which touch `surveyList` and
   `media`. Controllers load `places.media`, `places.ratings` and then
   `$place->setRelation('surveyList', $list)` to avoid N+1.
8. `Model::preventLazyLoading` is deliberately **off** — `RouteController::plan`
   serialises places without their parent loaded.

---

## 10. Current state

### Done and verified in a browser

Auth (login/register/logout, throttled) · survey list CRUD with search and
filters · place CRUD · price + period · facilities incl. custom · location via
pin/drag/search/current-location · photo **and** video upload filed by area ·
cover photo · lightbox · notes · 6-criterion rating with auto overall ·
surveyed toggle with `surveyed_at` stamping · list & map views · global map ·
comparison (best-value highlighting, facility checklist, per-column win chips) ·
settings (profile, password, custom facilities, delete account).

`vendor/bin/pint` passes. `npm run build` is clean.

### Known limitations (deliberate, documented)

- **Distances are road distances when the routing service answers**, and
  straight-line haversine when it does not. `App\Support\RoadDistance` calls
  OSRM — no API key, no account — using its `table` service, so one request
  covers a whole list rather than one per place. Results are cached 30 days,
  keyed by the coordinates themselves, so moving a pin recomputes but renaming
  does not. `placeDistanceKm()` in `lib/format.js` is what the UI reads: road
  first, haversine as fallback.

  Google has no free equivalent. Distance Matrix, Directions and Routes all
  require a key **and** an active billing account, and the keyless embed cannot
  be read from JavaScript because it is cross-origin.
- **Maps need no configuration.** No API key, no account, no OpenStreetMap. Every
  map is a keyless Google `output=embed` iframe and every location comes from a
  pasted Google Maps link. See §13.
- **One location per map.** A keyless embed cannot draw several markers, so `/map`
  and the list map view select a place and show that one. Drawing every pin on a
  single canvas needs the paid Maps JavaScript API.
- **Demo photos are GD-generated placeholders** — the repo ships no photography.
- Videos upload and play but are not transcoded or thumbnailed.
- Uploads use the local `public` disk; production should repoint that disk at
  object storage (no code change needed).
- No tests yet.

### Not built (post-MVP backlog)

In-browser video **recording** · export (PDF/CSV) · AI decision assistant ·
sharing a survey list with another person · offline capture.

---

## 11. If you are asked to change the design again

Almost everything routes through two files:

- `resources/css/app.css` — palette, radii, shadows, `.card` / `.btn-*` / `.field`
- `resources/js/lib/palette.js` — the per-list pastel rotation and emoji

Changing the six pastel hex values plus `--color-accent` restyles the entire app
without touching a single page component. Typography is likewise centralised:
`--font-sans` / `--font-display` in `app.css` plus the `bunny(...)` entries in
`vite.config.js`.

And whatever the change: **do not reintroduce a dashboard.** That means all of:

1. No landing/marketing page — `/` is the tool.
2. No stats screen, stat-tile grids, or metric headlines.
3. **No sidebar shell.** No fixed left rail, no `lg:pl-64` content offset. The
   nav is the bottom dock, at every breakpoint.

The user has raised this three times; items 1–3 are the same objection.

---

## 12. Scheduling was removed — do not bring it back

Everything to do with *kunjungan* (planning a visit) was deleted on request:

| Gone                              | Was                                        |
| --------------------------------- | ------------------------------------------ |
| `/schedule`, `Schedule/Index.jsx` | itinerary grouped by day                   |
| `/route`, `/route/plan`, `Route/Index.jsx` | nearest-neighbour visiting order  |
| `ScheduleController`, `RouteController` | —                                    |
| `SurveySchedule`, `ScheduleResource` | —                                       |
| `survey_schedules` table          | dropped by `2026_08_18_000100_drop_survey_schedules` |
| "Jadwal" tab + hero button on `Places/Show` | per-place visit list and form    |
| "Jadwal" dock item                | fifth nav entry                            |
| "Kunjungan berikutnya" line on `/` | the home page's only status row            |
| `SCHEDULE_STATUSES`, `SCHEDULE_STATUS_STYLES` | scheduled/visited/skipped/rescheduled |
| `formatDayLabel`, `formatTime`, `toDateTimeLocal` | date helpers that only fed those screens |
| `MapView`'s `routeOrder` prop + `Polyline` | the route line                    |

The drop migration folds any place with a `visited` schedule into `is_surveyed`
first, so nothing the user recorded was lost.

**The reasoning:** TemuRuang documents a survey that already happened. Deciding
*when* to go is calendar work, and the user's own calendar does it better. If a
feature idea needs a date field on a place, raise it before building it.

---

## 13. Maps: Google only, keyless, view-only

On 18 Aug 2026 the user asked for Leaflet and OpenStreetMap to go entirely —
"cukup pakai gmaps tanpa registrasi saja dan mau view saja". This section is the
whole of TemuRuang's map story.

### What was removed

`leaflet` and `react-leaflet` (npm), `MapView.jsx`, `LocationPicker.jsx`,
`lib/tiles.js`, `GeocodeController` and `GET /geocode`, the `.leaflet-*` rules and
the Leaflet CSS import in `app.css`, the `map` shared prop and
`HandleInertiaRequests::tiles()`, the `services.here` and `services.google`
config, and `HERE_API_KEY` / `HERE_TILE_API_KEY` / `HERE_TILE_STYLE` /
`GOOGLE_PLACES_API_KEY` from `.env`.

The HERE integration had been added one turn earlier, in answer to "is there a
map API with fresher data than OpenStreetMap". This request supersedes it. **Do
not reintroduce a tile provider or a geocoding service.**

### How a location gets in

Two ways, and neither is a search box.

1. **Paste a Google Maps link.** `LocationField` reads it by itself half a second
   after the field stops changing — there used to be an "Ambil lokasi" button for
   this, removed on 19 Aug 2026. The name was actively misleading (it sounded
   like *your* location) and the step was pointless: once a link is in the field,
   reading it is the only sensible next move. `MapsLinkController` returns the
   coordinates, the place name and an embed URL.
2. **"Lokasi saya"**, which really does mean the user's own GPS position. Useful
   when standing in front of the place. It clears the link field, since the pin
   no longer comes from one.

**There is deliberately no place-search box.** Asked for on 19 Aug 2026 and
declined after laying out the options: Google's own autocomplete needs a key and
a billing account; a keyless search means OpenStreetMap suggestions, which is the
stale-POI problem that started this whole thread; and searching straight in the
embed shows Google's real result but cannot hand back coordinates, because the
iframe is cross-origin. The user searches in the Google Maps app, where the data
is freshest, and pastes.

Coordinates are still stored on the place — `distanceToDestination()` needs them,
and that is what feeds the Jarak row in Bandingkan.

Pin-dropping and pin-dragging are **gone and cannot come back** without a paid
key: the Google iframe is opaque to the parent page, so it can neither report a
click nor accept a marker.

### How a map gets shown

```
https://www.google.com/maps?q=<lat>,<lng>&z=17&hl=id&output=embed
```

`output=embed` needs **no API key**. Verified in a browser: the iframe loads, no
`X-Frame-Options` refusal, both by coordinate and by place-name query.

`SurveyPlace::mapsEmbedUrl()` prefers coordinates parsed out of `maps_url`, then
falls back to the stored pin — so a place with only coordinates (all the seeded
demo data) still gets a map. Destinations get one built straight from their
coordinates in `SurveyListResource` and `MapController`.

**One embed shows one location.** Several custom markers need the Maps JavaScript
API, which needs a key and billing. So `PlaceMapBrowser` replaced the old
multi-pin canvas on `/map` and on the list detail's Peta view: a list on the
right, one map on the left, and the map follows the selection. The destination
sits at the top of that list as its own row.

A short link (`maps.app.goo.gl`) **cannot be framed** — it 302s to a page that
refuses embedding — so `embedUrl()` returns null for one, and the resolve step
expands it to a full URL before an embed is built.

### `App\Support\GoogleMapsLink`

| Method          | Does                                                        |
| --------------- | ----------------------------------------------------------- |
| `isValid()`     | host whitelist — Google domains only                         |
| `coordinates()` | `!3d!4d` → `q=`/`ll=` → `@lat,lng`, in that order             |
| `placeName()`   | the name in `/maps/place/<Name>/`, to prefill an empty address |
| `isShortLink()` | `maps.app.goo.gl`, `goo.gl`                                  |
| `expand()`      | follows a short link, re-checking the host at every hop      |
| `embedUrl()`    | builds the frameable URL                                     |

**Coordinate precedence matters.** `!3d…!4d…` is the pin Google actually dropped;
`@lat,lng,zoom` is only the centre of the viewport when the link was made. They
differ by ~300 m on a typical link, so `@` is the last resort, never the first.

### Two gates, not one

`maps_url` reaches an `<iframe src>` and is fetched server-side, so the host
whitelist is enforced in **both** `SurveyPlaceRequest` (on save) and
`MapsLinkController` (on resolve). `maps_embed_url` is built in the resources,
never assembled in JSX. `google.com.evil.com` and `javascript:` are both
rejected; there are checks for exactly those.

### Caveat worth remembering

`output=embed` is **not** Google's documented Embed API (that one is free without
usage caps, but still wants a key and a billing account). It works and needs no
registration, but Google can change it. If it ever breaks, the fallback is a key
plus `maps/embed/v1/place` — not a return to OpenStreetMap.

### Showing the user's own position

`GoogleMap` takes an optional `target` and then offers **Rute dari lokasi saya**.
It reads the position with `navigator.geolocation` — a browser feature, free, and
nothing to do with the paid Places API — and swaps the iframe for a keyless
directions embed (`?saddr=…&daddr=…&output=embed`, verified to frame without a
key).

**Live tracking is not possible in our own map and never will be without paying.**
The embed is an opaque iframe: nothing can be drawn on it, so there is no moving
blue dot. The route it draws is a single snapshot. Real tracking is handed off to
the Google Maps app via `directionsAppUrl()` — no start point is sent, so Google
uses the device's live position and does turn-by-turn properly.

Geolocation needs a secure context, exactly like the camera: HTTPS or localhost.
Denied permission and insecure origins each get their own message.

### This is not place search

The user pastes a link they already have. TemuRuang still never searches for or
recommends places — see §1.

---

## 14. Media capture

### The area/category is no longer asked for

`MEDIA_CATEGORIES` still exists and the `media.category` column still holds it,
but **neither upload path asks for it any more** — choosing "Kamar / Dapur /
Parkir" while standing in a room with a phone in one hand was pure friction, and
the native `<select>` looked wrong over the dark camera UI. New uploads default
to `other` server-side (`MediaController@store`, where `category` is now
`sometimes` rather than `required`).

`MediaGallery` still filters by area, and that filter self-hides when fewer than
two areas are present — so places documented from now on simply never show it,
while older places keep their grouping. Do not re-add a category picker to the
upload flow.

### The camera

`CameraCapture` is full-screen: shutter, Foto/Video toggle, front/back switch.
It uploads the moment you shoot and **stays open**, counting what it sent, since
documenting a place means several angles in a row.

- Photo → canvas → `image/jpeg`. Video → `MediaRecorder`, capped at 60 s so the
  file cannot pass the server's 50 MB limit.
- Audio is only requested in video mode; if the mic is denied the recording
  continues silently rather than failing.
- `getUserMedia` requests only `width: { ideal: 1920 }`. Pinning `1080` height
  too made portrait phones hand back a landscape frame that showed as a thin
  strip in a tall black box.

**`getUserMedia` needs a secure context — HTTPS or localhost.** On Laragon's
plain-http `.test` domains the browser refuses, so the component detects it and
falls back to a `capture` file input, which still opens the phone's own camera
app. That fallback is the only path that has been verified end-to-end in a
browser here; camera access is blocked in the test harness.

### The viewer

`MediaLightbox` is the full-screen overlay: arrow keys and on-screen arrows,
Escape, a counter, cover/delete actions, page scroll locked while open, and the
description editable inline without leaving the image. Descriptions stay
optional everywhere.

---

## 15. Accent colour is a user setting

Settings → **Warna aplikasi** lets each account pick the app's accent. Seven
options, defined once in `App\Support\Theme`.

### Why a closed list, not a colour picker

1. **Contrast.** Primary buttons put white text on the accent. Every option here
   was measured at 4.0:1 or better (coral 4.33, grape 4.40, blossom 4.39, sky
   4.16, mint 4.02, butter 4.56, peach 4.21). A free picker lets someone choose
   pale yellow and make their own buttons unreadable.
2. **The logo.** The mark is a raster — the user's own artwork — so it cannot be
   recoloured in CSS. Each theme needs a file built ahead of time.

### How it applies

`Theme::cssVariables()` is written into a `<style>` by Blade, before the app CSS
loads, so the page never flashes the default colour first.

**Changing it forces a full reload.** That is deliberate. Blade writes the tokens
into the document shell, and an Inertia visit does not re-render the shell — so
without a reload the colour would not change at all. A JS override was tried
first and does not work: setting `--color-accent` on `:root` (or on the Blade
style element) updates the computed variable at both root and element, yet the
already-computed `background-color` is not repainted, because the app stylesheet
comes from a different origin under the Vite dev server. Do not "fix" the reload
away without checking that case.

### The wordmark

`Brand` sets "Temu" in ink and "Ruang" in the accent, in Quicksand 700 — the
rounded face, matching the lettering in the artwork. It was one flat colour in
Plus Jakarta Sans before, which read as a different product's label parked next
to the drawing.

### The logo files

`php tools/build-icons.php resources/brand/mark.png` builds everything from the
single source artwork: favicon.ico (16/32/48), apple-touch-icon, icon-192,
icon-512, `brand-mark.png`, and one `brand-mark-<theme>.png` per accent.

The recolour is hue-based and deliberately narrow — it only touches pixels whose
hue sits in the source's coral range and that are saturated enough to be brand
colour. The dark outline, the cream faces and the map stay exactly as drawn.
`BrandMark` falls back to `brand-mark.png` via `onError` if a variant is missing.

**The favicon follows the setting too.** Normally a favicon is one file per
origin and cached hard, but each theme has its own filename, so the caches never
collide — Blade links `/favicon-<theme>.png` alongside `favicon.ico` as fallback.

**The favicon uses a crop, not the whole artwork.** The full mark has a folded
map, sparkles and a heart; at 16 px they merge into a blob. `pinAndHouse()` drops
the bottom band and lets `squareTrimmed()` recentre what is left, so the favicon
is the pin and the house — still the same drawing, just cropped. `icon-192` and
`icon-512` (the home-screen icon) keep the full artwork and the default colour.

