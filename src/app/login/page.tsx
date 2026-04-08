import { signInAction } from "@/lib/auth/actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sales Pipeline Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your Supabase email/password account.
        </p>

        <form action={signInAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="you@example.com"
              type="email"
              name="email"
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="••••••••"
              type="password"
              name="password"
              required
            />
          </label>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <FormSubmitButton
            idleLabel="Sign in"
            pendingLabel="Signing in..."
            className="block w-full rounded-md bg-brand-600 px-4 py-2 text-center font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </form>
      </section>
    </main>
  );
}
