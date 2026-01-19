"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../../api-url";

const API_BASE_URL = getApiBaseUrl();

const LANG_CODE_REGEX = /^[a-z]{2,5}$/i;

type PublicSettingsLanguages = {
  supported?: string[] | null;
  default?: string | null;
};

type PublicSettingsResponse = {
  languages?: PublicSettingsLanguages | null;
};

function normalizeSupportedLanguages(value?: string[] | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();

  for (const raw of value) {
    const normalized = (raw ?? "").trim().toLowerCase();
    if (!normalized || !LANG_CODE_REGEX.test(normalized)) {
      continue;
    }
    unique.add(normalized);
  }

  return Array.from(unique);
}

function normalizeDefaultLang(
  raw: string | null | undefined,
  supported: string[],
): string {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (
    normalized &&
    LANG_CODE_REGEX.test(normalized) &&
    supported.includes(normalized)
  ) {
    return normalized;
  }
  return supported[0] ?? "bg";
}

export function useAdminSupportedLanguages(): {
  languages: string[];
  defaultLanguage: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [languages, setLanguages] = useState<string[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState<string>("bg");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/public/settings`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`failed-${res.status}`);
      }

      const data = (await res.json()) as PublicSettingsResponse;
      const supported = normalizeSupportedLanguages(
        data.languages?.supported ?? [],
      );
      const normalizedSupported = supported.length > 0 ? supported : ["bg"];
      setLanguages(normalizedSupported);
      setDefaultLanguage(
        normalizeDefaultLang(data.languages?.default, normalizedSupported),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load languages");
      setLanguages((prev) => (prev.length > 0 ? prev : ["bg"]));
      setDefaultLanguage((prev) => prev || "bg");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLanguages();
  }, [fetchLanguages, refreshIndex]);

  const stableLanguages = useMemo(() => {
    if (!languages.length) {
      return ["bg"];
    }
    return languages;
  }, [languages]);

  return {
    languages: stableLanguages,
    defaultLanguage,
    loading,
    error,
    refetch: () => setRefreshIndex((prev) => prev + 1),
  };
}
