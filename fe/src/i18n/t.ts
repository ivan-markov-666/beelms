import { DEFAULT_LANG, type SupportedLang } from "./config";
import { messages, type Messages } from "./messages";

export function t(
  lang: SupportedLang,
  domain: "nav" | "common",
  key: string,
  dicts: Messages = messages,
): string {
  const dict = dicts[lang]?.[domain] as Record<string, string> | undefined;
  const fallbackDict = dicts[DEFAULT_LANG]?.[domain] as
    | Record<string, string>
    | undefined;

  if (dict && key in dict) {
    return dict[key];
  }

  if (fallbackDict && key in fallbackDict) {
    return fallbackDict[key];
  }

  return key;
}
