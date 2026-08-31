import { Star } from 'lucide-react';
import { cn } from './Ui';

/** Read-only score display — filled stars plus the numeric value. */
export function Stars({ value, size = 'size-3.5', showValue = false, className }) {
    if (value === null || value === undefined) {
        return <span className={cn('text-xs font-medium text-muted', className)}>Belum dinilai</span>;
    }

    return (
        <span className={cn('inline-flex items-center gap-1', className)}>
            <span className="inline-flex">
                {[1, 2, 3, 4, 5].map((step) => (
                    <Star
                        key={step}
                        className={cn(
                            size,
                            step <= Math.round(value) ? 'fill-butter text-butter' : 'text-line-strong',
                        )}
                        strokeWidth={1.5}
                    />
                ))}
            </span>
            {showValue && <span className="text-xs font-medium text-ink-soft">{Number(value).toFixed(1)}</span>}
        </span>
    );
}

/** Interactive 1–5 picker; clicking the active star clears the score. */
export function StarInput({ value, onChange, name }) {
    return (
        <span className="inline-flex items-center gap-0.5" role="radiogroup" aria-label={name}>
            {[1, 2, 3, 4, 5].map((step) => (
                <button
                    key={step}
                    type="button"
                    role="radio"
                    aria-checked={value === step}
                    aria-label={`${step} dari 5`}
                    onClick={() => onChange(value === step ? null : step)}
                    className="rounded p-0.5 transition-transform hover:scale-110"
                >
                    <Star
                        className={cn(
                            'size-5',
                            value && step <= value ? 'fill-butter text-butter' : 'text-line-strong',
                        )}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </span>
    );
}
