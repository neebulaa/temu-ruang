import { useForm } from '@inertiajs/react';
import { Camera, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import CameraCapture from './CameraCapture';
import { IconButton, cn } from './Ui';

/**
 * Dua jalan masuk dokumentasi survei.
 *
 * Kamera (`CameraCapture`) merekam lalu langsung mengunggah — itu jalur utamanya,
 * karena dokumentasi survei dibuat sambil berdiri di lokasi. Seret-lepas dan
 * pemilih berkas tetap ada untuk foto yang sudah tersimpan di perangkat, dan
 * jalur itu menumpuk antrean dulu supaya areanya bisa dipilih sekali saja.
 */
export default function MediaUploader({ placeId, onUploaded }) {
    const fileInput = useRef(null);
    const [camera, setCamera] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [queued, setQueued] = useState([]);

    const { setData, post, processing, progress, reset, errors } = useForm({
        files: [],
    });

    const addFiles = (fileList) => {
        const incoming = Array.from(fileList ?? []);
        if (incoming.length === 0) return;

        const next = [...queued, ...incoming].slice(0, 20);
        setQueued(next);
        setData('files', next);
    };

    const removeAt = (index) => {
        const next = queued.filter((_, position) => position !== index);
        setQueued(next);
        setData('files', next);
    };

    const upload = () => {
        if (queued.length === 0) return;

        post(`/places/${placeId}/media`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setQueued([]);
                reset('files');
                onUploaded?.();
            },
        });
    };

    // Yang gagal bisa berkas ke berapa saja, bukan cuma yang pertama — dulu
    // kesalahan pada berkas ketiga lewat tanpa sepatah kata pun di layar.
    const fileError =
        errors.files ?? Object.entries(errors).find(([key]) => key.startsWith('files.'))?.[1];

    return (
        <div>
            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                }}
                className={cn(
                    'rounded-2xl border border-dashed px-5 py-8 text-center transition-colors',
                    dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-sunken/40',
                )}
            >
                <UploadCloud className="mx-auto size-6 text-muted" strokeWidth={1.4} />
                <p className="mt-3 text-sm text-ink">Letakkan foto atau video di sini</p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => setCamera(true)} className="btn-primary !py-2 text-xs">
                        <Camera className="size-3.5" strokeWidth={1.75} />
                        Kamera
                    </button>
                    <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary !py-2 text-xs">
                        <ImagePlus className="size-3.5" strokeWidth={1.75} />
                        Pilih berkas
                    </button>
                </div>

                <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) => {
                        addFiles(event.target.files);
                        event.target.value = '';
                    }}
                />
            </div>

            {fileError && <p className="mt-2 text-xs text-danger">{fileError}</p>}

            <CameraCapture
                placeId={placeId}
                open={camera}
                onClose={() => {
                    setCamera(false);
                    onUploaded?.();
                }}
            />

            {queued.length > 0 && (
                <div className="mt-4 space-y-4">
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {queued.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="relative">
                                <span className="block aspect-square overflow-hidden rounded-xl border border-line bg-sunken">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <span className="grid size-full place-items-center text-[0.6rem] text-muted">
                                            VIDEO
                                        </span>
                                    )}
                                </span>
                                <IconButton
                                    icon={X}
                                    label={`Keluarkan ${file.name}`}
                                    size="sm"
                                    className="absolute -top-2 -right-2 !size-6 bg-ink text-white hover:!bg-danger hover:text-white"
                                    onClick={() => removeAt(index)}
                                />
                            </li>
                        ))}
                    </ul>

                    <div className="flex justify-end">
                        <button type="button" onClick={upload} disabled={processing} className="btn-primary">
                            {processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    {progress ? `${progress.percentage}%` : 'Mengunggah…'}
                                </>
                            ) : (
                                `Unggah ${queued.length}`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
