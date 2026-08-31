import { Check } from 'lucide-react';
import { cn } from './Ui';

/**
 * The whole survey status: visited, or not yet.
 */
export default function SurveyedToggle({ value, onChange, size = 'md' }) {
    const large = size === 'md';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            className={cn(
                'inline-flex items-center gap-2.5 rounded-full border-2 transition-colors',
                large ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                value
                    ? 'border-mint bg-mint-soft text-mint-ink'
                    : 'border-line bg-surface text-muted hover:border-line-strong',
            )}
        >
            <span
                className={cn(
                    'grid place-items-center rounded-full transition-colors',
                    large ? 'size-5' : 'size-4',
                    value ? 'bg-mint text-white' : 'bg-sunken text-transparent',
                )}
            >
                <Check className={large ? 'size-3.5' : 'size-3'} strokeWidth={3} />
            </span>
            <span className="font-medium">{value ? 'Sudah disurvei' : 'Belum disurvei'}</span>
        </button>
    );
}
