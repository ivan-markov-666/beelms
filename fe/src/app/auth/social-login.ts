"use client";

import { buildApiUrl } from "../api-url";

type SocialAuthorizeResponse = {
  url: string;
};

export const DEFAULT_SOCIAL_REDIRECT = "/wiki";

export function normalizeSocialRedirectPath(
  input?: string | null,
): string | undefined {
  if (!input) {
    return undefined;
  }

  if (input.startsWith("/")) {
    return input;
  }

  return undefined;
}

export async function startGoogleOAuth(options?: {
  redirectPath?: string | null;
}): Promise<void> {
  const redirectPath =
    normalizeSocialRedirectPath(options?.redirectPath) ??
    DEFAULT_SOCIAL_REDIRECT;

  const params = new URLSearchParams();
  if (redirectPath) {
    params.set("redirectPath", redirectPath);
  }

  const res = await fetch(
    `${buildApiUrl("/auth/google/authorize")}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error("Google OAuth authorize request failed");
  }

  const data = (await res.json()) as Partial<SocialAuthorizeResponse>;

  if (!data?.url) {
    throw new Error("Google OAuth authorize response missing url");
  }

  window.location.assign(data.url);
}
