import { Link } from '@inertiajs/react';
import { ArrowRight, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import GoogleMap from './GoogleMap';
import { Stars } from './Stars';
import { Badge, Card, cn } from './Ui';
import { formatDistance, formatPriceRange, placeDistanceKm } from '../lib/format';
import { SURVEYED_STYLES } from '../lib/status';

/**
 * Menelusuri banyak tempat di peta Google, satu per satu.
 *
 * Embed tanpa API key hanya bisa menampilkan **satu** lokasi — penanda ganda
 * butuh Maps JavaScript API yang berbayar. Jadi alih-alih semua pin sekaligus,
 * di sini tempat dipilih dari daftar dan petanya mengikuti.
 */
export default function PlaceMapBrowser({
    places = [],
    destination = null,
    className = 'h-[45vh] min-h-[15rem] lg:h-[60vh]',
}) {
    const mappable = useMemo(() => places.filter((place) => place.maps_embed_url), [places]);

    const [selected, setSelected] = useState(
        () => (destination?.maps_embed_url ? 'destination' : mappable[0]?.id) ?? null,
    );

    const showingDestination = selected === 'destination' && Boolean(destination?.maps_embed_url);

    /*
     * Filter di halaman daftar bisa membuang tempat yang sedang dipilih. Tanpa
     * mundur ke pilihan pertama, petanya jadi kosong padahal masih ada tempat
     * yang cocok.
     */
    const active = showingDestination
        ? null
        : (mappable.find((place) => place.id === selected) ?? mappable[0] ?? null);

    const src = showingDestination ? destination.maps_embed_url : (active?.maps_embed_url ?? null);
    const title = showingDestination ? destination.name : (active?.name ?? 'Peta');

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
                <GoogleMap
                    src={src}
                    title={`${title} di Google Maps`}
                    link={active?.maps_url ?? null}
                    target={
                        showingDestination
                            ? { latitude: destination.latitude, longitude: destination.longitude }
                            : active
                              ? { latitude: active.latitude, longitude: active.longitude }
                              : null
                    }
                    className={className}
                    empty="Belum ada tempat yang punya lokasi."
                />

                {active && (
                    <Link
                        href={`/places/${active.id}`}
                        className="group mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink"
                    >
                        Buka {active.name}
                        <ArrowRight
                            className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5"
                            strokeWidth={2}
                        />
                    </Link>
                )}
            </div>

            {/*
             * Di ponsel daftarnya ikut mengalir bersama halaman. Kotak bergulir
             * setinggi layar di dalam halaman yang juga bergulir membuat jempol
             * harus menebak mana yang sedang digeser.
             */}
            <Card className="divide-y divide-line lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
                {destination?.maps_embed_url && (
                    <button
                        type="button"
                        onClick={() => setSelected('destination')}
                        aria-pressed={showingDestination}
                        className={cn(
                            'flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors first:rounded-t-2xl',
                            showingDestination ? 'bg-accent-soft' : 'hover:bg-sunken',
                        )}
                    >
                        <Target
                            className={cn('size-4 shrink-0', showingDestination ? 'text-accent-ink' : 'text-muted')}
                            strokeWidth={2}
                        />
                        <span className="min-w-0">
                            <span className="block text-[0.7rem] font-medium text-muted uppercase">Tujuan</span>
                            <span
                                className={cn(
                                    'block truncate text-sm font-medium',
                                    showingDestination ? 'text-accent-ink' : 'text-ink',
                                )}
                            >
                                {destination.name}
                            </span>
                        </span>
                    </button>
                )}

                {places.map((place) => {
                    const locatable = Boolean(place.maps_embed_url);
                    const isActive = active?.id === place.id;

                    return (
                        <button
                            key={place.id}
                            type="button"
                            disabled={!locatable}
                            onClick={() => setSelected(place.id)}
                            aria-pressed={isActive}
                            className={cn(
                                'flex w-full gap-3 px-4 py-3.5 text-left transition-colors last:rounded-b-2xl',
                                isActive && 'bg-accent-soft',
                                !isActive && locatable && 'hover:bg-sunken',
                                !locatable && 'cursor-not-allowed opacity-55',
                            )}
                        >
                            {place.cover_url && (
                                <img
                                    src={place.cover_url}
                                    alt=""
                                    className="size-14 shrink-0 rounded-lg border border-line object-cover"
                                />
                            )}

                            <span className="min-w-0 flex-1">
                                <span
                                    className={cn(
                                        'block truncate text-sm font-medium',
                                        isActive ? 'text-accent-ink' : 'text-ink',
                                    )}
                                >
                                    {place.name}
                                </span>

                                <span className="mt-0.5 block text-xs text-muted">
                                    {locatable ? (
                                        <>
                                            {formatPriceRange(place.price_min, place.price_max) ?? 'Tanpa harga'}
                                            {placeDistanceKm(place) !== null && (
                                                <> · {formatDistance(placeDistanceKm(place))}</>
                                            )}
                                        </>
                                    ) : (
                                        'Belum ada lokasi'
                                    )}
                                </span>

                                <span className="mt-1.5 flex items-center gap-2">
                                    <Badge className={SURVEYED_STYLES[place.is_surveyed]}>
                                        {place.is_surveyed ? 'Sudah disurvei' : 'Belum'}
                                    </Badge>
                                    <Stars value={place.overall_score} showValue />
                                </span>
                            </span>
                        </button>
                    );
                })}
            </Card>
        </div>
    );
}
