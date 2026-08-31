import { useLayoutEffect, useRef } from 'react';
import { Input } from './Ui';

const groups = new Intl.NumberFormat('id-ID');

const digitsOf = (value) => String(value ?? '').replace(/\D/g, '');

const format = (digits) => (digits === '' ? '' : groups.format(Number(digits)));

/** Posisi karakter tepat setelah digit ke-n pada teks yang sudah berformat. */
function caretAfterDigits(text, count) {
    if (count === 0) return 0;

    let seen = 0;

    for (let index = 0; index < text.length; index += 1) {
        if (/\d/.test(text[index])) {
            seen += 1;
            if (seen === count) return index + 1;
        }
    }

    return text.length;
}

/**
 * Input rupiah yang memberi titik ribuan sambil diketik — "2.600.000" jauh
 * lebih gampang dibaca daripada "2600000" waktu memastikan nol-nya pas.
 *
 * Nilai yang keluar lewat onChange tetap angka polos, jadi pemakainya tidak
 * perlu tahu soal format. Karena field-nya teks (angka berformat tidak sah di
 * input number), panah atas/bawah dijalankan sendiri supaya langkah `step`
 * yang dulu dipegang spinner bawaan tidak hilang.
 */
export default function MoneyInput({ value, onChange, step = 50000, ...props }) {
    const ref = useRef(null);
    const caret = useRef(null);

    useLayoutEffect(() => {
        if (caret.current === null || !ref.current) return;

        const position = caretAfterDigits(ref.current.value, caret.current);

        ref.current.setSelectionRange(position, position);
        caret.current = null;
    });

    const handleChange = (event) => {
        const { value: typed, selectionStart } = event.target;

        caret.current = digitsOf(typed.slice(0, selectionStart)).length;
        onChange(digitsOf(typed).replace(/^0+(?=\d)/, ''));
    };

    const handleKeyDown = (event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

        event.preventDefault();

        const current = Number(digitsOf(value) || 0);
        const next = Math.max(0, event.key === 'ArrowUp' ? current + step : current - step);

        caret.current = String(next).length;
        onChange(String(next));
    };

    return (
        <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={format(digitsOf(value))}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...props}
        />
    );
}
