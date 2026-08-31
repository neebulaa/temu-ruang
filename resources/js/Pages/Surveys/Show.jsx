import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Columns3, LayoutGrid, Map as MapIcon, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PlaceMapBrowser from '../../Components/PlaceMapBrowser';
import PlaceCard from '../../Components/PlaceCard';
import DestinationEditor from '../../Components/DestinationEditor';
import { ConfirmDialog } from '../../Components/Modal';
import { EmptyState, Select, ToggleChip, cn } from '../../Components/Ui';
import { placeDistanceKm } from '../../lib/format';
import { pastelFor } from '../../lib/palette';

export default function Show({ list, vocab, view: initialView }) {
    const [view, setView] = useState(initialView === 'map' ? 'map' : 'list');
    const [statusFilter, setStatusFilter] = useState('');
    const [sort, setSort] = useState('position');
    const [selection, setSelection] = useState([]);
    const [confirming, setConfirming] = useState(false);

    const places = useMemo(() => {
        let result = [...list.places];

        if (statusFilter) {
            result = result.filter((place) => String(place.is_surveyed) === statusFilter);
        }

        const compare = {
            position: () => 0,
            price_asc: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
            price_desc: (a, b) => (b.price_min ?? -Infinity) - (a.price_min ?? -Infinity),
            score: (a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1),
            distance: (a, b) => (placeDistanceKm(a) ?? Infinity) - (placeDistanceKm(b) ?? Infinity),
        }[sort];

        return sort === 'position' ? result : result.sort(compare);
    }, [list.places, statusFilter, sort]);

    const toggle = (id) =>
        setSelection((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );

    const tone = pastelFor(list.id);

    return (
        <AppLayout>
            <Head title={list.name} />

            <Link
                href="/"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" strokeWidth={2.5} />
                Survei Saya
            </Link>

            {/* ------------------------------------------------------- header */}
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <span className={cn('size-12 shrink-0 rounded-2xl', tone.bar)} />
                    <h1 className="min-w-0 text-2xl text-ink sm:text-3xl">{list.name}</h1>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link href={`/surveys/${list.id}/places/create`} className="btn-primary">
                        <Plus className="size-4" strokeWidth={3} />
                        Tambah tempat
                    </Link>
                    <Link href={`/surveys/${list.id}/edit`} className="btn-secondary">
                        <Pencil className="size-4" strokeWidth={2.5} />
                        Ubah
                    </Link>
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="btn-ghost !px-3 hover:text-danger"
                        aria-label="Hapus daftar"
                    >
                        <Trash2 className="size-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* The list's own facts, inline — not a panel of statistics. */}
            <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-4">
                <span className="flex items-center gap-2.5">
                    <span className="flex h-1.5 w-24 overflow-hidden rounded-full bg-sunken">
                        <span
                            className={cn('rounded-full transition-[width] duration-500', tone.bar)}
                            style={{ width: `${list.progress}%` }}
                        />
                    </span>
                    <span className="text-sm text-ink-soft">
                        <span className="font-medium text-ink tabular-nums">
                            {list.surveyed_count}/{list.places_count}
                        </span>{' '}
                        disurvei
                    </span>
                </span>

                <DestinationEditor list={list} />
            </div>


            {/* -------------------------------------------------------- toolbar */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/*
                 * rounded-xl, bukan rounded-full: chip di dalamnya rounded-lg (8px)
                 * dengan padding 4px, jadi wadahnya harus 12px. Pil penuh membuat
                 * chip aktifnya terlihat seperti kotak yang terjepit di dalam kapsul.
                 */}
                <div className="inline-flex gap-1 rounded-xl border-2 border-line bg-surface p-1">
                    {[
                        { key: 'list', label: 'Daftar', icon: LayoutGrid },
                        { key: 'map', label: 'Peta', icon: MapIcon },
                    ].map((option) => (
                        <ToggleChip
                            key={option.key}
                            variant="solid"
                            size="md"
                            active={view === option.key}
                            onClick={() => setView(option.key)}
                        >
                            <option.icon className="size-4" strokeWidth={2.5} />
                            {option.label}
                        </ToggleChip>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        options={[
                            { value: 'true', label: 'Sudah disurvei' },
                            { value: 'false', label: 'Belum disurvei' },
                        ]}
                        placeholder="Semua tempat"
                        className="w-40"
                    />
                    <Select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        options={[
                            { value: 'position', label: 'Urutan ditambahkan' },
                            { value: 'price_asc', label: 'Harga: rendah ke tinggi' },
                            { value: 'price_desc', label: 'Harga: tinggi ke rendah' },
                            { value: 'score', label: 'Nilai tertinggi' },
                            { value: 'distance', label: 'Terdekat dari tujuan' },
                        ]}
                        className="w-48"
                    />
                </div>
            </div>

            {/* --------------------------------------------------- selection bar */}
            {selection.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft px-5 py-3.5">
                    <p className="text-sm font-medium text-accent-ink">
                        <span className="tabular-nums">{selection.length}</span> selected
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/compare?list=${list.id}&${selection.map((id) => `places[]=${id}`).join('&')}`}
                            className="btn-secondary !py-2 text-xs"
                        >
                            <Columns3 className="size-3.5" strokeWidth={1.75} />
                            Bandingkan
                        </Link>
                        <button type="button" onClick={() => setSelection([])} className="btn-ghost !py-2 text-xs">
                            Bersihkan
                        </button>
                    </div>
                </div>
            )}

            {/* -------------------------------------------------------- content */}
            {list.places.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Belum ada tempat di daftar ini"
                    description="Tambahkan kandidat yang kamu temukan dari Google Maps, Instagram, situs iklan, atau teman. TemuRuang menyimpan sumbernya agar kamu ingat asalnya."
                    action={
                        <Link href={`/surveys/${list.id}/places/create`} className="btn-primary">
                            <Plus className="size-4" strokeWidth={2} />
                            Tambah tempat pertama
                        </Link>
                    }
                />
            ) : places.length === 0 ? (
                /*
                 * Dicek sebelum bercabang ke peta: filternya berlaku untuk kedua
                 * tampilan, jadi "tidak ada yang cocok" juga harus muncul di peta.
                 */
                <EmptyState
                    icon={MapPin}
                    title="Tidak ada yang cocok dengan filter"
                    description="Coba filter lain."
                    action={
                        <button type="button" onClick={() => setStatusFilter('')} className="btn-secondary">
                            Tampilkan semua tempat
                        </button>
                    }
                />
            ) : view === 'map' ? (
                <PlaceMapBrowser
                    places={places}
                    destination={list.destination}
                    className="h-[45vh] min-h-[15rem] lg:h-[calc(100vh-24rem)]"
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {places.map((place) => (
                        <PlaceCard
                            key={place.id}
                            place={place}
                            selectable
                            selected={selection.includes(place.id)}
                            onToggle={toggle}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={() => router.delete(`/surveys/${list.id}`)}
                title={`Hapus "${list.name}"?`}
                description="Semua tempat, foto, catatan, dan penilaian di daftar ini akan dihapus."
                confirmLabel="Hapus daftar"
            />
        </AppLayout>
    );
}
