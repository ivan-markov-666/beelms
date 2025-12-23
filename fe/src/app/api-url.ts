const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function normalizeBaseUrl(base: string): string {
  const trimmed = base.trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/api")) {
    return withoutTrailingSlash;
  }
  return `${withoutTrailingSlash}/api`;
}

export function getApiBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envBase || envBase.trim().length === 0) {
    return DEFAULT_API_BASE_URL;
  }
  return normalizeBaseUrl(envBase);
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
