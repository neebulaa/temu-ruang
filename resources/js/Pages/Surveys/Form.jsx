import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, Target } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import LocationField from '../../Components/LocationField';
import { Card, Field, Input, PageHeader, cn } from '../../Components/Ui';

export default function Form({ list }) {
    const editing = Boolean(list);

    const { data, setData, post, put, processing, errors } = useForm({
        name: list?.name ?? '',
        destination_name: '',
        destination_address: '',
        destination_latitude: null,
        destination_longitude: null,
        maps_url: '',
    });

    // Ditutup dulu: tujuan itu opsional, jadi jangan menghalangi jalan tercepat.
    const [showDestination, setShowDestination] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        if (editing) {
            put(`/surveys/${list.id}`);
        } else {
            post('/surveys');
        }
    };

    const backHref = editing ? `/surveys/${list.id}` : '/';

    return (
        <AppLayout>
            <Head title={editing ? `Ubah nama ${list.name}` : 'Daftar survei baru'} />

            <Link
                href={backHref}
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" strokeWidth={2} />
                {editing ? 'Kembali ke daftar' : 'Survei Saya'}
            </Link>

            <PageHeader
                title={editing ? 'Ubah nama daftar' : 'Daftar survei baru'}
                description={
                    editing
                        ? null
                        : 'Beri nama keputusan yang sedang kamu ambil. Sisanya diisi sambil jalan.'
                }
            />

            <form onSubmit={submit} className="space-y-6">
                <Card className="p-6">
                    <Field label="Nama daftar" error={errors.name} required>
                        <Input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Kos dekat BINUS"
                            autoFocus
                            required
                        />
                    </Field>
                </Card>

                {/*
                 * Tujuan hanya ditawarkan saat membuat daftar. Saat mengubah nama,
                 * tujuan sudah punya tempatnya sendiri di halaman daftar.
                 */}
                {!editing && (
                    <Card className={cn('overflow-hidden', showDestination && 'p-6')}>
                        <button
                            type="button"
                            onClick={() => setShowDestination((open) => !open)}
                            aria-expanded={showDestination}
                            className={cn(
                                'flex w-full items-center gap-3 text-left transition-colors',
                                showDestination ? 'mb-5' : 'px-6 py-5 hover:bg-sunken',
                            )}
                        >
                            <Target className="size-4 shrink-0 text-muted" strokeWidth={2} />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-ink">
                                    Tujuan <span className="font-normal text-muted">(opsional)</span>
                                </span>
                                <span className="mt-0.5 block text-xs text-muted">
                                    Kampus, kantor, atau stasiun. Jarak tiap tempat diukur dari sini.
                                </span>
                            </span>
                            <ChevronDown
                                className={cn(
                                    'size-4 shrink-0 text-muted transition-transform',
                                    showDestination && 'rotate-180',
                                )}
                                strokeWidth={2}
                            />
                        </button>

                        {showDestination && (
                            <div className="space-y-5">
                                <Field label="Nama tujuan" error={errors.destination_name}>
                                    <Input
                                        value={data.destination_name}
                                        onChange={(event) => setData('destination_name', event.target.value)}
                                        placeholder="BINUS University"
                                    />
                                </Field>

                                <LocationField
                                    label="Tautan Google Maps"
                                    mapsUrl={data.maps_url}
                                    latitude={data.destination_latitude}
                                    longitude={data.destination_longitude}
                                    address={data.destination_address}
                                    height="h-52"
                                    errors={{
                                        maps_url: errors.maps_url,
                                        address: errors.destination_address,
                                    }}
                                    /*
                                     * LocationField menulis latitude/longitude/address
                                     * apa adanya; di sini namanya berawalan destination_,
                                     * jadi hasilnya dipetakan ulang.
                                     */
                                    onChange={(update) =>
                                        setData((current) => {
                                            const next = update({
                                                ...current,
                                                latitude: current.destination_latitude,
                                                longitude: current.destination_longitude,
                                                address: current.destination_address,
                                            });

                                            return {
                                                ...current,
                                                maps_url: next.maps_url,
                                                destination_latitude: next.latitude,
                                                destination_longitude: next.longitude,
                                                destination_address: next.address,
                                            };
                                        })
                                    }
                                />
                            </div>
                        )}
                    </Card>
                )}

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                    <button type="submit" disabled={processing} className="btn-primary sm:px-8">
                        {processing ? 'Menyimpan…' : editing ? 'Simpan nama' : 'Buat daftar'}
                    </button>
                    <Link href={backHref} className="btn-secondary">
                        Batal
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}
