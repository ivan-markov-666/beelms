"use client";

import { useSearchParams } from "next/navigation";
import { normalizeLang, type SupportedLang } from "./config";

const COOKIE_NAME = "ui_lang";

function readLangFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAME}=`));

    if (!match) return null;

    const value = match.substring(COOKIE_NAME.length + 1);
    return decodeURIComponent(value || "").trim() || null;
  } catch {
    return null;
  }
}

export function useCurrentLang(): SupportedLang {
  const searchParams = useSearchParams();
  const langFromUrl = searchParams.get("lang");

  if (langFromUrl) {
    return normalizeLang(langFromUrl);
  }

  const cookieLang = readLangFromCookie();
  if (cookieLang) {
    return normalizeLang(cookieLang);
  }

  return normalizeLang(null);
}
