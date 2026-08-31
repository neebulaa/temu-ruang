import { usePage } from '@inertiajs/react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from './Ui';

const LIFETIME = 4000;

/**
 * Toast untuk pesan flash.
 *
 * Duduk di kanan atas, tepat di bawah bilah atas — bukan di tengah bawah, di
 * mana ia jatuh persis di jalur pandang dan menutupi dock. Warnanya memakai
 * tint lembut, bukan blok pekat, supaya memberi tahu tanpa merebut perhatian.
 *
 * Lapisannya di atas layar penuh kamera: mengunggah foto justru paling sering
 * dilakukan dari sana, jadi kabarnya harus tetap terlihat di atasnya.
 */
export default function Flash() {
    const { flash } = usePage().props;
    const message = flash?.success ?? flash?.error;
    const isError = Boolean(flash?.error);

    const [notice, setNotice] = useState(null);
    const serial = useRef(0);

    useEffect(() => {
        if (!message) return undefined;

        // Kabar yang sama persis datang beruntun: tiga foto berarti tiga kali
        // "Dokumentasi diunggah.". Yang membedakannya hanya kedatangannya, jadi
        // tiap pesan diberi nomor sendiri. Nomor itu dipakai sebagai key, toast
        // lama dibongkar dan yang baru masuk lagi lengkap dengan animasinya —
        // tanpa itu, unggahan kedua yang datang sebelum toast pertama hilang
        // tidak mengubah apa pun di layar dan terlihat seperti tidak terjadi.
        serial.current += 1;
        setNotice({ id: serial.current, message, isError });

        const timer = setTimeout(() => setNotice(null), LIFETIME);

        return () => clearTimeout(timer);
    }, [flash, message, isError]);

    if (!notice) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[60] flex justify-center px-4 sm:justify-end sm:px-6">
            <div
                key={notice.id}
                role="status"
                aria-live="polite"
                className={cn(
                    'toast-enter pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm',
                    notice.isError
                        ? 'border-danger/30 bg-danger-soft text-danger'
                        : 'border-mint/35 bg-mint-soft text-mint-ink',
                )}
            >
                {notice.isError ? (
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                ) : (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                )}
                <p className="flex-1">{notice.message}</p>
                <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="-mr-0.5 rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
                    aria-label="Tutup"
                >
                    <X className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
