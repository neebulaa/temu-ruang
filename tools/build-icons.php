<?php

/**
 * Membangun seluruh berkas ikon dari satu gambar sumber.
 *
 *   php tools/build-icons.php resources/brand/mark.png
 *
 * Sumbernya gambar tanda TemuRuang (pin + rumah) berbentuk persegi, sebaiknya
 * 1024x1024 atau lebih. Latar putih akan dibuat transparan otomatis, jadi
 * ekspor apa adanya sudah cukup — tidak perlu menyiapkan PNG transparan.
 *
 * Menghasilkan, di public/:
 *   favicon.ico (16/32/48) · apple-touch-icon.png (180)
 *   icon-192.png · icon-512.png · brand-mark.png (256, dipakai <BrandMark />)
 */
use App\Support\Theme;

require __DIR__.'/../vendor/autoload.php';

const SIZES = [
    'brand-mark.png' => 256,
    'apple-touch-icon.png' => 180,
    'icon-192.png' => 192,
    'icon-512.png' => 512,
];

const ICO_SIZES = [16, 32, 48];

/** Ambang "cukup putih untuk dianggap latar", 0-255. */
const WHITE_CUTOFF = 246;

$source = $argv[1] ?? null;

if (! $source || ! is_file($source)) {
    fwrite(STDERR, "Pakai: php tools/build-icons.php <berkas-sumber.png>\n");
    exit(1);
}

$image = @imagecreatefromstring(file_get_contents($source));

if (! $image) {
    fwrite(STDERR, "Tidak bisa membaca gambar: {$source}\n");
    exit(1);
}

$image = squareTrimmed(transparentBackground($image));

$public = __DIR__.'/../public';

foreach (SIZES as $name => $size) {
    imagepng(scaled($image, $size), "{$public}/{$name}", 9);
    echo "  {$name} ({$size}px)\n";
}

$favicon = squareTrimmed(pinAndHouse($image));

$frames = [];

foreach (ICO_SIZES as $size) {
    ob_start();
    imagepng(scaled($favicon, $size), null, 9);
    $frames[$size] = ob_get_clean();
}

$offset = 6 + 16 * count($frames);
$directory = '';
$body = '';

foreach ($frames as $size => $png) {
    $directory .= pack('CCCCvvVV', $size % 256, $size % 256, 0, 0, 1, 32, strlen($png), $offset);
    $body .= $png;
    $offset += strlen($png);
}

file_put_contents("{$public}/favicon.ico", pack('vvv', 0, 1, count($frames)).$directory.$body);
echo '  favicon.ico ('.implode('/', ICO_SIZES)."px)\n";

/*
 * Satu tanda per warna aksen. Pengguna bisa mengganti warna aplikasi di
 * Pengaturan, dan raster tidak bisa diwarnai ulang lewat CSS — jadi variannya
 * dibuat di sini sekali, bukan setiap permintaan.
 */
foreach (Theme::THEMES as $key => $theme) {
    imagepng(recoloured(scaled($image, 256), $theme['accent']), "{$public}/brand-mark-{$key}.png", 9);
    echo "  brand-mark-{$key}.png\n";

    /*
     * Favicon ikut warna juga. Berkasnya terpisah per tema, jadi cache browser
     * tidak pernah bentrok — itulah yang membuat ini aman, padahal favicon
     * biasanya satu per origin.
     */
    imagepng(recoloured(scaled($favicon, 64), $theme['accent']), "{$public}/favicon-{$key}.png", 9);
    echo "  favicon-{$key}.png\n";
}

/**
 * Ganti warna merek pada tanda dengan warna lain.
 *
 * Hanya piksel yang memang berwarna merek yang disentuh: rona dalam rentang
 * coral dan cukup jenuh. Garis luar cokelat gelap, wajah krem, dan bagian putih
 * tetap seperti aslinya — gambarnya tetap gambar yang sama, hanya bagian
 * berwarnanya yang berpindah rona.
 */
function recoloured($image, string $target)
{
    [$targetHue, $targetSaturation] = hsl(
        (int) hexdec(substr($target, 1, 2)),
        (int) hexdec(substr($target, 3, 2)),
        (int) hexdec(substr($target, 5, 2)),
    );

    $width = imagesx($image);
    $height = imagesy($image);

    imagealphablending($image, false);
    imagesavealpha($image, true);

    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $rgba = imagecolorsforindex($image, imagecolorat($image, $x, $y));

            if ($rgba['alpha'] > 110) {
                continue;
            }

            [$hue, $saturation, $lightness] = hsl($rgba['red'], $rgba['green'], $rgba['blue']);

            // Rentang coral pada sumbernya, dan cukup berwarna untuk dianggap merek.
            $isBrand = ($hue <= 25 || $hue >= 350) && $saturation >= 0.25 && $lightness > 0.18;

            if (! $isBrand) {
                continue;
            }

            [$r, $g, $b] = rgb($targetHue, min(1.0, $saturation * ($targetSaturation / 0.65)), $lightness);

            imagesetpixel($image, $x, $y, imagecolorallocatealpha($image, $r, $g, $b, $rgba['alpha']));
        }
    }

    return $image;
}

/** @return array{0: float, 1: float, 2: float} rona 0-360, jenuh 0-1, terang 0-1 */
function hsl(int $red, int $green, int $blue): array
{
    $r = $red / 255;
    $g = $green / 255;
    $b = $blue / 255;

    $max = max($r, $g, $b);
    $min = min($r, $g, $b);
    $delta = $max - $min;
    $lightness = ($max + $min) / 2;

    if ($delta == 0.0) {
        return [0.0, 0.0, $lightness];
    }

    $saturation = $delta / (1 - abs(2 * $lightness - 1));

    $hue = match (true) {
        $max === $r => 60 * fmod(($g - $b) / $delta, 6),
        $max === $g => 60 * (($b - $r) / $delta + 2),
        default => 60 * (($r - $g) / $delta + 4),
    };

    return [fmod($hue + 360, 360), $saturation, $lightness];
}

/** @return array{0: int, 1: int, 2: int} */
function rgb(float $hue, float $saturation, float $lightness): array
{
    $c = (1 - abs(2 * $lightness - 1)) * $saturation;
    $x = $c * (1 - abs(fmod($hue / 60, 2) - 1));
    $m = $lightness - $c / 2;

    [$r, $g, $b] = match (true) {
        $hue < 60 => [$c, $x, 0],
        $hue < 120 => [$x, $c, 0],
        $hue < 180 => [0, $c, $x],
        $hue < 240 => [0, $x, $c],
        $hue < 300 => [$x, 0, $c],
        default => [$c, 0, $x],
    };

    return [
        (int) round(($r + $m) * 255),
        (int) round(($g + $m) * 255),
        (int) round(($b + $m) * 255),
    ];
}

/**
 * Potong tanda ke pin dan rumahnya saja, untuk dipakai sebagai favicon.
 *
 * Gambar penuhnya punya peta lipat, kilau, dan hati. Di 512 px itu bagus, tapi
 * di 16 px semuanya menyatu jadi gumpalan. Pin dan rumah adalah bagian yang
 * masih terbaca sekecil apa pun, jadi favicon memakai potongan itu — potongan,
 * bukan gambar ulang, sehingga tetap artwork yang sama.
 */
function pinAndHouse($image)
{
    $side = imagesx($image);

    // Buang pita bawah — di situlah petanya. Sisanya dipusatkan oleh
    // squareTrimmed(), jadi tidak ada koordinat yang perlu ditebak.
    $keep = (int) ($side * 0.68);

    $out = imagecreatetruecolor($side, $keep);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    imagefilledrectangle($out, 0, 0, $side, $keep, imagecolorallocatealpha($out, 0, 0, 0, 127));
    imagealphablending($out, true);

    imagecopy($out, $image, 0, 0, 0, 0, $side, $keep);

    return $out;
}

/** Ubah piksel yang hampir putih jadi transparan. */
function transparentBackground($image)
{
    $width = imagesx($image);
    $height = imagesy($image);

    $out = imagecreatetruecolor($width, $height);
    imagealphablending($out, false);
    imagesavealpha($out, true);

    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $rgba = imagecolorsforindex($image, imagecolorat($image, $x, $y));

            $isWhite = $rgba['red'] >= WHITE_CUTOFF
                && $rgba['green'] >= WHITE_CUTOFF
                && $rgba['blue'] >= WHITE_CUTOFF;

            imagesetpixel($out, $x, $y, imagecolorallocatealpha(
                $out,
                $rgba['red'],
                $rgba['green'],
                $rgba['blue'],
                $isWhite ? 127 : $rgba['alpha'],
            ));
        }
    }

    return $out;
}

/**
 * Potong ruang kosong di tepi, lalu jadikan persegi.
 *
 * Ekspor logo biasanya punya banyak margin; tanpa dipotong, tanda ini akan
 * terlihat kecil sekali di favicon 16 px.
 */
function squareTrimmed($image)
{
    $width = imagesx($image);
    $height = imagesy($image);

    $minX = $width;
    $minY = $height;
    $maxX = -1;
    $maxY = -1;

    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            if (imagecolorsforindex($image, imagecolorat($image, $x, $y))['alpha'] < 100) {
                $minX = min($minX, $x);
                $minY = min($minY, $y);
                $maxX = max($maxX, $x);
                $maxY = max($maxY, $y);
            }
        }
    }

    if ($maxX < 0) {
        return $image;
    }

    $boxWidth = $maxX - $minX + 1;
    $boxHeight = $maxY - $minY + 1;
    $side = (int) (max($boxWidth, $boxHeight) * 1.06);

    $out = imagecreatetruecolor($side, $side);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    imagefilledrectangle($out, 0, 0, $side, $side, imagecolorallocatealpha($out, 0, 0, 0, 127));
    imagealphablending($out, true);

    imagecopy(
        $out,
        $image,
        (int) (($side - $boxWidth) / 2),
        (int) (($side - $boxHeight) / 2),
        $minX,
        $minY,
        $boxWidth,
        $boxHeight,
    );

    return $out;
}

function scaled($image, int $size)
{
    $out = imagescale($image, $size, $size, IMG_BICUBIC);
    imagesavealpha($out, true);

    return $out;
}
