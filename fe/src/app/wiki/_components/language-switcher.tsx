"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SUPPORTED_LANGS,
  type SupportedLang,
  normalizeLang,
} from "../../../i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLang = normalizeLang(searchParams.get("lang"));

  const handleChange = (target: SupportedLang) => {
    if (!pathname) return;
    if (target === currentLang) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", target);

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
        onChange={(event) =>
          handleChange(event.target.value as SupportedLang)
        }
        className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-zinc-500"
      >
        {SUPPORTED_LANGS.map((lang) => (
          <option key={lang} value={lang}>
            {lang.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
