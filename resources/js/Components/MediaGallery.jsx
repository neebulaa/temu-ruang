import { router } from '@inertiajs/react';
import { Check, Images, Pencil, Play, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MediaLightbox from './MediaLightbox';
import { ConfirmDialog } from './Modal';
import { EmptyState, IconButton, ToggleChip } from './Ui';

/** Inline editor for one attachment's description. */
function DescriptionEditor({ item, onDone }) {
    const [text, setText] = useState(item.caption ?? '');
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.patch(
            `/media/${item.id}`,
            { caption: text },
            { preserveScroll: true, onFinish: () => { setSaving(false); onDone(); } },
        );
    };

    return (
        <div className="mt-1.5">
            <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        save();
                    }
                    if (event.key === 'Escape') onDone();
                }}
                rows={2}
                autoFocus
                placeholder="Deskripsikan foto ini…"
                className="field !py-1.5 text-xs"
            />
            <div className="mt-1 flex gap-1">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="btn-primary !px-2.5 !py-1 text-[0.7rem]"
                >
                    <Check className="size-3" strokeWidth={3} />
                    Simpan
                </button>
                <button type="button" onClick={onDone} className="btn-ghost !px-2.5 !py-1 text-[0.7rem]">
                    Batal
                </button>
            </div>
        </div>
    );
}

/** Grid of uploaded documentation, grouped by the area it belongs to. */
export default function MediaGallery({ media, categories }) {
    const [filter, setFilter] = useState('');
    const [lightbox, setLightbox] = useState(null);

    const [editing, setEditing] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const visible = filter ? media.filter((item) => item.category === filter) : media;

    const usedCategories = categories.filter((category) =>
        media.some((item) => item.category === category.value),
    );

    if (media.length === 0) {
        return (
            <EmptyState
                icon={Images}
                title="Belum ada foto atau video"
                description="Rekam langsung di lokasi lewat tombol Kamera."
            />
        );
    }

    return (
        <div>
            {usedCategories.length > 1 && (
                <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
                    <ToggleChip active={filter === ''} onClick={() => setFilter('')}>
                        Semua ({media.length})
                    </ToggleChip>
                    {usedCategories.map((category) => {
                        const count = media.filter((item) => item.category === category.value).length;

                        return (
                            <ToggleChip
                                key={category.value}
                                active={filter === category.value}
                                onClick={() => setFilter(category.value)}
                            >
                                {category.label} ({count})
                            </ToggleChip>
                        );
                    })}
                </div>
            )}

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visible.map((item) => (
                    <li key={item.id} className="group">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setLightbox(visible.indexOf(item))}
                                className="block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-sunken"
                            >
                                {item.type === 'photo' ? (
                                    <img
                                        src={item.url}
                                        alt={item.caption ?? 'Survey photo'}
                                        loading="lazy"
                                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                    />
                                ) : (
                                    <>
                                        <video
                                            src={item.url}
                                            className="size-full object-cover"
                                            muted
                                            preload="metadata"
                                        />
                                        <span className="pointer-events-none absolute inset-0 grid place-items-center">
                                            <span className="grid size-10 place-items-center rounded-full bg-ink/55 text-white">
                                                <Play className="size-4 translate-x-px" strokeWidth={2} fill="currentColor" />
                                            </span>
                                        </span>
                                    </>
                                )}
                            </button>

                            {item.is_cover && (
                                <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-medium text-white">
                                    Sampul
                                </span>
                            )}

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                {item.type === 'photo' && !item.is_cover && (
                                    <IconButton
                                        icon={Star}
                                        label="Jadikan sampul"
                                        tone="surface"
                                        size="sm"
                                        onClick={() =>
                                            router.patch(
                                                `/media/${item.id}`,
                                                { is_cover: true },
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                )}
                                <IconButton
                                    icon={Trash2}
                                    label="Hapus"
                                    tone="danger"
                                    size="sm"
                                    className="bg-surface/95"
                                    onClick={() => setPendingDelete(item)}
                                />
                            </div>
                        </div>

                        {editing === item.id ? (
                            <DescriptionEditor item={item} onDone={() => setEditing(null)} />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setEditing(item.id)}
                                className="mt-1.5 flex w-full items-start gap-1.5 rounded-lg px-1 py-0.5 text-left text-xs transition-colors hover:bg-sunken"
                            >
                                <Pencil
                                    className="mt-0.5 size-3 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                                    strokeWidth={2}
                                />
                                <span className={item.caption ? 'text-ink-soft' : 'text-muted italic'}>
                                    {item.caption || 'Tambah deskripsi'}
                                </span>
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {lightbox !== null && (
                <MediaLightbox
                    items={visible}
                    index={lightbox}
                    onIndexChange={setLightbox}
                    onClose={() => setLightbox(null)}
                    onDelete={(item) => {
                        setLightbox(null);
                        setPendingDelete(item);
                    }}
                />
            )}

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={() =>
                    router.delete(`/media/${pendingDelete.id}`, {
                        preserveScroll: true,
                        onFinish: () => setPendingDelete(null),
                    })
                }
                title="Hapus berkas ini?"
                description="Berkas akan dihapus dari dokumentasi survei."
            />
        </div>
    );
}
