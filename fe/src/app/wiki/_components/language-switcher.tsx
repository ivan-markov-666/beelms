"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  type SupportedLang,
  normalizeLang,
} from "../../../i18n/config";

type LanguageSwitcherProps = {
  supportedLangs?: readonly string[] | null;
  defaultLang?: string | null;
};

export function LanguageSwitcher({
  supportedLangs,
  defaultLang,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const normalizedSupported =
    supportedLangs
      ?.map((lang) => (lang ?? "").trim().toLowerCase())
      .filter(Boolean) ?? [];

  const fallbackSupported =
    normalizedSupported.length > 0
      ? normalizedSupported
      : (SUPPORTED_LANGS as readonly string[]);

  const fallbackDefaultLang =
    (defaultLang && defaultLang.trim().toLowerCase()) ||
    fallbackSupported[0] ||
    DEFAULT_LANG;

  const currentLang = normalizeLang(
    searchParams.get("lang"),
    fallbackSupported,
    fallbackDefaultLang,
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      document.cookie = `ui_lang=${currentLang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, [currentLang]);

  const handleChange = (target: SupportedLang) => {
    if (!pathname) return;
    const nextLang = normalizeLang(
      target,
      fallbackSupported,
      fallbackDefaultLang,
    );

    if (nextLang === currentLang) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLang);

    // При смяна на езика на списъка, връщаме на страница 1
    if (pathname === "/wiki") {
      params.delete("page");
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    router.push(nextUrl);
  };

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
      <label htmlFor="global-lang" className="sr-only">
        Език на съдържанието
      </label>
      <select
        id="global-lang"
        value={currentLang}
        onChange={(event) => handleChange(event.target.value as SupportedLang)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {fallbackSupported.map((lang) => {
          const value = lang.toLowerCase();
          return (
            <option key={value} value={value}>
              {value.toUpperCase()}
            </option>
          );
        })}
      </select>
    </div>
  );
}
