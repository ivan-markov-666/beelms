export const SUPPORTED_LANGS = ["bg", "en", "de"] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = "bg";

export function normalizeLang(raw: string | null | undefined): SupportedLang {
  if (!raw) {
    return DEFAULT_LANG;
  }

  if ((SUPPORTED_LANGS as readonly string[]).includes(raw)) {
    return raw as SupportedLang;
  }

  return DEFAULT_LANG;
}
