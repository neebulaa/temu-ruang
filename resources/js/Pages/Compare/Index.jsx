import { Head, Link, router } from '@inertiajs/react';
import { Check, Columns3, ImageOff, Minus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Stars } from '../../Components/Stars';
import { Badge, Card, EmptyState, IconButton, PageHeader, Select, ToggleChip, cn } from '../../Components/Ui';
import { formatDistance, formatPriceRange, placeDistanceKm } from '../../lib/format';
import { SURVEYED_STYLES } from '../../lib/status';

/**
 * Ids holding the best value in a row. `lowerIsBetter` flips the comparison,
 * and a row where fewer than two places have a value has no winner at all —
 * being the only one who filled a field is not a win.
 */
function bestIds(places, valueOf, lowerIsBetter = false) {
    const scored = places
        .map((place) => ({ id: place.id, value: valueOf(place) }))
        .filter((entry) => entry.value !== null && entry.value !== undefined);

    if (scored.length < 2) return new Set();

    const best = lowerIsBetter
        ? Math.min(...scored.map((entry) => entry.value))
        : Math.max(...scored.map((entry) => entry.value));

    return new Set(scored.filter((entry) => entry.value === best).map((entry) => entry.id));
}

/** One comparison row: a sticky label plus a cell per place. */
function Row({ label, places, render, winners, align = 'top' }) {
    return (
        <tr className="border-t border-line">
            <th
                scope="row"
                className="sticky left-0 z-10 bg-surface px-4 py-3 text-left align-top text-xs font-medium text-ink-soft"
            >
                {label}
            </th>
            {places.map((place) => {
                const won = winners?.has(place.id);

                return (
                    <td
                        key={place.id}
                        className={cn(
                            'px-4 py-3 text-sm text-ink-soft',
                            align === 'middle' && 'align-middle',
                            align === 'top' && 'align-top',
                            won && 'bg-accent-soft text-accent-ink',
                        )}
                    >
                        <span className={cn('flex items-start gap-1.5', won && 'font-medium')}>
                            {won && <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />}
                            <span className="min-w-0">{render(place)}</span>
                        </span>
                    </td>
                );
            })}
        </tr>
    );
}

/** Full-width divider that names the block of rows below it. */
function SectionRow({ label, span }) {
    return (
        <tr className="border-t border-line">
            <th
                scope="row"
                colSpan={span}
                className="sticky left-0 bg-sunken px-4 py-2 text-left text-[0.7rem] font-medium tracking-[0.08em] text-muted uppercase"
            >
                {label}
            </th>
        </tr>
    );
}

/** Small accent chip naming something a place is best at. */
function WinChip({ children }) {
    return (
        <span className="inline-flex items-center rounded-lg bg-accent-soft px-2 py-0.5 text-[0.7rem] font-medium text-accent-ink">
            {children}
        </span>
    );
}

function Dash() {
    return <span className="text-muted">–</span>;
}

export default function Index({ lists, selectedList, places, selectedIds, vocab }) {
    const [chosen, setChosen] = useState(
        selectedIds?.length ? selectedIds : places.slice(0, 3).map((place) => place.id),
    );

    const comparing = places.filter((place) => chosen.includes(place.id));

    const toggle = (id) =>
        setChosen((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );

    const winners = useMemo(
        () => ({
            price: bestIds(comparing, (p) => p.price_min ?? p.price_max, true),
            distance: bestIds(comparing, (p) => placeDistanceKm(p), true),
            score: bestIds(comparing, (p) => p.overall_score),
            facilities: bestIds(comparing, (p) => p.facilities?.length || null),
            criteria: Object.fromEntries(
                vocab.ratingCriteria.map((criteria) => [
                    criteria.value,
                    bestIds(comparing, (p) => p.ratings?.[criteria.value] ?? null),
                ]),
            ),
        }),
        [comparing, vocab.ratingCriteria],
    );

    /*
     * Facilities compare far better as a checklist than as a comma-separated
     * list per column: one row per facility anyone has, so a gap is a gap you
     * can actually see.
     */
    const facilityRows = useMemo(() => {
        const seen = new Map();

        comparing.forEach((place) =>
            (place.facilities ?? []).forEach((facility) => seen.set(facility.id, facility.name)),
        );

        return [...seen]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'id'));
    }, [comparing]);

    const facilityIds = useMemo(
        () =>
            Object.fromEntries(
                comparing.map((place) => [place.id, new Set((place.facilities ?? []).map((f) => f.id))]),
            ),
        [comparing],
    );

    /** The chips shown under a place's name — what this column wins. */
    const winsFor = (place) =>
        [
            winners.price.has(place.id) && 'Termurah',
            winners.distance.has(place.id) && 'Terdekat',
            winners.score.has(place.id) && 'Nilai tertinggi',
            winners.facilities.has(place.id) && 'Fasilitas terbanyak',
        ].filter(Boolean);

    return (
        <AppLayout>
            <Head title="Bandingkan" />

            <PageHeader
                eyebrow="Bandingkan"
                title="Sandingkan pilihan terbaikmu"
                description="Setiap tempat jadi satu kolom, setiap hal yang kamu catat jadi satu baris. Nilai terbaik di tiap baris disorot ungu."
                actions={
                    lists.length > 0 && (
                        <Select
                            value={selectedList?.id ?? ''}
                            onChange={(event) => router.get('/compare', { list: event.target.value })}
                            options={lists.map((list) => ({
                                value: list.id,
                                label: `${list.name} (${list.places_count})`,
                            }))}
                            className="w-56"
                        />
                    )
                }
            />

            {places.length === 0 ? (
                <EmptyState
                    icon={Columns3}
                    title="Belum ada yang bisa dibandingkan"
                    description="Tambahkan minimal dua tempat ke daftar survei, lalu kembali ke sini."
                    action={
                        <Link href="/" className="btn-primary">
                            Buka daftar survei
                        </Link>
                    }
                />
            ) : (
                <>
                    {/* ------------------------------------------------ pemilih */}
                    <Card className="mb-6 p-5">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-medium text-ink-soft">Tempat yang dibandingkan</p>
                            <p className="text-xs text-muted">
                                <span className="tabular-nums">{comparing.length}</span> dari{' '}
                                <span className="tabular-nums">{places.length}</span> dipilih
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {places.map((place) => {
                                const active = chosen.includes(place.id);

                                return (
                                    <ToggleChip
                                        key={place.id}
                                        active={active}
                                        onClick={() => toggle(place.id)}
                                    >
                                        {active && <Check className="size-3.5" strokeWidth={2.5} />}
                                        {place.name}
                                    </ToggleChip>
                                );
                            })}
                        </div>
                    </Card>

                    {comparing.length < 2 ? (
                        <EmptyState
                            icon={Columns3}
                            title="Pilih minimal dua tempat"
                            description="Perbandingan butuh dua kolom. Pilih beberapa kandidat di atas untuk menyandingkannya."
                        />
                    ) : (
                        <>
                            <Card className="overflow-x-auto">
                                <table
                                    className="w-full table-fixed border-collapse text-left"
                                    style={{ minWidth: `${9 + comparing.length * 11}rem` }}
                                >
                                    {/*
                                     * table-fixed + a sized label column keeps every
                                     * place column exactly the same width. Without it
                                     * the browser hands all the slack to the first
                                     * column and its photo balloons.
                                     */}
                                    <colgroup>
                                        <col className="w-36" />
                                    </colgroup>

                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-surface px-4 py-4" />
                                            {comparing.map((place) => {
                                                const wins = winsFor(place);

                                                return (
                                                    <td key={place.id} className="px-4 py-4 align-top">
                                                        {/*
                                                         * Capped width: with only two places a
                                                         * column is wide, and an uncapped photo
                                                         * would stretch into a letterbox strip.
                                                         */}
                                                        <div className="relative max-w-64">
                                                            <Link
                                                                href={`/places/${place.id}`}
                                                                className="group block"
                                                            >
                                                                <span className="block aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-sunken">
                                                                    {place.cover_url ? (
                                                                        <img
                                                                            src={place.cover_url}
                                                                            alt={place.name}
                                                                            className="size-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="grid size-full place-items-center text-muted">
                                                                            <ImageOff
                                                                                className="size-5"
                                                                                strokeWidth={1.25}
                                                                            />
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="mt-2.5 block text-sm font-semibold text-ink group-hover:underline">
                                                                    {place.name}
                                                                </span>
                                                            </Link>

                                                            <IconButton
                                                                icon={X}
                                                                label={`Keluarkan ${place.name} dari perbandingan`}
                                                                tone="surface"
                                                                size="sm"
                                                                className="absolute top-1.5 right-1.5 bg-surface/90"
                                                                onClick={() => toggle(place.id)}
                                                            />
                                                        </div>

                                                        <Badge
                                                            className={cn(
                                                                'mt-2',
                                                                SURVEYED_STYLES[place.is_surveyed],
                                                            )}
                                                        >
                                                            {place.is_surveyed ? 'Sudah disurvei' : 'Belum'}
                                                        </Badge>

                                                        {wins.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {wins.map((win) => (
                                                                    <WinChip key={win}>{win}</WinChip>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {/* ------------------------------------- data */}
                                        <SectionRow label="Data" span={comparing.length + 1} />

                                        <Row
                                            label="Harga"
                                            places={comparing}
                                            winners={winners.price}
                                            render={(place) =>
                                                formatPriceRange(place.price_min, place.price_max) ?? <Dash />
                                            }
                                        />
                                        <Row
                                            label={
                                                selectedList?.destination
                                                    ? `Jarak ke ${selectedList.destination.name}`
                                                    : 'Jarak'
                                            }
                                            places={comparing}
                                            winners={winners.distance}
                                            render={(place) => formatDistance(placeDistanceKm(place)) ?? <Dash />}
                                        />
                                        <Row
                                            label="Alamat"
                                            places={comparing}
                                            render={(place) =>
                                                place.address ? (
                                                    <span className="text-xs leading-relaxed">
                                                        {place.address}
                                                    </span>
                                                ) : (
                                                    <Dash />
                                                )
                                            }
                                        />
                                        <Row
                                            label="Catatan"
                                            places={comparing}
                                            render={(place) =>
                                                place.notes ? (
                                                    <span className="line-clamp-4 text-xs leading-relaxed whitespace-pre-line">
                                                        {place.notes}
                                                    </span>
                                                ) : (
                                                    <Dash />
                                                )
                                            }
                                        />

                                        {/* -------------------------------- penilaian */}
                                        <SectionRow label="Penilaianmu" span={comparing.length + 1} />

                                        <Row
                                            label="Keseluruhan"
                                            places={comparing}
                                            winners={winners.score}
                                            align="middle"
                                            render={(place) =>
                                                place.overall_score !== null ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-base font-semibold tabular-nums">
                                                            {place.overall_score.toFixed(1)}
                                                        </span>
                                                        <Stars value={place.overall_score} />
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">Belum dinilai</span>
                                                )
                                            }
                                        />

                                        {vocab.ratingCriteria.map((criteria) => (
                                            <Row
                                                key={criteria.value}
                                                label={criteria.label}
                                                places={comparing}
                                                winners={winners.criteria[criteria.value]}
                                                align="middle"
                                                render={(place) =>
                                                    place.ratings?.[criteria.value] ? (
                                                        <Stars value={place.ratings[criteria.value]} />
                                                    ) : (
                                                        <Dash />
                                                    )
                                                }
                                            />
                                        ))}

                                        {/* -------------------------------- fasilitas */}
                                        <SectionRow label="Fasilitas" span={comparing.length + 1} />

                                        <Row
                                            label="Jumlah"
                                            places={comparing}
                                            winners={winners.facilities}
                                            align="middle"
                                            render={(place) =>
                                                place.facilities?.length ? (
                                                    <span className="tabular-nums">
                                                        {place.facilities.length}
                                                    </span>
                                                ) : (
                                                    <Dash />
                                                )
                                            }
                                        />

                                        {facilityRows.length === 0 ? (
                                            <tr className="border-t border-line">
                                                <td
                                                    colSpan={comparing.length + 1}
                                                    className="px-4 py-3 text-xs text-muted"
                                                >
                                                    Belum ada fasilitas yang dicentang di tempat-tempat ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            facilityRows.map((facility) => (
                                                <Row
                                                    key={facility.id}
                                                    label={facility.name}
                                                    places={comparing}
                                                    align="middle"
                                                    render={(place) =>
                                                        facilityIds[place.id]?.has(facility.id) ? (
                                                            <Check
                                                                className="size-4 text-mint-ink"
                                                                strokeWidth={2.5}
                                                                aria-label="Ada"
                                                            />
                                                        ) : (
                                                            <Minus
                                                                className="size-4 text-muted"
                                                                strokeWidth={2}
                                                                aria-label="Tidak ada"
                                                            />
                                                        )
                                                    }
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Card>

                            <p className="mt-3 text-xs text-muted">
                                Sel bersorot ungu adalah nilai terbaik di barisnya. Baris yang hanya diisi satu
                                tempat tidak dihitung menang.
                            </p>
                        </>
                    )}
                </>
            )}
        </AppLayout>
    );
}
