"use client";

import { buildApiUrl } from "../api-url";

export const DEFAULT_SOCIAL_REDIRECT = "/wiki";

export type SocialProvider = "google" | "facebook" | "github" | "linkedin";

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

export type SocialOAuthAuthorizeErrorCode =
  | "disabled"
  | "unavailable"
  | "generic";

export class SocialOAuthAuthorizeError extends Error {
  provider: SocialProvider;
  code: SocialOAuthAuthorizeErrorCode;

  constructor(
    provider: SocialProvider,
    code: SocialOAuthAuthorizeErrorCode,
    message?: string,
  ) {
    super(message ?? `${provider} OAuth authorize request failed`);
    this.name = "SocialOAuthAuthorizeError";
    this.provider = provider;
    this.code = code;
  }
}

export function isSocialOAuthAuthorizeError(
  error: unknown,
): error is SocialOAuthAuthorizeError {
  if (error instanceof SocialOAuthAuthorizeError) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "provider" in error &&
    "code" in error &&
    "name" in error
  ) {
    const maybeError = error as Record<string, unknown>;
    return maybeError.name === "SocialOAuthAuthorizeError";
  }

  return false;
}

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
    throw await buildAuthorizeError(options.provider, res);
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

async function buildAuthorizeError(
  provider: SocialProvider,
  response: Response,
): Promise<SocialOAuthAuthorizeError> {
  let code: SocialOAuthAuthorizeErrorCode = "generic";
  let message: string | undefined;

  const bodyText = await response.text();
  if (bodyText) {
    message = extractMessageFromBody(bodyText);
  }

  if (response.status === 503) {
    const normalizedMessage = message?.toLowerCase() ?? "";
    code = normalizedMessage.includes("disabled") ? "disabled" : "unavailable";
  }

  return new SocialOAuthAuthorizeError(provider, code, message);
}

function extractMessageFromBody(bodyText: string): string | undefined {
  try {
    const parsed = JSON.parse(bodyText);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      return typeof first === "string" ? first : bodyText;
    }
    if (typeof parsed === "object" && parsed !== null) {
      const value = (parsed as Record<string, unknown>).message;
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === "string") {
          return first;
        }
      }
    }
  } catch {
    // Ignore JSON parse errors; fall back to raw text
  }

  return bodyText || undefined;
}
