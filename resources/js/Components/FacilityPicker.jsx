import { useForm } from '@inertiajs/react';
import { Check, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ToggleChip } from './Ui';

const slugify = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

/**
 * Multi-select over the shared facility presets plus the user's own additions.
 * New facilities are created server-side so they persist across places.
 */
export default function FacilityPicker({ facilities, selected = [], onChange, placeId = null }) {
    const [adding, setAdding] = useState(false);
    const pendingSlug = useRef(null);
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        survey_place_id: placeId,
    });

    const toggle = (id) =>
        onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

    // A facility the user just created should come back already ticked.
    useEffect(() => {
        if (!pendingSlug.current) return;

        const created = facilities.find((facility) => facility.slug === pendingSlug.current);
        if (!created) return;

        pendingSlug.current = null;

        if (!selected.includes(created.id)) {
            onChange([...selected, created.id]);
        }
    }, [facilities, selected, onChange]);

    const addFacility = (event) => {
        event.preventDefault();

        const name = data.name.trim();
        if (!name) return;

        pendingSlug.current = slugify(name);

        post('/facilities', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                reset('name');
                setAdding(false);
            },
            onError: () => {
                pendingSlug.current = null;
            },
        });
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {facilities.map((facility) => {
                    const active = selected.includes(facility.id);

                    return (
                        <ToggleChip key={facility.id} active={active} onClick={() => toggle(facility.id)}>
                            {active && <Check className="size-3" strokeWidth={2.5} />}
                            {facility.name}
                        </ToggleChip>
                    );
                })}

                {!adding && (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink-soft hover:bg-line hover:text-ink"
                    >
                        <Plus className="size-3" strokeWidth={2.5} />
                        Tambah fasilitas
                    </button>
                )}
            </div>

            {adding && (
                <div className="mt-3 flex items-start gap-2">
                    <div className="flex-1">
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && addFacility(event)}
                            placeholder="Water heater, rooftop, taman…"
                            className="field"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={addFacility}
                        disabled={processing}
                        className="btn-primary shrink-0 !py-2.5"
                    >
                        Tambah
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            reset('name');
                            setAdding(false);
                        }}
                        className="btn-ghost shrink-0 !py-2.5"
                    >
                        Batal
                    </button>
                </div>
            )}
        </div>
    );
}
