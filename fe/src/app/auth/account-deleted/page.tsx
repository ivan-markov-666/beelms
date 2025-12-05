'use client';

import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

export default function AccountDeletedPage() {
  const router = useRouter();
  const lang = useCurrentLang();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center bg-gray-50 px-4 py-16">
      <main className="w-full max-w-xl">
        <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M4.938 19h14.124c1.54 0 2.502-1.667 1.732-3L13.732 5c-.77-1.333-2.694-1.333-3.464 0L3.206 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-2 text-xl font-bold text-gray-900 md:text-2xl">
            {t(lang, "auth", "accountDeletedTitle")}
          </h1>
          <p className="mb-4 text-sm text-gray-600">
            {t(lang, "auth", "accountDeletedDescription")}
          </p>
          <p className="mb-6 text-xs text-gray-500 md:text-sm">
            {t(lang, "auth", "accountDeletedHint")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              onClick={() => router.push("/")}
            >
              {t(lang, "auth", "accountDeletedPrimaryCta")}
            </button>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-green-200 bg-white px-6 py-3 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              onClick={() => router.push("/wiki")}
            >
              {t(lang, "auth", "accountDeletedSecondaryCta")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
