"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  type SupportedLang,
  normalizeLang,
} from "../../../i18n/config";

type LanguageSwitcherProps = {
  supportedLangs?: readonly string[] | null;
  defaultLang?: string | null;
  icons?: Record<
    string,
    { lightUrl?: string | null; darkUrl?: string | null } | null
  > | null;
  themeVariant?: "light" | "dark" | null;
  flagPicker?: {
    global?: string | null;
    byLang?: Record<string, string | null> | null;
  } | null;
};

export function LanguageSwitcher({
  supportedLangs,
  defaultLang,
  icons,
  themeVariant,
  flagPicker,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  const normalizedTheme: "light" | "dark" =
    themeVariant === "dark" ? "dark" : "light";
  const iconEntry = icons?.[currentLang] ?? null;
  const iconUrlRaw =
    normalizedTheme === "dark"
      ? (iconEntry?.darkUrl ?? "")
      : (iconEntry?.lightUrl ?? "");
  const iconUrl = iconUrlRaw.trim() || null;

  const resolveIconUrl = useCallback(
    (lang: SupportedLang) => {
      const entry = icons?.[lang] ?? null;
      const raw =
        normalizedTheme === "dark"
          ? (entry?.darkUrl ?? "")
          : (entry?.lightUrl ?? "");
      const url = raw.trim();
      return url.length ? url : null;
    },
    [icons, normalizedTheme],
  );

  const resolveFlagCode = useCallback(
    (lang: SupportedLang) => {
      const raw =
        (flagPicker?.byLang?.[lang] ?? "") || (flagPicker?.global ?? "");
      const code = raw.trim().toLowerCase();
      return code.length ? code : null;
    },
    [flagPicker],
  );

  const flagCode = resolveFlagCode(currentLang);

  const persistLangCookie = useCallback((lang: SupportedLang) => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      document.cookie = `ui_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    persistLangCookie(currentLang);
  }, [currentLang, persistLangCookie]);

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

    persistLangCookie(nextLang);

    window.location.assign(nextUrl);
  };

  const showIcon = Boolean(iconUrl);
  const showFlag = Boolean(flagCode);

  const currentLabel = currentLang.toUpperCase();

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const handle = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (root.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative flex items-center text-xs text-zinc-700"
    >
      <label htmlFor="global-lang" className="sr-only">
        Език на съдържанието
      </label>
      <div
        className={`inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm transition ring-emerald-500 focus-within:ring-2`}
      >
        {showIcon ? (
          <Image
            alt=""
            aria-hidden="true"
            src={iconUrl ?? ""}
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 rounded-sm object-cover"
            unoptimized
          />
        ) : showFlag ? (
          <span
            aria-hidden="true"
            className={`fi fi-${flagCode} h-4 w-4 shrink-0 rounded-sm`}
          />
        ) : null}
        <button
          id="global-lang"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((p) => !p)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
            if (
              event.key === "ArrowDown" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              setOpen(true);
            }
          }}
          className={`inline-flex items-center gap-1 bg-transparent text-xs font-semibold text-gray-700 focus:outline-none focus:ring-0 ${showIcon || showFlag ? "pl-0" : "pl-1"}`}
        >
          <span>{currentLabel}</span>
          <svg
            className={`h-3.5 w-3.5 text-gray-500 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open ? (
        <div
          role="listbox"
          aria-label="Език на съдържанието"
          className="absolute right-0 top-full z-50 mt-1 max-h-60 min-w-[8rem] overflow-auto rounded-md border border-gray-200 bg-white p-1 text-xs shadow-lg"
        >
          {fallbackSupported.map((lang) => {
            const value = lang.toLowerCase() as SupportedLang;
            const selected = value === currentLang;
            const optionIconUrl = resolveIconUrl(value);
            const optionFlagCode = resolveFlagCode(value);
            const optionShowIcon = Boolean(optionIconUrl);
            const optionShowFlag = !optionShowIcon && Boolean(optionFlagCode);
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  handleChange(value);
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-semibold transition ${
                  selected
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {optionShowIcon ? (
                  <Image
                    alt=""
                    aria-hidden="true"
                    src={optionIconUrl ?? ""}
                    width={16}
                    height={16}
                    className="h-4 w-4 shrink-0 rounded-sm object-cover"
                    unoptimized
                  />
                ) : optionShowFlag ? (
                  <span
                    aria-hidden="true"
                    className={`fi fi-${optionFlagCode} h-4 w-4 shrink-0 rounded-sm`}
                  />
                ) : null}
                <span>{value.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
