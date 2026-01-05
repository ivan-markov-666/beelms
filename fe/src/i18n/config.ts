export const SUPPORTED_LANGS = ["bg", "en", "de"] as const;

export type SupportedLang = string;

export const DEFAULT_LANG = "bg";

const LANG_CODE_REGEX = /^[a-z]{2,5}$/i;

export function normalizeLang(
  raw: string | null | undefined,
  supportedLangs?: readonly string[],
  fallbackLang?: string,
): SupportedLang {
  const fallbackCandidates =
    supportedLangs && supportedLangs.length > 0
      ? supportedLangs
      : (SUPPORTED_LANGS as readonly string[]);

  const fallback =
    (fallbackLang && fallbackLang.trim()) ||
    (fallbackCandidates[0] ?? DEFAULT_LANG) ||
    DEFAULT_LANG;

  const normalizedRaw = (raw ?? "").trim();
  if (!normalizedRaw) {
    return fallback;
  }

  const normalizedLower = normalizedRaw.toLowerCase();
  if (!LANG_CODE_REGEX.test(normalizedLower)) {
    return fallback;
  }

  if (!supportedLangs || supportedLangs.length === 0) {
    return normalizedLower;
  }

  if (supportedLangs.some((lang) => lang.toLowerCase() === normalizedLower)) {
    return normalizedLower;
  }

  return fallback;
}
