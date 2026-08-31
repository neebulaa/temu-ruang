import { usePage } from '@inertiajs/react';
import { cn } from './Ui';

/**
 * Tanda TemuRuang.
 *
 * Gambarnya berkas raster, bukan SVG bergaris: percobaan menggambar ulang
 * karakter ini sebagai ikon vektor selalu berakhir terlihat seperti diambil
 * dari paket ikon, yang justru mau dihindari.
 *
 * Sumbernya `resources/brand/mark.png`; semua ukuran turunannya dibuat dengan
 * `php tools/build-icons.php resources/brand/mark.png`.
 */
export function BrandMark({ className }) {
    const accent = usePage().props.auth?.user?.accent;

    /*
     * Raster tidak bisa diwarnai ulang lewat CSS, jadi tiap tema punya berkas
     * turunannya sendiri. `onError` jatuh ke tanda bawaan kalau turunannya
     * belum dibuat.
     */
    return (
        <img
            src={accent ? `/brand-mark-${accent}.png` : '/brand-mark.png'}
            onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/brand-mark.png';
            }}
            alt=""
            width={36}
            height={36}
            className={cn('size-9 shrink-0 object-contain', className)}
        />
    );
}

export function Brand({ className, showWordmark = true }) {
    return (
        <span className={cn('flex items-center gap-2.5', className)}>
            <BrandMark />
            {showWordmark && (
                /*
                 * Dua warna dan wajah bulat, mengikuti logonya sendiri. Sebelumnya
                 * satu warna dengan Plus Jakarta Sans, jadi tulisannya terbaca
                 * seperti label aplikasi lain yang kebetulan ditempel di samping
                 * gambar — bukan bagian dari merek yang sama.
                 */
                <span className="font-display text-xl font-bold tracking-tight">
                    <span className="text-ink">Temu</span>
                    <span className="text-accent">Ruang</span>
                </span>
            )}
        </span>
    );
}
