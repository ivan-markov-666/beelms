"use client";

import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export function SiteFooter() {
  const lang = useCurrentLang();

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white px-4 py-6 text-xs text-gray-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-[11px] sm:text-xs">
          {t(lang, "common", "legalFooterDisclaimer")}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/legal/privacy"
            className="hover:text-green-700 dark:hover:text-zinc-100"
          >
            {t(lang, "common", "legalFooterPrivacyLink")}
          </Link>
          <span className="hidden text-gray-400 sm:inline">|</span>
          <Link
            href="/legal/terms"
            className="hover:text-green-700 dark:hover:text-zinc-100"
          >
            {t(lang, "common", "legalFooterTermsLink")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
