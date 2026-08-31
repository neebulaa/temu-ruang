import { Link } from '@inertiajs/react';
import { Camera, MapPin, Video } from 'lucide-react';
import { formatDistance, formatPriceRange, placeDistanceKm } from '../lib/format';
import { SURVEYED_STYLES } from '../lib/status';
import { Stars } from './Stars';
import { Badge, cn } from './Ui';

export default function PlaceCard({ place, selectable = false, selected = false, onToggle }) {
    const price = formatPriceRange(place.price_min, place.price_max);
    const distance = formatDistance(placeDistanceKm(place));

    return (
        <article
            className={cn(
                'card group relative overflow-hidden transition-all',
                selected ? 'border-accent ring-2 ring-accent/30' : ' hover:',
            )}
        >
            {selectable && (
                <label className="absolute top-3 left-3 z-10 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle?.(place.id)}
                        className="peer sr-only"
                    />
                    <span className="grid size-7 place-items-center rounded-xl border-2 border-line bg-surface/95 text-transparent transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white">
                        <svg viewBox="0 0 20 20" fill="none" className="size-4">
                            <path
                                d="m5 10.5 3.5 3.5L15 7"
                                stroke="currentColor"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </label>
            )}

            <Link href={`/places/${place.id}`} className="block">
                <div className="relative m-2.5 aspect-[4/3] overflow-hidden rounded-xl bg-sunken">
                    {place.cover_url ? (
                        <img
                            src={place.cover_url}
                            alt={place.name}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                    ) : (
                        <span className="grid size-full place-items-center text-muted">
                            <MapPin className="size-6" strokeWidth={1.5} />
                        </span>
                    )}

                    <span className="absolute top-2.5 right-2.5">
                        <Badge className={cn('backdrop-blur-sm', SURVEYED_STYLES[place.is_surveyed])}>
                            {place.is_surveyed ? 'Sudah disurvei' : 'Belum'}
                        </Badge>
                    </span>

                    {(place.photos_count > 0 || place.videos_count > 0) && (
                        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                            {place.photos_count > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-ink/65 px-2 py-0.5 text-[0.65rem] font-medium text-white">
                                    <Camera className="size-3" strokeWidth={2.5} />
                                    {place.photos_count}
                                </span>
                            )}
                            {place.videos_count > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-ink/65 px-2 py-0.5 text-[0.65rem] font-medium text-white">
                                    <Video className="size-3" strokeWidth={2.5} />
                                    {place.videos_count}
                                </span>
                            )}
                        </span>
                    )}
                </div>

                <div className="px-4 pt-1.5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 truncate text-[0.95rem] text-ink">{place.name}</h3>
                        <Stars value={place.overall_score} showValue className="shrink-0" />
                    </div>

                    <p className="mt-1 text-sm font-medium text-accent-ink">
                        {price ?? <span className="text-xs font-normal text-muted">Harga belum dicatat</span>}
                    </p>

                    {(distance || place.address) && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                            <MapPin className="size-3.5 shrink-0" strokeWidth={2.2} />
                            <span className="truncate">
                                {distance ? `${distance} ke tujuan` : place.address}
                            </span>
                        </p>
                    )}

                    {place.facilities?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {place.facilities.slice(0, 3).map((facility) => (
                                <span key={facility.id} className="chip !px-2 !py-0.5 text-[0.65rem]">
                                    {facility.name}
                                </span>
                            ))}
                            {place.facilities.length > 3 && (
                                <span className="chip !px-2 !py-0.5 text-[0.65rem]">
                                    +{place.facilities.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>
        </article>
    );
}
