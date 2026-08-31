import { ExternalLink, Loader2, LocateFixed, MapPin, Navigation, Route, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from './Ui';
import { currentPosition, directionsAppUrl, directionsEmbedUrl } from '../lib/maps';

const isPoint = (point) =>
    point?.latitude !== null &&
    point?.latitude !== undefined &&
    point?.longitude !== null &&
    point?.longitude !== undefined;

/**
 * Peta Google, tampil-saja.
 *
 * Iframe biasa ke `output=embed`, jadi tidak perlu API key dan tidak perlu
 * daftar apa pun. Konsekuensinya satu embed = satu lokasi: penanda ganda dan
 * klik-untuk-menaruh-pin butuh Maps JavaScript API yang berbayar.
 *
 * `src` selalu datang dari server (`maps_embed_url`), tidak pernah dirakit di
 * sini — daftar host yang boleh dibingkai dijaga di satu tempat saja. URL rute
 * adalah pengecualian: isinya hanya angka koordinat, tidak ada teks pengguna.
 *
 * @param target      {latitude, longitude} tujuan; bila diisi, tombol "Lokasi
 *                    saya" muncul dan peta bisa berganti ke tampilan rute.
 * @param destination {latitude, longitude, name} tujuan daftarnya; bila diisi,
 *                    peta juga bisa menggambar rute dari `target` ke sana.
 */
export default function GoogleMap({
    src,
    title,
    link = null,
    target = null,
    destination = null,
    className = 'h-72',
    empty = null,
}) {
    const [route, setRoute] = useState(null);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);

    const canLocate = isPoint(target);
    const canRouteToDestination = isPoint(target) && isPoint(destination);

    const locate = async () => {
        setLocating(true);
        setError(null);

        try {
            // Titik awalnya pengguna sendiri, jadi Google Maps dibiarkan
            // memakai posisi terkini waktu rutenya dibuka di aplikasi.
            setRoute({ from: await currentPosition(), to: target, appFrom: null });
        } catch (failure) {
            setError(
                failure.code === 1
                    ? 'Izin lokasi ditolak. Aktifkan lewat ikon gembok di bilah alamat.'
                    : failure.message === 'unsupported' || !window.isSecureContext
                      ? 'Peramban hanya memberi lokasi lewat HTTPS atau localhost.'
                      : 'Lokasimu tidak bisa dibaca sekarang.',
            );
        } finally {
            setLocating(false);
        }
    };

    if (!src) {
        return (
            <div
                className={cn(
                    'grid place-items-center rounded-2xl border border-line bg-sunken px-6 text-center',
                    className,
                )}
            >
                <div>
                    <MapPin className="mx-auto size-5 text-muted" strokeWidth={1.75} />
                    <p className="mt-2 text-xs text-muted">{empty ?? 'Lokasi belum diatur.'}</p>
                </div>
            </div>
        );
    }

    const showing = route ? directionsEmbedUrl(route.from, route.to) : src;

    return (
        <div>
            <div className={cn('overflow-hidden rounded-2xl border border-line bg-sunken', className)}>
                <iframe
                    key={showing}
                    src={showing}
                    title={title}
                    className="size-full"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                {route ? (
                    <>
                        {/*
                         * Peta di atas hanya menggambar rutenya sekali. Titik biru
                         * yang bergerak butuh Maps JavaScript API yang berbayar —
                         * jadi pelacakan sungguhan diserahkan ke aplikasi Google
                         * Maps, yang memang sudah ada di ponsel.
                         */}
                        <a
                            href={directionsAppUrl(route.to, route.appFrom)}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="btn-primary !py-2 text-xs"
                        >
                            <Navigation className="size-3.5" strokeWidth={2} />
                            Lacak di Google Maps
                        </a>
                        <button
                            type="button"
                            onClick={() => setRoute(null)}
                            className="btn-ghost !px-2 !py-1 text-xs"
                        >
                            <X className="size-3.5" />
                            Tutup rute
                        </button>
                    </>
                ) : (
                    <>
                        {canLocate && (
                            <button
                                type="button"
                                onClick={locate}
                                disabled={locating}
                                className="btn-secondary !py-2 text-xs"
                            >
                                {locating ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <LocateFixed className="size-3.5" strokeWidth={2} />
                                )}
                                Rute dari lokasi saya
                            </button>
                        )}

                        {canRouteToDestination && (
                            <button
                                type="button"
                                onClick={() =>
                                    setRoute({ from: target, to: destination, appFrom: target })
                                }
                                className="btn-secondary !py-2 text-xs"
                            >
                                <Route className="size-3.5" strokeWidth={2} />
                                Rute ke {destination.name ?? 'tujuan'}
                            </button>
                        )}
                    </>
                )}

                {link && (
                    <a
                        href={link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-2"
                    >
                        Buka di Google Maps
                        <ExternalLink className="size-3" strokeWidth={2} />
                    </a>
                )}
            </div>

            {error && <p className="mt-1.5 text-xs font-medium text-warn">{error}</p>}
        </div>
    );
}
