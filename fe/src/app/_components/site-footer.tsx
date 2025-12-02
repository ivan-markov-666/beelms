"use client";

import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export function SiteFooter() {
  const lang = useCurrentLang();

  return (
    <footer className="mt-8 border-t border-zinc-200 bg-white px-4 py-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-[11px] sm:text-xs">
          {t(lang, "common", "legalFooterDisclaimer")}
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/legal/privacy"
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {t(lang, "common", "legalFooterPrivacyLink")}
          </Link>
          <span className="hidden text-zinc-400 sm:inline">•</span>
          <Link
            href="/legal/terms"
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {t(lang, "common", "legalFooterTermsLink")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
