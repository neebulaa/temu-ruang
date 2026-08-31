import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Field, Input } from '../../Components/Ui';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <AuthLayout
            title="Masuk"
            heading="Selamat datang kembali"
            description="Lanjutkan survei yang sedang berjalan."
        >
            {status && (
                <p className="mb-6 rounded-xl border border-accent/20 bg-accent-soft px-3.5 py-2.5 text-sm text-accent-ink">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="space-y-5">
                <Field label="Email" error={errors.email} required>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                    />
                </Field>

                <Field label="Kata sandi" error={errors.password} required>
                    <Input
                        type="password"
                        value={data.password}
                        onChange={(event) => setData('password', event.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </Field>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(event) => setData('remember', event.target.checked)}
                        className="size-4 rounded border-line-strong text-accent focus:ring-accent"
                    />
                    Tetap masuk
                </label>

                <button type="submit" disabled={processing} className="btn-primary w-full">
                    {processing ? 'Masuk…' : 'Masuk'}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                Baru di TemuRuang?{' '}
                <Link href="/register" className="font-medium text-ink underline underline-offset-4">
                    Buat akun
                </Link>
            </p>
        </AuthLayout>
    );
}
