import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton } from './Ui';

/** Penyunting deskripsi di dalam overlay. Deskripsi selalu opsional. */
function CaptionBar({ item }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(item.caption ?? '');
    const [saving, setSaving] = useState(false);

    // Pindah berkas = mulai dari deskripsi berkas itu.
    useEffect(() => {
        setEditing(false);
        setText(item.caption ?? '');
    }, [item.id, item.caption]);

    const save = () => {
        setSaving(true);
        router.patch(
            `/media/${item.id}`,
            { caption: text },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setEditing(false);
                },
            },
        );
    };

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="mx-auto flex max-w-xl items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
                <Pencil className="size-3.5 shrink-0 text-white/50" strokeWidth={2} />
                <span className={item.caption ? '' : 'text-white/50 italic'}>
                    {item.caption || 'Tambah deskripsi'}
                </span>
            </button>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-xl items-start gap-2">
            <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    event.stopPropagation();

                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        save();
                    }

                    if (event.key === 'Escape') setEditing(false);
                }}
                rows={2}
                autoFocus
                maxLength={300}
                placeholder="Apa yang penting dari foto ini?"
                className="min-w-0 flex-1 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
            />
            <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary shrink-0 !py-2 text-xs disabled:opacity-50"
            >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Simpan'}
            </button>
        </div>
    );
}

/**
 * Overlay penuh layar untuk melihat satu foto atau video.
 *
 * Panah kiri/kanan dan tombol Escape bekerja, karena melihat dokumentasi survei
 * hampir selalu berarti menelusuri beberapa berkas berturut-turut, bukan membuka
 * satu lalu menutupnya lagi.
 */
export default function MediaLightbox({ items, index, onIndexChange, onClose, onDelete }) {
    const item = items[index];

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft') onIndexChange((index - 1 + items.length) % items.length);
            if (event.key === 'ArrowRight') onIndexChange((index + 1) % items.length);
        };

        document.addEventListener('keydown', onKey);
        // Halaman di belakang overlay tidak boleh ikut menggulir.
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [index, items.length, onIndexChange, onClose]);

    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/95">
            {/* ------------------------------------------------------- bar atas */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs font-medium text-white/60 tabular-nums">
                    {index + 1} / {items.length}
                </span>

                <div className="flex items-center gap-1">
                    {item.type === 'photo' && (
                        <IconButton
                            icon={Star}
                            label={item.is_cover ? 'Ini sampulnya' : 'Jadikan sampul'}
                            tone={item.is_cover ? 'accent' : 'overlay'}
                            onClick={() =>
                                router.patch(`/media/${item.id}`, { is_cover: true }, { preserveScroll: true })
                            }
                        />
                    )}
                    <IconButton
                        icon={Trash2}
                        label="Hapus"
                        tone="overlay"
                        className="hover:!bg-danger"
                        onClick={() => onDelete(item)}
                    />
                    <IconButton icon={X} label="Tutup" tone="overlay" onClick={onClose} />
                </div>
            </div>

            {/* --------------------------------------------------------- berkas */}
            <div
                className="relative flex min-h-0 flex-1 items-center justify-center px-4"
                // Klik latar menutup; klik berkasnya sendiri tidak.
                onClick={(event) => event.target === event.currentTarget && onClose()}
            >
                {items.length > 1 && (
                    <IconButton
                        icon={ChevronLeft}
                        label="Sebelumnya"
                        tone="overlay"
                        size="lg"
                        className="absolute left-2 z-10 sm:left-4"
                        onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
                    />
                )}

                {item.type === 'photo' ? (
                    <img
                        key={item.id}
                        src={item.url}
                        alt={item.caption ?? item.original_name ?? 'Dokumentasi survei'}
                        className="max-h-full max-w-full rounded-xl object-contain"
                    />
                ) : (
                    <video
                        key={item.id}
                        src={item.url}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full rounded-xl"
                    />
                )}

                {items.length > 1 && (
                    <IconButton
                        icon={ChevronRight}
                        label="Berikutnya"
                        tone="overlay"
                        size="lg"
                        className="absolute right-2 z-10 sm:right-4"
                        onClick={() => onIndexChange((index + 1) % items.length)}
                    />
                )}
            </div>

            {/* ------------------------------------------------------ deskripsi */}
            <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <CaptionBar item={item} />
            </div>
        </div>
    );
}
