/**
 * URL Google Maps yang dibangun di sisi klien.
 *
 * Aman dirakit di sini karena isinya hanya angka koordinat — tidak ada teks dari
 * pengguna yang masuk. URL yang berasal dari tautan tempelan tetap dibangun di
 * server (lihat App\Support\GoogleMapsLink), di mana daftar host dijaga.
 */

const HOST = 'https://www.google.com/maps';

/** Koordinat dipangkas ke 6 desimal — sekitar 11 cm, jauh lebih dari cukup. */
function pair({ latitude, longitude }) {
    return `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;
}

/**
 * Peta rute dari satu titik ke titik lain, untuk ditaruh di <iframe>.
 *
 * `output=embed` tidak butuh API key. Rutenya statis: Google menggambar garis
 * dan jaraknya, tapi tidak mengikuti pergerakan — untuk itu pakai
 * `directionsAppUrl()`.
 */
export function directionsEmbedUrl(from, to, mode = 'driving') {
    const flag = { driving: 'd', walking: 'w', transit: 'r' }[mode] ?? 'd';

    return `${HOST}?saddr=${pair(from)}&daddr=${pair(to)}&dirflg=${flag}&hl=id&output=embed`;
}

/** Peta satu titik, untuk ditaruh di <iframe>. Tidak butuh API key. */
export function placeEmbedUrl(point, zoom = 17) {
    return `${HOST}?q=${pair(point)}&z=${zoom}&hl=id&output=embed`;
}

/**
 * Membuka Google Maps yang sebenarnya — aplikasi di ponsel kalau ada.
 *
 * Di sanalah pelacakan sungguhan terjadi: titik biru yang bergerak, arah
 * belok-per-belok, GPS perangkat. Titik awal sengaja dikosongkan supaya Google
 * memakai posisi terkini pengguna; `from` hanya diisi untuk rute yang memang
 * tidak berangkat dari pengguna, misalnya kos ke tujuan daftarnya.
 */
export function directionsAppUrl(to, from = null) {
    const origin = from ? `&origin=${pair(from)}` : '';

    return `https://www.google.com/maps/dir/?api=1&destination=${pair(to)}${origin}`;
}

/**
 * Posisi pengguna dari peramban.
 *
 * `navigator.geolocation` adalah fitur peramban, bukan layanan berbayar — tidak
 * ada hubungannya dengan Places API. Tapi ia hanya tersedia di secure context:
 * HTTPS atau localhost.
 */
export function currentPosition({ timeout = 10000 } = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('unsupported'));

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                }),
            (error) => reject(error),
            { enableHighAccuracy: true, timeout, maximumAge: 30000 },
        );
    });
}
