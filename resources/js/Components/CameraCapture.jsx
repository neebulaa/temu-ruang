import { router } from '@inertiajs/react';
import { Camera, Check, Loader2, SwitchCamera, Video, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconButton, cn } from './Ui';

/** Batas rekaman, supaya berkas tidak menembus 50 MB di sisi server. */
const MAX_SECONDS = 60;

/** Urutan pilihan wadah rekaman; yang pertama didukung peramban yang dipakai. */
const VIDEO_TYPES = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
];

/**
 * Kamera dalam aplikasi: jepret atau rekam, langsung terunggah.
 *
 * `getUserMedia` hanya tersedia di secure context — HTTPS atau localhost. Di
 * `http://nama.test` peramban tidak akan memberi akses kamera, jadi komponen ini
 * mendeteksinya dan menawarkan input `capture` biasa sebagai gantinya (di ponsel
 * itu tetap membuka aplikasi kamera).
 */
export default function CameraCapture({ placeId, open, onClose }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const fallbackInput = useRef(null);

    const [mode, setMode] = useState('photo');
    const [facing, setFacing] = useState('environment');
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);
    const [recording, setRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(0);

    const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

    const stop = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setReady(false);
    }, []);

    /*
     * Audio hanya diminta saat mode video — kalau tidak, membuka kamera untuk
     * satu foto ikut memunculkan izin mikrofon. Bila izin audio ditolak, kita
     * ulangi tanpa audio dan rekaman jadi bisu, bukannya gagal total.
     */
    const start = useCallback(
        async (wantAudio, facingMode) => {
            stop();
            setError(null);

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    // Hanya lebar yang disarankan: memaksa 1920x1080 membuat
                    // ponsel portrait mengembalikan bingkai lanskap, yang lalu
                    // tampil sebagai pita tipis di tengah layar hitam.
                    video: { facingMode, width: { ideal: 1920 } },
                    audio: wantAudio,
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                setReady(true);
            } catch (err) {
                if (wantAudio) {
                    await start(false, facingMode);

                    return;
                }

                setError(
                    err.name === 'NotAllowedError'
                        ? 'Akses kamera ditolak. Izinkan lewat ikon gembok di bilah alamat.'
                        : err.name === 'NotFoundError'
                          ? 'Tidak ada kamera yang terdeteksi di perangkat ini.'
                          : 'Kamera tidak bisa dibuka.',
                );
            }
        },
        [stop],
    );

    useEffect(() => {
        if (!open || !supported) return undefined;

        start(mode === 'video', facing);

        return stop;
    }, [open, supported, mode, facing, start, stop]);

    // Penghitung durasi rekaman, sekaligus penghenti otomatis di MAX_SECONDS.
    useEffect(() => {
        if (!recording) return undefined;

        const timer = setInterval(() => {
            setElapsed((seconds) => {
                if (seconds + 1 >= MAX_SECONDS) {
                    recorderRef.current?.stop();
                }

                return seconds + 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [recording]);

    const send = (file) => {
        if (file.size > 50 * 1024 * 1024) {
            setError('Berkasnya lebih dari 50 MB. Rekam lebih pendek.');

            return;
        }

        setUploading(true);

        router.post(
            `/places/${placeId}/media`,
            { files: [file] },
            {
                forceFormData: true,
                preserveScroll: true,
                // Kamera sengaja dibiarkan terbuka: biasanya orang memotret
                // beberapa sudut sekaligus.
                onSuccess: () => setUploaded((count) => count + 1),
                onError: () => setError('Gagal mengunggah. Coba lagi.'),
                onFinish: () => setUploading(false),
            },
        );
    };

    const snap = () => {
        const video = videoRef.current;

        if (!video?.videoWidth) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => blob && send(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })),
            'image/jpeg',
            0.9,
        );
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        const mimeType = VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
            const type = recorder.mimeType || 'video/webm';
            const blob = new Blob(chunksRef.current, { type });
            const extension = type.includes('mp4') ? 'mp4' : 'webm';

            setRecording(false);
            setElapsed(0);
            send(new File([blob], `video-${Date.now()}.${extension}`, { type: type.split(';')[0] }));
        };

        recorder.start();
        recorderRef.current = recorder;
        setElapsed(0);
        setRecording(true);
    };

    const close = () => {
        recorderRef.current?.state === 'recording' && recorderRef.current.stop();
        stop();
        setUploaded(0);
        setError(null);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink">
            {/* ------------------------------------------------------- bar atas */}
            <div className="flex items-center justify-end gap-3 px-4 py-3">
                <div className="flex items-center gap-2">
                    {uploaded > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                            <Check className="size-3.5" strokeWidth={2.5} />
                            {uploaded} terunggah
                        </span>
                    )}
                    <IconButton icon={X} label="Tutup kamera" tone="overlay" onClick={close} />
                </div>
            </div>

            {/* ------------------------------------------------------ pratinjau */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
                {supported && !error ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn('max-h-full max-w-full', facing === 'user' && '-scale-x-100')}
                    />
                ) : (
                    <div className="max-w-sm px-6 text-center">
                        <Camera className="mx-auto size-7 text-white/50" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-white">
                            {error ??
                                'Peramban hanya memberi akses kamera lewat HTTPS atau localhost.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => fallbackInput.current?.click()}
                            className="btn-secondary mt-4 !py-2 text-xs"
                        >
                            <Camera className="size-3.5" strokeWidth={1.75} />
                            Pakai kamera perangkat
                        </button>
                        <input
                            ref={fallbackInput}
                            type="file"
                            accept="image/*,video/*"
                            capture="environment"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                if (file) send(file);
                            }}
                        />
                    </div>
                )}

                {recording && (
                    <span className="absolute top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-danger px-3 py-1 text-xs font-medium text-white">
                        <span className="size-2 animate-pulse rounded-full bg-white" />
                        {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
                        {String(elapsed % 60).padStart(2, '0')} / 01:00
                    </span>
                )}

                {uploading && (
                    <span className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white">
                        <Loader2 className="size-3.5 animate-spin" />
                        Mengunggah…
                    </span>
                )}
            </div>

            {/* ---------------------------------------------------- bar kontrol */}
            <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                    <div className="flex w-24 justify-start">
                        {!recording && (
                            <div className="inline-flex rounded-xl bg-white/10 p-1">
                                {[
                                    { key: 'photo', icon: Camera, label: 'Foto' },
                                    { key: 'video', icon: Video, label: 'Video' },
                                ].map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setMode(option.key)}
                                        aria-pressed={mode === option.key}
                                        aria-label={option.label}
                                        className={cn(
                                            'grid size-8 place-items-center rounded-lg transition-colors',
                                            mode === option.key
                                                ? 'bg-white text-ink'
                                                : 'text-white/70 hover:text-white',
                                        )}
                                    >
                                        <option.icon className="size-4" strokeWidth={2} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={!ready || uploading}
                        onClick={
                            mode === 'photo'
                                ? snap
                                : recording
                                  ? () => recorderRef.current?.stop()
                                  : startRecording
                        }
                        aria-label={
                            mode === 'photo' ? 'Ambil foto' : recording ? 'Hentikan rekaman' : 'Mulai merekam'
                        }
                        className="grid size-16 shrink-0 place-items-center rounded-full border-4 border-white/80 transition-colors disabled:opacity-40"
                    >
                        <span
                            className={cn(
                                'bg-white transition-all',
                                recording ? 'size-6 rounded-md' : 'size-12 rounded-full',
                                mode === 'video' && !recording && 'bg-danger',
                            )}
                        />
                    </button>

                    <div className="flex w-24 justify-end">
                        {supported && !error && !recording && (
                            <IconButton
                                icon={SwitchCamera}
                                label="Ganti kamera"
                                tone="overlay"
                                onClick={() => setFacing((current) => (current === 'user' ? 'environment' : 'user'))}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
