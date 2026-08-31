import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import FacilityPicker from '../../Components/FacilityPicker';
import LocationField from '../../Components/LocationField';
import MoneyInput from '../../Components/MoneyInput';
import SurveyedToggle from '../../Components/SurveyedToggle';
import { Card, Field, Input, PageHeader, Textarea } from '../../Components/Ui';

export default function Form({ list, place, facilities }) {
    const editing = Boolean(place);

    const { data, setData, post, put, processing, errors } = useForm({
        name: place?.name ?? '',
        is_surveyed: place?.is_surveyed ?? false,
        address: place?.address ?? '',
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
        contact: place?.contact ?? '',
        price_min: place?.price_min ?? '',
        price_max: place?.price_max ?? '',
        source_url: place?.source_url ?? '',
        maps_url: place?.maps_url ?? '',
        notes: place?.notes ?? '',
        facilities: place?.facilities?.map((facility) => facility.id) ?? [],
    });

    const submit = (event) => {
        event.preventDefault();

        if (editing) {
            put(`/places/${place.id}`);
        } else {
            post(`/surveys/${list.id}/places`);
        }
    };

    const backHref = editing ? `/places/${place.id}` : `/surveys/${list.id}`;

    return (
        <AppLayout>
            <Head title={editing ? `Ubah ${place.name}` : 'Tambah tempat'} />

            <Link
                href={backHref}
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" strokeWidth={2} />
                {editing ? 'Kembali ke tempat' : `Kembali ke ${list.name}`}
            </Link>

            <PageHeader
                eyebrow={list.name}
                title={editing ? place.name : 'Tambah tempat'}
                description="Cukup yang penting saja. Sisanya bisa diisi setelah survei."
            />

            <form onSubmit={submit} className="space-y-6">
                <Card className="space-y-5 p-6">
                    <Field label="Tempat" error={errors.name} required>
                        <Input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="Kos Melati"
                            autoFocus
                            required
                        />
                    </Field>

                    <Field label="Status survei">
                        <SurveyedToggle
                            value={data.is_surveyed}
                            onChange={(value) => setData('is_surveyed', value)}
                        />
                    </Field>
                </Card>

                <Card className="p-6">
                    <LocationField
                        label="Tautan Google Maps"
                        mapsUrl={data.maps_url}
                        latitude={data.latitude}
                        longitude={data.longitude}
                        address={data.address}
                        embedUrl={place?.maps_embed_url ?? null}
                        onChange={setData}
                        errors={errors}
                    />
                    {(errors.latitude || errors.longitude) && (
                        <p className="mt-2 text-xs font-medium text-danger">
                            {errors.latitude ?? errors.longitude}
                        </p>
                    )}
                </Card>

                <Card className="space-y-5 p-6">
                    <Field label="Kontak pemilik" error={errors.contact}>
                        <Input
                            value={data.contact ?? ''}
                            onChange={(event) => setData('contact', event.target.value)}
                            placeholder="0812 3456 7890"
                        />
                    </Field>

                    <Field label="Tautan sumber" error={errors.source_url}>
                        <Input
                            type="url"
                            value={data.source_url ?? ''}
                            onChange={(event) => setData('source_url', event.target.value)}
                            placeholder="https://instagram.com/p/…"
                        />
                    </Field>
                </Card>

                <Card className="p-6">
                    <span className="label">Rentang harga</span>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <MoneyInput
                            value={data.price_min ?? ''}
                            onChange={(value) => setData('price_min', value)}
                            placeholder="Terendah"
                            aria-label="Harga terendah"
                        />
                        <span className="text-sm text-muted">to</span>
                        <MoneyInput
                            value={data.price_max ?? ''}
                            onChange={(value) => setData('price_max', value)}
                            placeholder="Tertinggi"
                            aria-label="Harga tertinggi"
                        />
                    </div>
                    {(errors.price_min || errors.price_max) && (
                        <p className="mt-1.5 text-xs font-medium text-danger">
                            {errors.price_min ?? errors.price_max}
                        </p>
                    )}
                </Card>

                <Card className="p-6">
                    <span className="label">Fasilitas</span>
                    <FacilityPicker
                        facilities={facilities}
                        selected={data.facilities}
                        onChange={(ids) => setData('facilities', ids)}
                        placeId={place?.id ?? null}
                    />
                </Card>

                <Card className="p-6">
                    <Field label="Catatan" error={errors.notes}>
                        <Textarea
                            value={data.notes ?? ''}
                            onChange={(event) => setData('notes', event.target.value)}
                            rows={5}
                            placeholder="Hal yang perlu diingat: kata pemilik, kesan ruangannya, atau yang mau ditanyakan lagi."
                        />
                    </Field>
                </Card>

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                    <button type="submit" disabled={processing} className="btn-primary sm:px-8">
                        {processing ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah tempat'}
                    </button>
                    <Link href={backHref} className="btn-secondary">
                        Batal
                    </Link>
                </div>
            </form>

        </AppLayout>
    );
}
