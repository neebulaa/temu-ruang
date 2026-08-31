import { Link, useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Field, Input } from '../../Components/Ui';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/register');
    };

    return (
        <AuthLayout
            title="Buat akun"
            heading="Mulai survei pertamamu"
            description="Satu tempat untuk semua lokasi yang sedang kamu pertimbangkan."
        >
            <form onSubmit={submit} className="space-y-5">
                <Field label="Nama" error={errors.name} required>
                    <Input
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        autoComplete="name"
                        autoFocus
                        required
                    />
                </Field>

                <Field label="Email" error={errors.email} required>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        autoComplete="username"
                        required
                    />
                </Field>

                <Field label="Kata sandi" error={errors.password} required>
                    <Input
                        type="password"
                        value={data.password}
                        onChange={(event) => setData('password', event.target.value)}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        required
                    />
                </Field>

                <Field label="Ulangi kata sandi" error={errors.password_confirmation} required>
                    <Input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </Field>

                <button type="submit" disabled={processing} className="btn-primary w-full">
                    {processing ? 'Membuat akun…' : 'Buat akun'}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-medium text-ink underline underline-offset-4">
                    Masuk
                </Link>
            </p>
        </AuthLayout>
    );
}
