"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../../../auth-token";
import { buildApiUrl } from "../../../api-url";
import { RecaptchaWidget } from "../../../_components/recaptcha-widget";
import { usePublicSettings } from "../../../_hooks/use-public-settings";
import {
  startFacebookOAuth,
  startGoogleOAuth,
  startGithubOAuth,
  startLinkedinOAuth,
  isSocialOAuthAuthorizeError,
  type SocialProvider,
  type SocialOAuthAuthorizeErrorCode,
} from "../../social-login";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type FieldErrors = {
  email?: string;
  password?: string;
  captcha?: string;
};

const SOCIAL_PROVIDERS: SocialProvider[] = [
  "google",
  "facebook",
  "github",
  "linkedin",
];

const DEFAULT_SOCIAL_FLAGS: Record<SocialProvider, boolean> = {
  google: true,
  facebook: true,
  github: true,
  linkedin: true,
};

const SOCIAL_ERROR_KEYS_LOGIN: Record<
  SocialProvider,
  Record<SocialOAuthAuthorizeErrorCode, string>
> = {
  google: {
    disabled: "loginGoogleDisabled",
    unavailable: "loginGoogleUnavailable",
    generic: "loginGoogleError",
  },
  facebook: {
    disabled: "loginFacebookDisabled",
    unavailable: "loginFacebookUnavailable",
    generic: "loginFacebookError",
  },
  github: {
    disabled: "loginGithubDisabled",
    unavailable: "loginGithubUnavailable",
    generic: "loginGithubError",
  },
  linkedin: {
    disabled: "loginLinkedinDisabled",
    unavailable: "loginLinkedinUnavailable",
    generic: "loginLinkedinError",
  },
};

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();
  const { settings: publicSettings } = usePublicSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const socialFlags = useMemo(() => {
    if (!publicSettings?.features) {
      return DEFAULT_SOCIAL_FLAGS;
    }
    return {
      google: publicSettings.features.socialGoogle !== false,
      facebook: publicSettings.features.socialFacebook !== false,
      github: publicSettings.features.socialGithub !== false,
      linkedin: publicSettings.features.socialLinkedin !== false,
    };
  }, [publicSettings?.features]);

  const enabledSocialProviders = useMemo(
    () => SOCIAL_PROVIDERS.filter((provider) => socialFlags[provider]),
    [socialFlags],
  );

  const hasAnySocial = enabledSocialProviders.length > 0;
  const anySocialLoading =
    googleLoading || facebookLoading || githubLoading || linkedinLoading;

  const setProviderLoading = (provider: SocialProvider, value: boolean) => {
    switch (provider) {
      case "google":
        setGoogleLoading(value);
        break;
      case "facebook":
        setFacebookLoading(value);
        break;
      case "github":
        setGithubLoading(value);
        break;
      case "linkedin":
        setLinkedinLoading(value);
        break;
    }
  };

  const isProviderLoading = (provider: SocialProvider): boolean => {
    switch (provider) {
      case "google":
        return googleLoading;
      case "facebook":
        return facebookLoading;
      case "github":
        return githubLoading;
      case "linkedin":
        return linkedinLoading;
      default:
        return false;
    }
  };

  const resolveSocialErrorKey = (
    provider: SocialProvider,
    code: SocialOAuthAuthorizeErrorCode,
  ): string => {
    return SOCIAL_ERROR_KEYS_LOGIN[provider][code];
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (isProviderLoading(provider)) {
      return;
    }

    setSocialError(null);
    setProviderLoading(provider, true);

    try {
      const startFn =
        provider === "google"
          ? startGoogleOAuth
          : provider === "facebook"
            ? startFacebookOAuth
            : provider === "github"
              ? startGithubOAuth
              : provider === "linkedin"
                ? startLinkedinOAuth
                : null;
      if (!startFn) {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      await startFn({
        redirectPath: searchParams.get("redirect"),
      });
    } catch (error) {
      console.error(`${provider} OAuth authorize failed`, error);
      if (isSocialOAuthAuthorizeError(error)) {
        const key = resolveSocialErrorKey(provider, error.code);
        setSocialError(t(lang, "auth", key));
      } else {
        setSocialError(
          t(lang, "auth", SOCIAL_ERROR_KEYS_LOGIN[provider].generic),
        );
      }
    } finally {
      setProviderLoading(provider, false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;

    const checkSession = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }

        const res = await fetch(buildApiUrl("/users/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isCancelled && res.ok) {
          router.replace("/");
          return;
        }

        if (!res.ok && (res.status === 401 || res.status === 404)) {
          try {
            clearAccessToken();
          } catch {
            // ignore localStorage errors
          }
        }
      } catch {
        // ignore network / parsing errors
      } finally {
        if (!isCancelled) {
          setCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = t(lang, "auth", "loginErrorEmailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "loginErrorEmailInvalid");
      }
    }

    if (!password) {
      errors.password = t(lang, "auth", "loginErrorPasswordRequired");
    }

    if (captchaRequired && RECAPTCHA_SITE_KEY && !captchaToken) {
      errors.captcha = t(lang, "auth", "loginErrorCaptchaRequired");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          captchaToken:
            captchaRequired && RECAPTCHA_SITE_KEY
              ? (captchaToken ?? undefined)
              : undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          try {
            const data = (await res.json()) as { message?: unknown };
            const msg =
              typeof data?.message === "string"
                ? data.message
                : Array.isArray(data?.message)
                  ? String(data.message[0] ?? "")
                  : "";

            if (msg.includes("captcha verification required")) {
              setCaptchaRequired(true);
              setFormError(t(lang, "auth", "loginErrorCaptchaRequired"));
              return;
            }
          } catch {
            // ignore
          }

          setFormError(t(lang, "auth", "loginErrorGeneric"));
        } else if (res.status === 401) {
          setFormError(t(lang, "auth", "loginErrorInvalidCredentials"));
        } else {
          setFormError(t(lang, "auth", "loginErrorGeneric"));
        }
      } else {
        const data = (await res.json()) as {
          accessToken?: string;
          tokenType?: string;
        };

        if (data?.accessToken) {
          try {
            setAccessToken(data.accessToken);
          } catch {
            // ignore localStorage errors
          }
        }

        router.push("/wiki");
      }
    } catch {
      setFormError(t(lang, "auth", "loginErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            {t(lang, "auth", "loginLoading")}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {t(lang, "auth", "loginTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "loginSubtitle")}
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {hasAnySocial ? (
            <>
              <div className="space-y-3">
                {socialFlags.google && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("google")}
                    disabled={submitting || anySocialLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#EA4335"
                        d="M12 5.09c1.26 0 2.39.43 3.29 1.28l2.45-2.45C16.25 2.36 14.31 1.64 12 1.64 7.9 1.64 4.34 4.06 2.68 7.64l2.85 2.21C6.37 7.41 8.98 5.09 12 5.09z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M21.81 12.19c0-.74-.07-1.45-.19-2.14H12v4.05h5.54c-.24 1.3-.96 2.4-2.06 3.15l3.22 2.5c1.88-1.73 3.11-4.28 3.11-7.56z"
                      />
                      <path
                        fill="#4285F4"
                        d="M12 22.36c2.85 0 5.24-.94 6.99-2.61l-3.22-2.5c-.89.6-2.02.95-3.77.95-2.94 0-5.44-1.98-6.33-4.64l-2.9 2.24C4.4 20.17 7.92 22.36 12 22.36z"
                      />
                      <path
                        fill="#34A853"
                        d="M5.67 13.56c-.2-.6-.31-1.25-.31-1.92s.11-1.32.3-1.92L2.81 7.5C2.3 8.67 2 9.94 2 11.36s.3 2.69.81 3.86l2.86-1.66z"
                      />
                      <path fill="none" d="M2 2h20v20H2z" />
                    </svg>
                    {googleLoading
                      ? t(lang, "auth", "loginGoogleLoading")
                      : t(lang, "auth", "loginGoogleCta")}
                  </button>
                )}
                {socialFlags.facebook && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={submitting || anySocialLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#1877F2"
                        d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.034 4.388 11.045 10.125 11.875V15.563H7.078v-3.49h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.313 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.93-1.953 1.887v2.259h3.328l-.532 3.49h-2.796v8.385C19.612 23.118 24 18.107 24 12.073z"
                      />
                    </svg>
                    {facebookLoading
                      ? t(lang, "auth", "loginFacebookLoading")
                      : t(lang, "auth", "loginFacebookCta")}
                  </button>
                )}
                {socialFlags.github && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("github")}
                    disabled={submitting || anySocialLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#181717"
                        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.003 0c2.292-1.552 3.298-1.23 3.298-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.804 5.625-5.476 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .321.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                      />
                    </svg>
                    {githubLoading
                      ? t(lang, "auth", "loginGithubLoading")
                      : t(lang, "auth", "loginGithubCta")}
                  </button>
                )}
                {socialFlags.linkedin && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("linkedin")}
                    disabled={submitting || anySocialLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#0A66C2"
                        d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.086V9h3.104v1.561h.044c.433-.82 1.494-1.688 3.072-1.688 3.287 0 3.894 2.164 3.894 4.977v6.602zM5.337 7.433a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM6.907 20.452H3.672V9h3.235v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729V22.27C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                      />
                    </svg>
                    {linkedinLoading
                      ? t(lang, "auth", "loginLinkedinLoading")
                      : t(lang, "auth", "loginLinkedinCta")}
                  </button>
                )}
                {socialError && (
                  <p className="text-xs text-red-600" role="alert">
                    {socialError}
                  </p>
                )}
              </div>
              <div className="my-6 flex items-center gap-3 text-xs text-gray-500">
                <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
                <span>{t(lang, "auth", "loginSocialDivider")}</span>
                <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
              </div>
            </>
          ) : (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
              {t(lang, "auth", "loginSocialUnavailable")}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "loginEmailLabel")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "loginPasswordLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="********"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="remember" className="ml-2 text-xs text-gray-700">
                {t(lang, "auth", "loginRememberMeLabel")}
              </label>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              {t(lang, "auth", "loginCaptchaPlaceholder")}
            </div>

            {captchaRequired && RECAPTCHA_SITE_KEY && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  {t(lang, "auth", "loginCaptchaLabel")}
                </p>
                <RecaptchaWidget
                  siteKey={RECAPTCHA_SITE_KEY}
                  lang={lang}
                  disabled={submitting}
                  onTokenChange={setCaptchaToken}
                />
                {fieldErrors.captcha && (
                  <p className="text-xs text-red-600">{fieldErrors.captcha}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
            >
              {submitting
                ? t(lang, "auth", "loginSubmitLoading")
                : t(lang, "auth", "loginSubmit")}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3 text-center text-xs text-gray-600">
          <button
            type="button"
            className="cursor-pointer text-green-700 hover:text-green-800"
            onClick={() => router.push("/auth/forgot-password")}
            disabled={submitting}
          >
            {t(lang, "auth", "loginForgotLink")}
          </button>
          <p>
            {t(lang, "auth", "loginRegisterLink")}{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-green-700 hover:text-green-800"
              onClick={() => router.push("/auth/register")}
              disabled={submitting}
            >
              {t(lang, "auth", "registerSubmit")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
