const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

export function formatMoney(value) {
    if (value === null || value === undefined || value === '') return null;

    return rupiah.format(Number(value));
}

/** Short money for tight spots — "Rp2,3 jt". */
export function formatMoneyCompact(value) {
    if (value === null || value === undefined || value === '') return null;

    return `Rp${compact.format(Number(value))}`;
}

/** "Rp2.000.000 – Rp2.500.000", or a single figure when only one side is set. */
export function formatPriceRange(min, max) {
    const low = formatMoney(min);
    const high = formatMoney(max);

    if (low && high) return low === high ? low : `${low} – ${high}`;
    if (low) return low;
    if (high) return `sampai ${high}`;

    return null;
}

export function formatBudget(min, max) {
    const low = formatMoney(min);
    const high = formatMoney(max);

    if (low && high) return `${low} – ${high}`;
    if (low) return `dari ${low}`;
    if (high) return `sampai ${high}`;

    return null;
}

/**
 * Jarak yang dipakai di layar.
 *
 * Jarak jalan kalau layanan rutenya menjawab, garis lurus kalau tidak — orang
 * merasakan jarak sebagai "berapa jauh harus ditempuh", bukan jarak udara.
 */
export function placeDistanceKm(place) {
    return place.road_distance_km ?? place.distance_km;
}

export function formatDistance(km) {
    if (km === null || km === undefined) return null;

    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return null;

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) return `${mins}m`;

    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
    if (!value) return null;

    return new Date(value).toLocaleDateString('id-ID', options);
}

export function greeting(date = new Date()) {
    const hour = date.getHours();

    if (hour < 12) return 'Selamat pagi';
    if (hour < 18) return 'Selamat sore';

    return 'Selamat malam';
}

