export const SUPPORTED_LANGS = [
  "bg",
  "en",
  "de",
  "es",
  "pt",
  "pl",
  "ua",
  "ru",
  "fr",
  "tr",
  "ro",
  "hi",
  "vi",
  "id",
  "it",
  "ko",
  "ja",
  "nl",
  "cs",
  "ar",
] as const;

export const DEFAULT_LANGUAGE_FLAG_BY_LANG: Record<string, string> = {
  bg: "bg",
  en: "gb",
  de: "de",
  es: "es",
  pt: "pt",
  pl: "pl",
  ua: "ua",
  ru: "ru",
  fr: "fr",
  tr: "tr",
  ro: "ro",
  hi: "in",
  vi: "vn",
  id: "id",
  it: "it",
  ko: "kr",
  ja: "jp",
  nl: "nl",
  cs: "cz",
  ar: "sa",
};

export type SupportedLang = string;

export const DEFAULT_LANG = "bg";

const LANG_CODE_REGEX = /^[a-z]{2,5}$/i;

export function normalizeLang(
  raw: string | null | undefined,
  supportedLangs?: readonly string[],
  fallbackLang?: string,
): SupportedLang {
  const fallback =
    (fallbackLang && fallbackLang.trim()) ||
    (supportedLangs && supportedLangs.length > 0
      ? (supportedLangs[0] ?? DEFAULT_LANG)
      : DEFAULT_LANG);

  const normalizedRaw = (raw ?? "").trim();
  if (!normalizedRaw) {
    return fallback;
  }

  const normalizedLower = normalizedRaw.toLowerCase();
  if (!LANG_CODE_REGEX.test(normalizedLower)) {
    return fallback;
  }

  const normalized = normalizedLower === "uk" ? "ua" : normalizedLower;

  if (!supportedLangs || supportedLangs.length === 0) {
    return normalized;
  }

  if (supportedLangs.some((lang) => lang.toLowerCase() === normalized)) {
    return normalized;
  }

  return fallback;
}
