"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";
import {
  getPublicSettings,
  type PublicSettings,
} from "../_data/public-settings";

export function SiteFooter() {
  const lang = useCurrentLang();
  const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initPublicSettings = async () => {
      try {
        const s = await getPublicSettings();
        if (cancelled) return;
        setPublicSettings(s);
      } catch {
        if (cancelled) return;
        setPublicSettings(null);
      }
    };

    void initPublicSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const gdprLegalEnabled = publicSettings?.features?.gdprLegal !== false;

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white px-4 py-6 text-xs text-gray-600">
      <div className="mx-auto flex max-w-7xl items-center justify-center text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-green-700">
            {t(lang, "common", "footerAboutLink")}
          </Link>
          {gdprLegalEnabled && (
            <>
              <span className="hidden text-gray-400 sm:inline">|</span>
              <Link href="/legal/privacy" className="hover:text-green-700">
                {t(lang, "common", "legalFooterPrivacyLink")}
              </Link>
            </>
          )}
          <span className="hidden text-gray-400 sm:inline">|</span>
          <Link href="/contact" className="hover:text-green-700">
            {t(lang, "common", "footerContactLink")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
