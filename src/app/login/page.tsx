import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sales Pipeline Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is a mock login for the v1 product shell.
        </p>

        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="••••••••"
              type="password"
            />
          </label>

          <Link
            className="block rounded-md bg-brand-600 px-4 py-2 text-center font-medium text-white hover:bg-brand-700"
            href="/dashboard"
          >
            Sign in (Mock)
          </Link>
        </form>
      </section>
    </main>
  );
}
