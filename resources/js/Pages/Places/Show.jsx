import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, ImageOff, MapPin, Pencil, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import FacilityPicker from '../../Components/FacilityPicker';
import GoogleMap from '../../Components/GoogleMap';
import MediaGallery from '../../Components/MediaGallery';
import MediaUploader from '../../Components/MediaUploader';
import { ConfirmDialog } from '../../Components/Modal';
import RatingSheet from '../../Components/RatingSheet';
import SurveyedToggle from '../../Components/SurveyedToggle';
import { Stars } from '../../Components/Stars';
import { Card, Textarea, ToggleChip } from '../../Components/Ui';
import { formatDate, formatDistance, formatPriceRange, placeDistanceKm } from '../../lib/format';

const TABS = [
    { key: 'overview', label: 'Ringkasan' },
    { key: 'photos', label: 'Foto & video' },
    { key: 'rating', label: 'Penilaian' },
];

/**
 * Notes are edited in place. The whole place is sent on save because the
 * update endpoint validates the full record.
 */
function NotesCard({ place }) {
    const { data, setData, put, processing, isDirty } = useForm({
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        contact: place.contact,
        price_min: place.price_min,
        price_max: place.price_max,
        source_url: place.source_url,
        maps_url: place.maps_url,
        is_surveyed: place.is_surveyed,
        notes: place.notes ?? '',
        facilities: place.facilities.map((facility) => facility.id),
    });

    return (
        <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-sm font-medium text-ink">Catatan</h2>
                {isDirty && (
                    <button
                        type="button"
                        onClick={() => put(`/places/${place.id}`, { preserveScroll: true })}
                        disabled={processing}
                        className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                        {processing ? 'Menyimpan…' : 'Simpan catatan'}
                    </button>
                )}
            </div>

            <Textarea
                value={data.notes}
                onChange={(event) => setData('notes', event.target.value)}
                rows={6}
                placeholder="Hal yang perlu diingat: kata pemilik, kesan ruangannya, atau yang mau ditanyakan lagi."
            />
        </Card>
    );
}

export default function Show({ place, list, facilities, vocab }) {
    const [tab, setTab] = useState('overview');
    const [confirming, setConfirming] = useState(false);

    const price = formatPriceRange(place.price_min, place.price_max);
    const distance = formatDistance(placeDistanceKm(place));

    const toggleSurveyed = (value) =>
        router.patch(`/places/${place.id}/surveyed`, { is_surveyed: value }, { preserveScroll: true });

    const syncFacilities = (ids) =>
        router.post(`/places/${place.id}/facilities`, { facilities: ids }, { preserveScroll: true });

    return (
        <AppLayout>
            <Head title={place.name} />

            <Link
                href={`/surveys/${list.id}`}
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" strokeWidth={2} />
                {list.name}
            </Link>

            {/* --------------------------------------------------------- hero */}
            <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sunken lg:aspect-auto lg:min-h-[20rem]">
                    {place.cover_url ? (
                        <img src={place.cover_url} alt={place.name} className="size-full object-cover" />
                    ) : (
                        <div className="grid size-full place-items-center text-center">
                            <div>
                                <ImageOff className="mx-auto size-6 text-muted" strokeWidth={1.5} />
                                <p className="mt-2 text-xs text-muted">Belum ada foto</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                    <span>
                        <SurveyedToggle value={place.is_surveyed} onChange={toggleSurveyed} />
                    </span>

                    <h1 className="mt-3 text-2xl sm:text-3xl">{place.name}</h1>

                    <div className="mt-2 flex flex-wrap items-baseline gap-3">
                        {price ? (
                            <p className="text-xl font-semibold text-accent-ink">{price}</p>
                        ) : (
                            <p className="text-sm text-muted">Harga belum dicatat</p>
                        )}
                        <Stars value={place.overall_score} showValue />
                    </div>

                    <dl className="mt-6 grid gap-4 border-y border-line py-5 sm:grid-cols-2">
                        {place.address && (
                            <div className="sm:col-span-2">
                                <dt className="text-[0.7rem] font-medium text-muted">Alamat</dt>
                                <dd className="mt-0.5 text-sm text-ink-soft">{place.address}</dd>
                            </div>
                        )}
                        {distance && (
                            <div>
                                <dt className="text-[0.7rem] font-medium text-muted">
                                    Ke {list.destination?.name ?? 'tujuan'}
                                </dt>
                                <dd className="mt-0.5 text-sm text-ink-soft">{distance}</dd>
                            </div>
                        )}
                        {place.contact && (
                            <div>
                                <dt className="text-[0.7rem] font-medium text-muted">Kontak</dt>
                                <dd className="mt-0.5 text-sm text-ink-soft">
                                    <a
                                        href={`tel:${place.contact.replace(/\s/g, '')}`}
                                        className="inline-flex items-center gap-1.5"
                                    >
                                        <Phone className="size-3.5 text-muted" strokeWidth={2} />
                                        {place.contact}
                                    </a>
                                </dd>
                            </div>
                        )}
                        {place.source_url && (
                            <div>
                                <dt className="text-[0.7rem] font-medium text-muted">Sumber</dt>
                                <dd className="mt-0.5 text-sm text-ink-soft">
                                    <a
                                        href={place.source_url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="inline-flex items-center gap-1 underline underline-offset-2"
                                    >
                                        Buka tautan
                                        <ExternalLink className="size-3" strokeWidth={2} />
                                    </a>
                                </dd>
                            </div>
                        )}
                        {place.surveyed_at && (
                            <div>
                                <dt className="text-[0.7rem] font-medium text-muted">Sudah disurvei</dt>
                                <dd className="mt-0.5 text-sm text-ink-soft">{formatDate(place.surveyed_at)}</dd>
                            </div>
                        )}
                    </dl>

                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                        <Link href={`/places/${place.id}/edit`} className="btn-secondary">
                            <Pencil className="size-4" strokeWidth={2} />
                            Ubah
                        </Link>
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="btn-ghost !px-3 hover:text-danger"
                            aria-label="Hapus tempat"
                        >
                            <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --------------------------------------------------------- tabs */}
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
                {TABS.map((item) => (
                    <ToggleChip
                        key={item.key}
                        variant="solid"
                        size="md"
                        active={tab === item.key}
                        onClick={() => setTab(item.key)}
                    >
                        {item.label}
                    </ToggleChip>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="space-y-6">
                        <NotesCard key={place.updated_at} place={place} />

                        <GoogleMap
                            src={place.maps_embed_url}
                            title={`${place.name} di Google Maps`}
                            link={place.maps_url}
                            target={{ latitude: place.latitude, longitude: place.longitude }}
                            destination={list.destination}
                            empty="Lokasi belum diatur. Tempel tautan Google Maps lewat Ubah."
                        />
                    </div>

                    <Card className="h-fit p-6">
                        <h2 className="mb-4 font-sans text-sm font-medium text-ink">Fasilitas</h2>
                        <FacilityPicker
                            facilities={facilities}
                            selected={place.facilities.map((facility) => facility.id)}
                            onChange={syncFacilities}
                            placeId={place.id}
                        />
                    </Card>
                </div>
            )}

            {tab === 'photos' && (
                <div className="space-y-8">
                    <MediaUploader placeId={place.id} />
                    <MediaGallery media={place.media} categories={vocab.mediaCategories} />
                </div>
            )}

            {tab === 'rating' && (
                <Card className="p-6">
                    <h2 className="mb-4 font-sans text-sm font-medium text-ink">Berapa nilainya?</h2>
                    <RatingSheet place={place} criteria={vocab.ratingCriteria} />
                </Card>
            )}

            <ConfirmDialog
                open={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={() => router.delete(`/places/${place.id}`)}
                title={`Hapus "${place.name}"?`}
                description="Foto, catatan, dan penilaiannya ikut terhapus."
                confirmLabel="Hapus tempat"
            />
        </AppLayout>
    );
}
