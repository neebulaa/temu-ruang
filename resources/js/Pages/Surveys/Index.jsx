import { Head, Link, router, usePage } from '@inertiajs/react';
import { LayoutGrid, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import SurveyCard from '../../Components/SurveyCard';
import { EmptyState } from '../../Components/Ui';

export default function Index({ lists, filters }) {
    const { auth } = usePage().props;
    const [query, setQuery] = useState(filters.q ?? '');

    const firstName = auth.user.name.split(' ')[0];
    const hasFilters = Boolean(filters.q);

    const search = () => {
        router.get('/', query.trim() ? { q: query.trim() } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setQuery('');
        router.get('/', {}, { preserveState: true, replace: true });
    };

    return (
        <AppLayout>
            <Head title="Survei Saya" />

            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl leading-tight sm:text-4xl">Survei Saya</h1>
                    <p className="mt-1.5 text-sm text-muted">
                        Halo {firstName}, pilih daftar untuk dilanjutkan atau buat yang baru.
                    </p>
                </div>

                <Link href="/surveys/create" className="btn-primary shrink-0">
                    <Plus className="size-4" strokeWidth={2.5} />
                    Daftar baru
                </Link>
            </header>

            {(lists.length > 0 || hasFilters) && (
                <div className="relative mb-5">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && search()}
                        placeholder="Cari daftar…"
                        className="field pr-10 pl-10"
                    />
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:bg-sunken hover:text-ink"
                            aria-label="Hapus pencarian"
                        >
                            <X className="size-4" strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            )}

            {lists.length === 0 ? (
                <EmptyState
                    icon={hasFilters ? Search : LayoutGrid}
                    title={hasFilters ? 'Tidak ada yang cocok' : 'Belum ada daftar survei'}
                    description={
                        hasFilters
                            ? 'Coba kata kunci lain.'
                            : 'Satu daftar mengelompokkan tempat yang sedang kamu pilih: "Kos dekat BINUS", "Kantor untuk tim", "Venue untuk launching".'
                    }
                    action={
                        hasFilters ? (
                            <button type="button" onClick={clearFilters} className="btn-secondary">
                                Hapus pencarian
                            </button>
                        ) : (
                            <Link href="/surveys/create" className="btn-primary">
                                <Plus className="size-4" strokeWidth={2.5} />
                                Buat daftar pertama
                            </Link>
                        )
                    }
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {lists.map((list) => (
                        <SurveyCard key={list.id} list={list} />
                    ))}

                    <Link
                        href="/surveys/create"
                        className="group flex min-h-[13rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong p-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/40"
                    >
                        <span className="grid size-12 place-items-center rounded-2xl bg-sunken text-muted transition-colors group-hover:bg-accent group-hover:text-white">
                            <Plus className="size-5" strokeWidth={2.5} />
                        </span>
                        <span className="text-sm font-medium text-ink-soft">Daftar survei baru</span>
                    </Link>
                </div>
            )}
        </AppLayout>
    );
}
