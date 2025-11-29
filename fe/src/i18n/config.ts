export const SUPPORTED_LANGS = ["bg", "en"] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = "bg";

export function normalizeLang(raw: string | null | undefined): SupportedLang {
  if (raw === "en") {
    return "en";
  }

  return DEFAULT_LANG;
}
