import { Link } from '@inertiajs/react';
import { forwardRef } from 'react';

export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

/* ---------------------------------------------------------------- surfaces */

export function Card({ as: Tag = 'div', className, ...props }) {
    return <Tag className={cn('card', className)} {...props} />;
}

export function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-1 text-xs font-medium tracking-wide text-accent-ink">{eyebrow}</p>
                )}
                <h1 className="text-[1.75rem] leading-tight text-ink sm:text-4xl">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm font-normal text-ink-soft">{description}</p>
                )}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-accent-soft text-2xl text-accent-ink">
                {Icon && <Icon className="size-6" strokeWidth={2.2} />}
            </span>
            <h3 className="text-lg text-ink">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-sm font-normal text-muted">{description}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

export function SectionTitle({ children, action }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base text-ink">{children}</h2>
            {action}
        </div>
    );
}

/* ----------------------------------------------------------------- signals */

export function Badge({ className, children, ...props }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium',
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export function Progress({ value, className, bar = 'bg-accent' }) {
    return (
        <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
            <div
                className={cn('h-full rounded-full transition-[width] duration-500', bar)}
                style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ inputs */

export const Input = forwardRef(function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn('field', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn('field resize-y', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, options = [], placeholder, ...props }, ref) {
    return (
        <select ref={ref} className={cn('field', className)} {...props}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
});

export function Field({ label, error, required, children, className }) {
    return (
        <div className={className}>
            {label && (
                <label className="label">
                    {label}
                    {required && <span className="ml-0.5 text-blossom">*</span>}
                </label>
            )}
            {children}
            {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
        </div>
    );
}

/* ----------------------------------------------------------------- actions */

/**
 * Satu tombol pilih untuk seluruh aplikasi.
 *
 * Sebelumnya pola ini ditulis ulang di lima tempat — pemilih tempat di halaman
 * Banding, chip fasilitas, penyaring area galeri, tab detail tempat, dan
 * pengalih Daftar/Peta — masing-masing dengan radius dan warna aktif sendiri.
 *
 * `outline` untuk memilih beberapa hal (berbingkai, aktif = tint lembut).
 * `solid` untuk tab dan pengalih tampilan (tanpa bingkai, aktif = isi penuh).
 */
export function ToggleChip({ active, variant = 'outline', size = 'sm', className, children, ...props }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-colors',
                size === 'sm' ? 'min-h-9 px-3.5 text-xs' : 'min-h-10 px-4 text-sm',
                variant === 'outline'
                    ? active
                        ? 'border border-accent bg-accent-soft text-accent-ink'
                        : 'border border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-sunken'
                    : active
                      ? 'bg-accent text-white'
                      : 'text-ink-soft hover:bg-line hover:text-ink',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Tombol yang isinya hanya ikon.
 *
 * `label` wajib: tanpa teks, pembaca layar tidak punya apa pun untuk dibacakan.
 * `tone` "overlay" dipakai di atas latar gelap (kamera, lightbox), sisanya di
 * atas permukaan terang.
 */
export function IconButton({ icon: Icon, label, tone = 'default', size = 'md', className, ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                'grid shrink-0 place-items-center rounded-lg transition-colors',
                { sm: 'size-7', md: 'size-9', lg: 'size-10' }[size],
                {
                    default: 'text-muted hover:bg-line hover:text-ink',
                    danger: 'text-danger hover:bg-danger hover:text-white',
                    overlay: 'bg-white/10 text-white hover:bg-white/25',
                    accent: 'bg-accent text-white hover:bg-accent-ink',
                    surface: 'bg-surface/95 text-ink-soft hover:bg-surface hover:text-ink',
                }[tone],
                className,
            )}
            {...props}
        >
            <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={2} />
        </button>
    );
}

export function Button({ as, variant = 'primary', className, ...props }) {
    const classes = cn(
        {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            ghost: 'btn-ghost',
            danger: 'btn-danger',
        }[variant],
        className,
    );

    if (as === 'link') {
        const { href, ...rest } = props;

        return <Link href={href} className={classes} {...rest} />;
    }

    return <button type="button" className={classes} {...props} />;
}
