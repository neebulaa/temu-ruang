import { useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { StarInput, Stars } from './Stars';

/** The full rating sheet for a place — saved in one submit. */
export default function RatingSheet({ place, criteria }) {
    const initial = useMemo(
        () =>
            Object.fromEntries(
                criteria.map((item) => [item.value, place.ratings?.[item.value] ?? null]),
            ),
        [criteria, place.ratings],
    );

    const { data, setData, post, processing, isDirty } = useForm({ ratings: initial });

    const scores = Object.values(data.ratings).filter((score) => score !== null);
    const overall = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;

    const submit = (event) => {
        event.preventDefault();
        post(`/places/${place.id}/ratings`, { preserveScroll: true });
    };

    return (
        <form onSubmit={submit}>
            <ul className="divide-y divide-line">
                {criteria.map((item) => (
                    <li key={item.value} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                        <span className="text-sm text-ink-soft">{item.label}</span>
                        <StarInput
                            name={item.label}
                            value={data.ratings[item.value]}
                            // Functional form so two quick clicks never read the same stale snapshot.
                            onChange={(score) =>
                                setData((current) => ({
                                    ...current,
                                    ratings: { ...current.ratings, [item.value]: score },
                                }))
                            }
                        />
                    </li>
                ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-sunken px-4 py-3">
                <div>
                    <p className="text-xs tracking-wide text-muted uppercase">Nilai keseluruhan</p>
                    <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink tabular-nums">
                        {overall === null ? '–' : `${overall.toFixed(1)} / 5`}
                    </p>
                </div>
                <Stars value={overall} size="size-4" />
            </div>

            <button type="submit" disabled={processing || !isDirty} className="btn-primary mt-4 w-full">
                {processing ? 'Menyimpan…' : isDirty ? 'Simpan penilaian' : 'Penilaian tersimpan'}
            </button>
        </form>
    );
}
