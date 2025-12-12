"use client";

import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

export function SiteFooter() {
  const lang = useCurrentLang();

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white px-4 py-6 text-xs text-gray-600">
      <div className="mx-auto flex max-w-7xl items-center justify-center text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/about"
            className="hover:text-green-700"
          >
            {t(lang, "common", "footerAboutLink")}
          </Link>
          <span className="hidden text-gray-400 sm:inline">|</span>
          <Link
            href="/legal/privacy"
            className="hover:text-green-700"
          >
            {t(lang, "common", "legalFooterPrivacyLink")}
          </Link>
          <span className="hidden text-gray-400 sm:inline">|</span>
          <Link
            href="/contact"
            className="hover:text-green-700"
          >
            {t(lang, "common", "footerContactLink")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
