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
import { SocialIcon } from "../../_components/social-icon";

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

type EffectiveTheme = "light" | "dark";

function getEffectiveTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

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

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    getEffectiveTheme(),
  );

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

  const authRegisterEnabled = useMemo(() => {
    const features = publicSettings?.features;
    if (!features) return true;
    return features.auth !== false && features.authRegister !== false;
  }, [publicSettings?.features]);

  const loginCaptchaEnabled = useMemo(() => {
    const features = publicSettings?.features;
    if (!features) return false;
    return features.captcha !== false && features.captchaLogin !== false;
  }, [publicSettings?.features]);

  const enabledSocialProviders = useMemo(
    () => SOCIAL_PROVIDERS.filter((provider) => socialFlags[provider]),
    [socialFlags],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setEffectiveTheme(getEffectiveTheme());
    };

    update();

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
    }

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", update);
      }
    };
  }, []);

  const socialIconUrls = useMemo(() => {
    const icons = publicSettings?.branding?.socialLoginIcons;
    const pick = (provider: SocialProvider): string | null => {
      const config = icons?.[provider] ?? null;
      const primary =
        effectiveTheme === "dark"
          ? (config?.darkUrl ?? null)
          : (config?.lightUrl ?? null);
      const fallback =
        effectiveTheme === "dark"
          ? (config?.lightUrl ?? null)
          : (config?.darkUrl ?? null);
      const url = String(primary ?? fallback ?? "").trim();
      return url.length > 0 ? url : null;
    };

    return {
      google: pick("google"),
      facebook: pick("facebook"),
      github: pick("github"),
      linkedin: pick("linkedin"),
    };
  }, [effectiveTheme, publicSettings?.branding?.socialLoginIcons]);

  const showSocialUnavailableMessage = useMemo(() => {
    return (
      publicSettings?.branding?.loginSocialUnavailableMessageEnabled !== false
    );
  }, [publicSettings?.branding?.loginSocialUnavailableMessageEnabled]);

  const showSocialResetHintMessage = useMemo(() => {
    return (
      publicSettings?.branding?.loginSocialResetPasswordHintEnabled !== false
    );
  }, [publicSettings?.branding?.loginSocialResetPasswordHintEnabled]);

  const hasAnySocial = enabledSocialProviders.length > 0;
  const showSocialResetHint = useMemo(
    () => !hasAnySocial || Boolean(socialError),
    [hasAnySocial, socialError],
  );
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

    if (
      captchaRequired &&
      loginCaptchaEnabled &&
      RECAPTCHA_SITE_KEY &&
      !captchaToken
    ) {
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
            captchaRequired && loginCaptchaEnabled && RECAPTCHA_SITE_KEY
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
              if (loginCaptchaEnabled && RECAPTCHA_SITE_KEY) {
                setCaptchaRequired(true);
                setFormError(t(lang, "auth", "loginErrorCaptchaRequired"));
              } else {
                setCaptchaRequired(false);
                setFormError(t(lang, "auth", "loginCaptchaNotAvailable"));
              }
              return;
            }
          } catch {
            // ignore
          }

          setFormError(t(lang, "auth", "loginErrorGeneric"));
        } else if (res.status === 401) {
          setFormError(t(lang, "auth", "loginErrorInvalidCredentials"));
        } else if (res.status === 403) {
          setFormError(t(lang, "auth", "loginErrorDisabled"));
        } else {
          setFormError(t(lang, "auth", "loginErrorGeneric"));
        }
      } else {
        const data = (await res.json()) as {
          accessToken?: string;
          tokenType?: string;
          twoFactorRequired?: boolean;
          challengeToken?: string;
        };

        if (data?.twoFactorRequired && data?.challengeToken) {
          const nextRedirect = searchParams.get("redirect") ?? undefined;
          const params = new URLSearchParams();
          params.set("challenge", data.challengeToken);
          if (nextRedirect) {
            params.set("redirect", nextRedirect);
          }
          router.push(`/auth/2fa?${params.toString()}`);
          return;
        }

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
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon provider="google" iconUrl={socialIconUrls.google} />
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
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon provider="facebook" iconUrl={socialIconUrls.facebook} />
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
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon provider="github" iconUrl={socialIconUrls.github} />
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
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon provider="linkedin" iconUrl={socialIconUrls.linkedin} />
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
          ) : showSocialUnavailableMessage ? (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
              {t(lang, "auth", "loginSocialUnavailable")}
            </div>
          ) : null}
          {showSocialResetHint && showSocialResetHintMessage && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
              <p>{t(lang, "auth", "socialResetPasswordHint")}</p>
              <button
                type="button"
                className="mt-2 inline-flex cursor-pointer items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
                onClick={() => router.push("/auth/forgot-password")}
                disabled={submitting}
              >
                <span aria-hidden="true">↗</span>
                <span>{t(lang, "auth", "loginForgotLink")}</span>
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "loginEmailLabel")} {" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className={`block w-full rounded-lg border px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.email
                    ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                    : "border-gray-300 bg-white focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "login-email-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.email && (
                <p id="login-email-error" className="text-xs text-red-600">
                  {fieldErrors.email}
                </p>
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
                  className={`block w-full rounded-lg border px-4 py-2 pr-12 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-1 ${
                    fieldErrors.password
                      ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                      : "border-gray-300 bg-white focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "login-password-error" : undefined
                  }
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
                <p id="login-password-error" className="text-xs text-red-600">
                  {fieldErrors.password}
                </p>
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
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: "var(--primary)" }}
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="remember" className="ml-2 text-xs text-gray-700">
                {t(lang, "auth", "loginRememberMeLabel")}
              </label>
            </div>

            {process.env.NODE_ENV !== "production" && loginCaptchaEnabled ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                {t(lang, "auth", "loginCaptchaPlaceholder")}
              </div>
            ) : null}

            {captchaRequired && loginCaptchaEnabled && RECAPTCHA_SITE_KEY && (
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
              className="w-full rounded-lg border py-3 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: "var(--primary)",
                borderColor: "var(--primary)",
                color: "var(--on-primary)",
              }}
              disabled={submitting}
            >
              {submitting
                ? t(lang, "auth", "loginSubmitLoading")
                : t(lang, "auth", "loginSubmit")}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-[color:var(--primary)]">
          {authRegisterEnabled ? (
            <button
              type="button"
              className="cursor-pointer hover:opacity-90"
              onClick={() => router.push("/auth/forgot-password")}
              disabled={submitting}
            >
              {t(lang, "auth", "loginForgotLink")}
            </button>
          ) : (
            <span />
          )}

          {authRegisterEnabled ? (
            <p>
              {t(lang, "auth", "loginRegisterLink")}{" "}
              <button
                type="button"
                className="cursor-pointer font-semibold text-[color:var(--primary)] hover:opacity-90"
                onClick={() => router.push("/auth/register")}
                disabled={submitting}
              >
                {t(lang, "auth", "loginRegisterLinkCta")}
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
