import { router, usePage } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from './Ui';

/**
 * Pemilih warna aksen aplikasi.
 *
 * Daftarnya tertutup (lihat App\Support\Theme): tiap warna sudah diperiksa
 * kontrasnya untuk teks putih, dan logonya punya berkas turunan sendiri.
 *
 * Setelah tersimpan, halaman dimuat ulang penuh. Terdengar kasar, tapi ini satu-
 * satunya cara yang benar di sini: token warnanya ditulis Blade ke dalam
 * dokumen, dan kunjungan Inertia tidak merender ulang shell — jadi tanpa muat
 * ulang, warnanya baru berubah entah kapan. Mengganti variabelnya lewat
 * JavaScript sudah dicoba dan tidak menolong: nilainya memang berubah di root
 * maupun di elemennya, tetapi gaya yang sudah terhitung tidak ikut dicat ulang.
 */
export default function AccentPicker() {
    const { auth, themes } = usePage().props;
    const [saving, setSaving] = useState(null);

    const pick = (theme) => {
        if (theme.value === auth.user.accent) return;

        setSaving(theme.value);

        router.put(
            '/settings/accent',
            { accent: theme.value },
            {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
                onError: () => setSaving(null),
            },
        );
    };

    return (
        <div className="flex flex-wrap gap-2.5">
            {themes.map((theme) => {
                const active = auth.user.accent === theme.value;
                const busy = saving === theme.value;

                return (
                    <button
                        key={theme.value}
                        type="button"
                        onClick={() => pick(theme)}
                        aria-pressed={active}
                        disabled={Boolean(saving)}
                        title={theme.label}
                        className={cn(
                            'grid size-10 place-items-center rounded-xl border-2 transition-colors disabled:cursor-wait',
                            active ? 'border-ink' : 'border-transparent hover:border-line-strong',
                        )}
                    >
                        <span
                            className="grid size-7 place-items-center rounded-lg"
                            style={{ backgroundColor: theme.accent }}
                        >
                            {busy ? (
                                <Loader2 className="size-4 animate-spin text-white" strokeWidth={2.5} />
                            ) : (
                                active && <Check className="size-4 text-white" strokeWidth={3} />
                            )}
                        </span>
                        <span className="sr-only">{theme.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
