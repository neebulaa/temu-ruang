/**
 * Each survey list gets its own pastel colour, picked deterministically from
 * its id so it stays the same everywhere the list appears.
 */
export const PASTELS = [
    {
        key: 'grape',
        bg: 'bg-grape-soft',
        text: 'text-grape-ink',
        solid: 'bg-grape',
        ring: 'border-grape/30',
        bar: 'bg-grape',
        dot: 'bg-grape',
    },
    {
        key: 'blossom',
        bg: 'bg-blossom-soft',
        text: 'text-blossom-ink',
        solid: 'bg-blossom',
        ring: 'border-blossom/30',
        bar: 'bg-blossom',
        dot: 'bg-blossom',
    },
    {
        key: 'sky',
        bg: 'bg-sky-soft',
        text: 'text-sky-ink',
        solid: 'bg-sky',
        ring: 'border-sky/30',
        bar: 'bg-sky',
        dot: 'bg-sky',
    },
    {
        key: 'mint',
        bg: 'bg-mint-soft',
        text: 'text-mint-ink',
        solid: 'bg-mint',
        ring: 'border-mint/30',
        bar: 'bg-mint',
        dot: 'bg-mint',
    },
    {
        key: 'butter',
        bg: 'bg-butter-soft',
        text: 'text-butter-ink',
        solid: 'bg-butter',
        ring: 'border-butter/30',
        bar: 'bg-butter',
        dot: 'bg-butter',
    },
    {
        key: 'peach',
        bg: 'bg-peach-soft',
        text: 'text-peach-ink',
        solid: 'bg-peach',
        ring: 'border-peach/30',
        bar: 'bg-peach',
        dot: 'bg-peach',
    },
];

export function pastelFor(id) {
    return PASTELS[Math.abs(Number(id) || 0) % PASTELS.length];
}
