import { Head, Link } from '@inertiajs/react';
import { Brand } from '../Components/Brand';

export default function AuthLayout({ title, heading, description, children }) {
    return (
        <>
            <Head title={title} />

            <div className="min-h-screen bg-canvas">
                <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
                    <Link href="/login" className="mb-8 inline-flex self-start">
                        <Brand />
                    </Link>

                    <div className="card p-7">
                        <h1 className="text-2xl text-ink">{heading}</h1>
                        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}

                        <div className="mt-7">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
