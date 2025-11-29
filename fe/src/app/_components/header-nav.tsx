"use client";

import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export function HeaderNav() {
  const lang = useCurrentLang();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <nav className="flex items-center gap-4">
        <Link
          href="/wiki"
          className="font-medium hover:text-zinc-950 dark:hover:text-white"
        >
          {t(lang, "nav", "wiki")}
        </Link>
        {/* Placeholder for future practice section route */}
        {/* <Link
          href="/practice"
          className="font-medium hover:text-zinc-950 dark:hover:text-white"
        >
          {t(lang, "nav", "practice")}
        </Link> */}
        <Link
          href="/auth/login"
          className="font-medium hover:text-zinc-950 dark:hover:text-white"
        >
          {t(lang, "nav", "login")}
        </Link>
      </nav>
    </header>
  );
}
