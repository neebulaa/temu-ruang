/** The two states a place can be in. */
export const SURVEYED_STYLES = {
    true: 'bg-mint-soft text-mint-ink border-mint/30',
    false: 'bg-surface text-muted border-line',
};

export function labelFor(options, value) {
    return options?.find((option) => option.value === value)?.label ?? value;
}
