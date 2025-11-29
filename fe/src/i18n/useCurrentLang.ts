"use client";

import { useSearchParams } from "next/navigation";
import { normalizeLang, type SupportedLang } from "./config";

export function useCurrentLang(): SupportedLang {
  const searchParams = useSearchParams();
  return normalizeLang(searchParams.get("lang"));
}
