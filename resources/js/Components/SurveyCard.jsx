import { Link } from '@inertiajs/react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { pastelFor } from '../lib/palette';
import { cn } from './Ui';

/**
 * A survey list reads as one solid pastel card — the list itself is the
 * content, not a tile summarising numbers about it.
 */
export default function SurveyCard({ list }) {
    const tone = pastelFor(list.id);
    const done = list.places_count > 0 && list.surveyed_count === list.places_count;

    return (
        <Link
            href={`/surveys/${list.id}`}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all',
                ' hover:',
                tone.bg,
            )}
        >
            <span className="mb-4 flex items-start justify-between gap-3">
                <span className={cn('size-3 rounded-full', tone.bar)} />
                <ArrowUpRight
                    className={cn(
                        'size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5',
                        tone.text,
                    )}
                    strokeWidth={2}
                />
            </span>

            <h3 className="text-xl leading-snug text-ink">{list.name}</h3>

            <p className="mt-1 text-sm text-ink-soft">
                {list.places_count} tempat
                {list.places_count > 0 && (
                    <>
                        <span className="mx-1.5 opacity-40">·</span>
                        {done ? 'semua disurvei' : `${list.surveyed_count} disurvei`}
                    </>
                )}
            </p>

            {list.places_count > 0 && (
                <span className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-surface/70">
                    <span
                        className={cn('rounded-full transition-[width] duration-500', tone.bar)}
                        style={{ width: `${list.progress}%` }}
                    />
                </span>
            )}

            {list.destination && (
                <span className="mt-5 inline-flex max-w-full items-center gap-1 self-start rounded-full bg-surface/70 px-2.5 py-1 text-xs text-ink-soft">
                    <MapPin className="size-3 shrink-0" strokeWidth={2} />
                    <span className="truncate">{list.destination.name}</span>
                </span>
            )}
        </Link>
    );
}
