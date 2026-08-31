import { Check, Loader2, LocateFixed, MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import GoogleMap from './GoogleMap';
import { Field, Input } from './Ui';
import { currentPosition, placeEmbedUrl } from '../lib/maps';

/**
 * Lokasi diisi dengan menempelkan tautan Google Maps, atau dengan GPS.
 *
 * Tautannya dibaca sendiri begitu ditempel — dulu ada tombol "Ambil lokasi"
 * untuk itu, tapi namanya menyesatkan (terdengar seperti lokasi pengguna) dan
 * langkahnya memang tidak perlu: kalau tautannya sudah ada di kolom, satu-
 * satunya hal yang masuk akal berikutnya adalah membacanya.
 *
 * Menaruh pin dengan klik lalu menyeretnya tidak mungkin di sini: iframe Google
 * tertutup untuk halaman induk, jadi ia tidak bisa melaporkan klik. Koordinat
 * tetap disimpan karena jarak ke tujuan dihitung darinya.
 */
export default function LocationField({
    label = 'Lokasi',
    mapsUrl,
    latitude,
    longitude,
    address,
    embedUrl = null,
    onChange,
    errors = {},
    height = 'h-64',
}) {
    const [reading, setReading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(embedUrl);

    const hasPin = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
    const url = (mapsUrl ?? '').trim();

    // Tautan yang sudah pernah dibaca, supaya tidak dibaca dua kali.
    const lastRead = useRef(embedUrl ? url : null);

    const patch = (changes) => onChange((current) => ({ ...current, ...changes }));

    /*
     * Tautan pendek (yang diberi tombol Bagikan di ponsel) tidak memuat
     * koordinat, jadi server harus mengikutinya dulu. Karena itu ini panggilan
     * jaringan, bukan regex di sini.
     */
    const read = async (target) => {
        if (!target) return;

        lastRead.current = target;
        setReading(true);
        setResult(null);

        try {
            const response = await fetch('/maps-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content ?? '',
                },
                body: JSON.stringify({ url: target }),
            });

            const payload = await response.json();

            if (!response.ok) {
                setResult({ ok: false, message: payload.message ?? 'Tautan tidak bisa dibaca.' });

                return;
            }

            if (payload.latitude === null) {
                setResult({
                    ok: false,
                    message:
                        'Koordinatnya tidak terbaca dari tautan ini. Buka tautannya di peramban, lalu salin URL panjang dari bilah alamat, yang memuat "@" dan angka koordinat.',
                });

                return;
            }

            patch({
                latitude: payload.latitude,
                longitude: payload.longitude,
                // Nama dari tautan hanya mengisi alamat yang masih kosong.
                address: (address ?? '').trim() === '' && payload.name ? payload.name : address,
            });

            setPreview(payload.embed_url);
            setResult({ ok: true, message: 'Lokasi terbaca dari tautan.' });
        } catch {
            setResult({ ok: false, message: 'Gagal membaca tautan. Periksa koneksi.' });
        } finally {
            setReading(false);
        }
    };

    /*
     * Baca sendiri sesaat setelah tautannya berhenti berubah. Jeda pendeknya ada
     * supaya mengetik manual tidak memicu satu permintaan per huruf; menempel
     * terasa seketika karena seluruh tautan masuk sekaligus.
     */
    useEffect(() => {
        if (!url || url === lastRead.current || !/^https?:\/\//i.test(url)) return undefined;

        const timer = setTimeout(() => read(url), 500);

        return () => clearTimeout(timer);
    }, [url]);

    const useMyLocation = async () => {
        setLocating(true);
        setResult(null);

        try {
            const position = await currentPosition();

            patch({ latitude: position.latitude, longitude: position.longitude, maps_url: '' });
            lastRead.current = null;
            setPreview(placeEmbedUrl(position));
            setResult({ ok: true, message: 'Lokasi saya dipakai sebagai titik tempat ini.' });
        } catch (failure) {
            setResult({
                ok: false,
                message:
                    failure.code === 1
                        ? 'Izin lokasi ditolak. Aktifkan lewat ikon gembok di bilah alamat.'
                        : failure.message === 'unsupported' || !window.isSecureContext
                          ? 'Peramban hanya memberi lokasi lewat HTTPS atau localhost.'
                          : 'Lokasimu tidak bisa dibaca sekarang.',
            });
        } finally {
            setLocating(false);
        }
    };

    const clear = () => {
        patch({ latitude: null, longitude: null, maps_url: '' });
        lastRead.current = null;
        setPreview(null);
        setResult(null);
    };

    return (
        <div className="space-y-4">
            <Field label={label} error={errors.maps_url}>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        type="url"
                        value={mapsUrl ?? ''}
                        onChange={(event) => {
                            patch({ maps_url: event.target.value });
                            setResult(null);
                        }}
                        placeholder="https://maps.app.goo.gl/…"
                        className="min-w-0 flex-1"
                    />
                    <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locating}
                        className="btn-secondary shrink-0 !py-2.5 text-xs"
                    >
                        {locating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <LocateFixed className="size-3.5" strokeWidth={2} />
                        )}
                        Lokasi saya
                    </button>
                </div>
            </Field>

            {reading && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Loader2 className="size-3.5 animate-spin" />
                    Membaca tautan…
                </p>
            )}

            {!reading && result && (
                <p
                    className={
                        result.ok
                            ? 'flex items-start gap-1.5 text-xs font-medium text-mint-ink'
                            : 'text-xs font-medium text-warn'
                    }
                >
                    {result.ok && <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />}
                    {result.message}
                </p>
            )}

            <GoogleMap
                src={preview}
                title="Pratinjau lokasi"
                className={height}
                empty="Tempel tautan Google Maps, atau tekan Lokasi saya."
            />

            {(hasPin || url) && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {hasPin ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-soft">
                            <MapPin className="size-3.5 text-accent" strokeWidth={2} />
                            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                        </span>
                    ) : (
                        <span />
                    )}

                    <button type="button" onClick={clear} className="btn-ghost !px-2 !py-1 text-xs">
                        <X className="size-3.5" />
                        Hapus lokasi
                    </button>
                </div>
            )}

            <Field label="Alamat" error={errors.address}>
                <Input
                    value={address ?? ''}
                    onChange={(event) => patch({ address: event.target.value })}
                    placeholder="Jl. Anggrek Raya No. 12, Kemanggisan"
                />
            </Field>
        </div>
    );
}
