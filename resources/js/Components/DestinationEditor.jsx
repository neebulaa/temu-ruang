import { router, useForm } from '@inertiajs/react';
import { MapPin, Target } from 'lucide-react';
import { useState } from 'react';
import LocationField from './LocationField';
import Modal from './Modal';
import { Field, Input } from './Ui';

/**
 * A list's destination is just a reference point for measuring distance, so it
 * is set here rather than being asked for when the list is created.
 */
export default function DestinationEditor({ list }) {
    const [open, setOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: list.destination?.name ?? '',
        address: list.destination?.address ?? '',
        latitude: list.destination?.latitude ?? null,
        longitude: list.destination?.longitude ?? null,
        // Tujuan tidak menyimpan tautannya — hanya dipakai untuk membaca koordinat.
        maps_url: '',
    });

    // Mengosongkan nama = menghapus tujuan, tapi itu tidak terlihat dari form,
    // jadi disediakan tombolnya sendiri.
    const remove = () => {
        router.put(
            `/surveys/${list.id}/destination`,
            { name: '' },
            { preserveScroll: true, onSuccess: () => setOpen(false) },
        );
    };

    const submit = (event) => {
        event.preventDefault();

        put(`/surveys/${list.id}/destination`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex max-w-full items-center gap-2 rounded-full px-2 py-1 text-sm text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            >
                {list.destination ? (
                    <>
                        <MapPin className="size-4 shrink-0 text-muted" strokeWidth={2} />
                        <span className="truncate">{list.destination.name}</span>
                    </>
                ) : (
                    <>
                        <Target className="size-4 shrink-0 text-muted" strokeWidth={2} />
                        <span className="text-muted">Atur tujuan</span>
                    </>
                )}
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Tujuan"
                description="Titik acuan: kampus, kantor, stasiun. Jarak diukur dari sini, bukan untuk mencari tempat."
            >
                <form onSubmit={submit} className="space-y-5">
                    <Field label="Nama" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="BINUS University"
                            autoFocus
                        />
                    </Field>

                    <LocationField
                        label="Tautan Google Maps"
                        mapsUrl={data.maps_url}
                        latitude={data.latitude}
                        longitude={data.longitude}
                        address={data.address}
                        embedUrl={list.destination?.maps_embed_url ?? null}
                        onChange={setData}
                        errors={errors}
                        height="h-52"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row-reverse">
                        <button type="submit" disabled={processing} className="btn-primary flex-1">
                            {processing ? 'Menyimpan…' : 'Simpan tujuan'}
                        </button>
                        {list.destination && (
                            <button
                                type="button"
                                onClick={remove}
                                className="btn-ghost hover:text-danger"
                            >
                                Hapus tujuan
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </>
    );
}
