import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Barangay Santa Rita seal"
            className="h-16 w-16 rounded-full"
          />
          <h1 className="mt-3 text-xl font-semibold text-slate-900">SRHC Time</h1>
          <p className="mt-1 text-sm text-slate-500">Barangay Santa Rita Health Center</p>
        </div>

        {error && (
          <div className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-700 px-4 py-3 text-base font-medium text-white hover:bg-brand-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          Accounts are created by an administrator. Contact your admin if you
          don&apos;t have login details.
        </p>
      </div>
    </div>
  );
}
