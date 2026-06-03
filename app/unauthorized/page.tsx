import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="os-grid flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-md p-6">
        <div className="mono-label mb-3 text-redline">Unauthorized</div>
        <h1 className="display-title text-2xl font-medium text-text">Role access required</h1>
        <p className="mt-3 font-mono text-[11px] leading-6 text-text-low">
          Your account is signed in, but the profile role does not allow this operation. Ask an admin to update your
          profile role in Supabase.
        </p>
        <Link
          href="/dashboard"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center border border-line bg-bg-2 px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim hover:border-line-hi hover:text-text"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
