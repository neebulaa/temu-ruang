import { Head, Link, router } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import PlaceMapBrowser from '../../Components/PlaceMapBrowser';
import { EmptyState, PageHeader, Select } from '../../Components/Ui';

export default function Index({ lists, places, destinations, filters }) {
    const located = places.filter((place) => place.maps_embed_url);

    return (
        <AppLayout>
            <Head title="Peta" />

            <PageHeader
                eyebrow="Peta"
                title="Semua yang sedang kamu survei"
                description="Pilih tempat di daftar untuk melihatnya di Google Maps. Satu embed menampilkan satu lokasi, jadi peta mengikuti pilihanmu."
                actions={
                    <Select
                        value={filters.list ?? ''}
                        onChange={(event) =>
                            router.get('/map', event.target.value ? { list: event.target.value } : {})
                        }
                        options={lists.map((list) => ({ value: list.id, label: list.name }))}
                        placeholder="Semua daftar survei"
                        className="w-56"
                    />
                }
            />

            {located.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Belum ada tempat yang punya lokasi"
                    description="Buka sebuah tempat, tempel tautan Google Maps-nya, lalu akan muncul di sini."
                    action={
                        <Link href="/" className="btn-primary">
                            Buka daftar survei
                        </Link>
                    }
                />
            ) : (
                <PlaceMapBrowser
                    places={located}
                    destination={destinations[0] ?? null}
                    className="h-[45vh] min-h-[15rem] lg:h-[calc(100vh-16rem)]"
                />
            )}
        </AppLayout>
    );
}
