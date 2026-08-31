import { Link, router, usePage } from '@inertiajs/react';
import { Columns3, LayoutGrid, LogOut, Map, User } from 'lucide-react';
import Flash from '../Components/Flash';
import { Brand } from '../Components/Brand';
import { IconButton, cn } from './../Components/Ui';

/**
 * Satu navigasi untuk semua ukuran layar - dock mengambang di bawah.
 * Tidak ada sidebar: ini aplikasi, bukan panel admin.
 */
const NAV = [
    { label: 'Survei', href: '/', icon: LayoutGrid },
    { label: 'Peta', href: '/map', icon: Map },
    { label: 'Banding', href: '/compare', icon: Columns3 },
    { label: 'Saya', href: '/settings', icon: User },
];

/** Beranda mencakup `/`, `/surveys/*` dan `/places/*`. */
function isActive(href, path) {
    if (href === '/') {
        return path === '/' || path.startsWith('/surveys') || path.startsWith('/places');
    }

    return path.startsWith(href);
}

export default function AppLayout({ children }) {
    const { auth } = usePage().props;
    const path = usePage().url.split('?')[0];

    return (
        <div className="min-h-screen bg-canvas">
            {/* bar atas */}
            <header className="sticky top-0 z-30 border-b border-line bg-canvas">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
                    <Link href="/" className="inline-flex">
                        <Brand />
                    </Link>

                    <div className="flex items-center gap-1">
                        <IconButton icon={LogOut} label="Keluar" onClick={() => router.post('/logout')} />
                        <Link
                            href="/settings"
                            className="grid size-9 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink"
                            title={auth?.user?.name}
                        >
                            {auth?.user?.initials}
                        </Link>
                    </div>
                </div>
            </header>

            {/* konten */}
            <main>
                <div className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6">{children}</div>
            </main>

            {/* dock navigasi */}
            <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <ul className="flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1">
                    {NAV.map((item) => {
                        const active = isActive(item.href, path);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-3.5',
                                        active
                                            ? 'bg-accent text-white'
                                            : 'text-muted hover:bg-sunken hover:text-ink',
                                    )}
                                >
                                    <item.icon className="size-4.5" strokeWidth={2} />
                                    {/* Label hanya untuk tab aktif, agar dock tetap ringkas. */}
                                    <span className={active ? 'inline' : 'hidden'}>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <Flash />
        </div>
    );
}
