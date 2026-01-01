"use client";

import { buildApiUrl } from "../api-url";

export const DEFAULT_SOCIAL_REDIRECT = "/wiki";

type SocialProvider = "google" | "facebook" | "github" | "linkedin";

const AUTHORIZE_ENDPOINT: Record<SocialProvider, string> = {
  google: "/auth/google/authorize",
  facebook: "/auth/facebook/authorize",
  github: "/auth/github/authorize",
  linkedin: "/auth/linkedin/authorize",
};

type SocialAuthorizeResponse = {
  url: string;
};

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

type StartSocialOAuthOptions = {
  provider: SocialProvider;
  redirectPath?: string | null;
};

export async function startSocialOAuth(
  options: StartSocialOAuthOptions,
): Promise<void> {
  const redirectPath =
    normalizeSocialRedirectPath(options.redirectPath) ??
    DEFAULT_SOCIAL_REDIRECT;

  const params = new URLSearchParams();
  if (redirectPath) {
    params.set("redirectPath", redirectPath);
  }

  const res = await fetch(
    `${buildApiUrl(AUTHORIZE_ENDPOINT[options.provider])}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`${options.provider} OAuth authorize request failed`);
  }

  const data = (await res.json()) as Partial<SocialAuthorizeResponse>;

  if (!data?.url) {
    throw new Error(`${options.provider} OAuth authorize response missing url`);
  }

  window.location.assign(data.url);
}

export function startGoogleOAuth(options?: {
  redirectPath?: string | null;
}): Promise<void> {
  return startSocialOAuth({
    provider: "google",
    redirectPath: options?.redirectPath,
  });
}

export function startFacebookOAuth(options?: {
  redirectPath?: string | null;
}): Promise<void> {
  return startSocialOAuth({
    provider: "facebook",
    redirectPath: options?.redirectPath,
  });
}

export function startGithubOAuth(options?: {
  redirectPath?: string | null;
}): Promise<void> {
  return startSocialOAuth({
    provider: "github",
    redirectPath: options?.redirectPath,
  });
}

export function startLinkedinOAuth(options?: {
  redirectPath?: string | null;
}): Promise<void> {
  return startSocialOAuth({
    provider: "linkedin",
    redirectPath: options?.redirectPath,
  });
}
