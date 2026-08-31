import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import AccentPicker from '../../Components/AccentPicker';
import Modal from '../../Components/Modal';
import { Card, Field, Input, PageHeader } from '../../Components/Ui';

function ProfileForm({ user }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (event) => {
        event.preventDefault();
        put('/settings/profile', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <Field label="Nama" error={errors.name} required>
                <Input value={data.name} onChange={(event) => setData('name', event.target.value)} required />
            </Field>

            <Field label="Email" error={errors.email} required>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    required
                />
            </Field>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={processing} className="btn-primary">
                    {processing ? 'Menyimpan…' : 'Simpan profil'}
                </button>
                {recentlySuccessful && <span className="text-xs text-accent">Tersimpan</span>}
            </div>
        </form>
    );
}

function PasswordForm() {
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <Field label="Kata sandi saat ini" error={errors.current_password} required>
                <Input
                    type="password"
                    value={data.current_password}
                    onChange={(event) => setData('current_password', event.target.value)}
                    autoComplete="current-password"
                    required
                />
            </Field>

            <Field label="Kata sandi baru" error={errors.password} required>
                <Input
                    type="password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    required
                />
            </Field>

            <Field label="Ulangi kata sandi baru" error={errors.password_confirmation} required>
                <Input
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    autoComplete="new-password"
                    required
                />
            </Field>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={processing} className="btn-primary">
                    {processing ? 'Memperbarui…' : 'Perbarui kata sandi'}
                </button>
                {recentlySuccessful && <span className="text-xs text-accent">Diperbarui</span>}
            </div>
        </form>
    );
}

function DeleteAccount() {
    const [open, setOpen] = useState(false);
    const { data, setData, delete: destroy, processing, errors, reset } = useForm({ password: '' });

    const submit = (event) => {
        event.preventDefault();
        destroy('/settings/account');
    };

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="btn-danger">
                <Trash2 className="size-4" strokeWidth={1.75} />
                Hapus akun
            </button>

            <Modal
                open={open}
                onClose={() => {
                    reset();
                    setOpen(false);
                }}
                title="Hapus akunmu?"
                description="Semua daftar survei, tempat, foto, dan catatan dihapus permanen."
                size="max-w-md"
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Konfirmasi dengan kata sandi" error={errors.password} required>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </Field>

                    <button type="submit" disabled={processing} className="btn-danger w-full">
                        {processing ? 'Menghapus…' : 'Hapus akun saya permanen'}
                    </button>
                </form>
            </Modal>
        </>
    );
}

export default function Index({ stats }) {
    const { auth } = usePage().props;

    return (
        <AppLayout>
            <Head title="Pengaturan" />

            <PageHeader eyebrow="Pengaturan" title="Akun Saya" />

            <div className="space-y-6">
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="mb-5 text-sm font-medium text-ink font-sans">Profil</h2>
                        <ProfileForm user={auth.user} />
                    </Card>

                    <Card className="p-6">
                        <h2 className="mb-5 text-sm font-medium text-ink font-sans">Warna aplikasi</h2>
                        <AccentPicker />
                    </Card>

                    <Card className="p-6">
                        <h2 className="mb-5 text-sm font-medium text-ink font-sans">Kata sandi</h2>
                        <PasswordForm />
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-sm font-medium text-ink font-sans">Zona berbahaya</h2>
                        <p className="mt-1 mb-5 text-xs text-muted">
                            Menghapus akun tidak bisa dibatalkan.
                        </p>
                        <DeleteAccount />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="divide-y divide-line">
                        <div className="px-5 py-4">
                            <p className="text-xs tracking-wide text-muted uppercase">Daftar survei</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                                {stats.lists}
                            </p>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-xs tracking-wide text-muted uppercase">Tempat tercatat</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                                {stats.places}
                            </p>
                        </div>
                    </Card>

                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="btn-secondary w-full"
                    >
                        <LogOut className="size-4" strokeWidth={1.75} />
                        Keluar
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
