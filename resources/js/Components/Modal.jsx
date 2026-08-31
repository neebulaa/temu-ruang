import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from './Ui';

export default function Modal({ open, onClose, title, description, children, footer, size = 'max-w-lg' }) {
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <button
                type="button"
                aria-label="Tutup"
                onClick={onClose}
                className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            />

            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    'relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface sm:rounded-2xl',
                    size,
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        <h2 className="text-lg text-ink">{title}</h2>
                        {description && (
                            <p className="mt-0.5 text-sm font-normal text-muted">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mt-1 -mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-sunken hover:text-ink"
                        aria-label="Tutup"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="px-5 py-5">{children}</div>

                {footer && (
                    <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>
                )}
            </div>
        </div>
    );
}

/** Destructive confirmation with the same shell as Modal. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Hapus', processing }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            size="max-w-md"
            footer={
                <>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Batal
                    </button>
                    <button type="button" onClick={onConfirm} disabled={processing} className="btn-danger">
                        {processing ? 'Memproses…' : confirmLabel}
                    </button>
                </>
            }
        >
            <p className="text-sm font-normal text-ink-soft">Tindakan ini tidak bisa dibatalkan.</p>
        </Modal>
    );
}
