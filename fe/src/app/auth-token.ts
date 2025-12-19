export const ACCESS_TOKEN_KEY = "beelms_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const current = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (current) return current;

    return null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {}
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}
