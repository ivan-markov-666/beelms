"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { clearAccessToken, getAccessToken } from "../../../auth-token";
import { buildApiUrl } from "../../../api-url";
import { RecaptchaWidget } from "../../../_components/recaptcha-widget";
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
import { usePublicSettings } from "../../../_hooks/use-public-settings";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
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

const SOCIAL_ERROR_KEYS_REGISTER: Record<
  SocialProvider,
  Record<SocialOAuthAuthorizeErrorCode, string>
> = {
  google: {
    disabled: "registerGoogleDisabled",
    unavailable: "registerGoogleUnavailable",
    generic: "registerGoogleError",
  },
  facebook: {
    disabled: "registerFacebookDisabled",
    unavailable: "registerFacebookUnavailable",
    generic: "registerFacebookError",
  },
  github: {
    disabled: "registerGithubDisabled",
    unavailable: "registerGithubUnavailable",
    generic: "registerGithubError",
  },
  linkedin: {
    disabled: "registerLinkedinDisabled",
    unavailable: "registerLinkedinUnavailable",
    generic: "registerLinkedinError",
  },
};

export function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();
  const { settings: publicSettings } = usePublicSettings();

  const appendLangToPath = (path: string): string => {
    try {
      const url = new URL(path, "http://localhost");
      url.searchParams.set("lang", lang);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      const [base, query] = path.split("?");
      const params = new URLSearchParams(query ?? "");
      params.set("lang", lang);
      const queryString = params.toString();
      return queryString ? `${base}?${queryString}` : `${base}?lang=${lang}`;
    }
  };

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    getEffectiveTheme(),
  );

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

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

  const registerEnabled = useMemo(() => {
    const features = publicSettings?.features;
    if (!features) return true;
    return features.auth !== false && features.authRegister !== false;
  }, [publicSettings?.features]);

  const registerCaptchaEnabled = useMemo(() => {
    const features = publicSettings?.features;
    if (!features) return false;
    return features.captcha !== false && features.captchaRegister !== false;
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

  const showRegisterSocialUnavailableMessage = useMemo(() => {
    return (
      publicSettings?.branding?.registerSocialUnavailableMessageEnabled !==
      false
    );
  }, [publicSettings?.branding?.registerSocialUnavailableMessageEnabled]);

  const hasAnySocial = enabledSocialProviders.length > 0;
  const anySocialLoading =
    googleLoading || facebookLoading || githubLoading || linkedinLoading;

  const passwordStrength = useMemo(() => {
    if (!password) return null;

    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );

    const criteriaMet = [
      hasLength,
      hasUppercase,
      hasLowercase,
      hasDigit,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (criteriaMet === 5) return "strong";
    if (hasLength && criteriaMet >= 3) return "medium";
    return "weak";
  }, [password]);

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    setFieldErrors((prev) => ({ ...prev, captcha: undefined }));
  }, []);

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
    return SOCIAL_ERROR_KEYS_REGISTER[provider][code];
  };

  const handleSocialRegister = async (provider: SocialProvider) => {
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
              : startLinkedinOAuth;
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
          t(lang, "auth", SOCIAL_ERROR_KEYS_REGISTER[provider].generic),
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

  // Form persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("register-form-data");
      if (saved) {
        const data = JSON.parse(saved);
        setEmail(data.email || "");
        setPassword(data.password || "");
        setConfirmPassword(data.confirmPassword || "");
        setAcceptTerms(data.acceptTerms || false);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const data = { email, password, confirmPassword, acceptTerms };
      localStorage.setItem("register-form-data", JSON.stringify(data));
    } catch {
      // ignore localStorage errors
    }
  }, [email, password, confirmPassword, acceptTerms]);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = t(lang, "auth", "registerErrorEmailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "registerErrorEmailInvalid");
      }
    }

    if (!password) {
      errors.password = t(lang, "auth", "registerErrorPasswordRequired");
    } else if (password.length < 8) {
      errors.password = t(lang, "auth", "registerErrorPasswordTooShort");
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password,
      );

      if (!hasUppercase) {
        errors.password = t(
          lang,
          "auth",
          "registerErrorPasswordMissingUppercase",
        );
      } else if (!hasLowercase) {
        errors.password = t(
          lang,
          "auth",
          "registerErrorPasswordMissingLowercase",
        );
      } else if (!hasDigit) {
        errors.password = t(lang, "auth", "registerErrorPasswordMissingDigit");
      } else if (!hasSpecialChar) {
        errors.password = t(
          lang,
          "auth",
          "registerErrorPasswordMissingSpecialChar",
        );
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = t(
        lang,
        "auth",
        "registerErrorConfirmPasswordRequired",
      );
    } else if (confirmPassword !== password) {
      errors.confirmPassword = t(
        lang,
        "auth",
        "registerErrorPasswordsMismatch",
      );
    }

    if (!acceptTerms) {
      errors.terms = t(lang, "auth", "registerErrorTermsRequired");
    }

    if (recaptchaSiteKey && registerCaptchaEnabled && !captchaToken) {
      errors.captcha = t(lang, "auth", "registerErrorCaptchaRequired");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(buildApiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          captchaToken:
            recaptchaSiteKey && registerCaptchaEnabled
              ? (captchaToken ?? undefined)
              : undefined,
          acceptTerms,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setFormError(t(lang, "auth", "registerErrorDuplicateEmail"));
        } else if (res.status === 400) {
          setFormError(t(lang, "auth", "registerErrorInvalidData"));
        } else {
          setFormError(t(lang, "auth", "registerErrorGeneric"));
        }
      } else {
        setFormSuccess(t(lang, "auth", "registerSuccess"));
        // Clear form on success
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAcceptTerms(false);
        setCaptchaToken(null);
        setTimeout(() => {
          router.push(appendLangToPath("/auth/login"));
        }, 13000);
      }
    } catch {
      setFormError(t(lang, "auth", "registerErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            {t(lang, "auth", "registerLoading")}
          </p>
        </main>
      </div>
    );
  }

  if (!registerEnabled) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
        <main className="w-full max-w-md">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t(lang, "auth", "registerDisabledTitle")}
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            {t(lang, "auth", "registerDisabledMessage")}
          </p>

          <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <button
              type="button"
              className="w-full rounded-lg border py-3 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1"
              style={{
                backgroundColor: "var(--primary)",
                borderColor: "var(--primary)",
                color: "var(--on-primary)",
              }}
              onClick={() => router.push(appendLangToPath("/auth/login"))}
            >
              {t(lang, "auth", "registerDisabledLoginCta")}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
      <main className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {t(lang, "auth", "registerTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "registerSubtitle")}
        </p>

        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {hasAnySocial ? (
            <>
              <div className="space-y-3">
                {socialFlags.google && (
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("google")}
                    disabled={submitting || anySocialLoading}
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon
                      provider="google"
                      iconUrl={socialIconUrls.google}
                    />
                    {googleLoading
                      ? t(lang, "auth", "registerGoogleLoading")
                      : t(lang, "auth", "registerGoogleCta")}
                  </button>
                )}
                {socialFlags.facebook && (
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("facebook")}
                    disabled={submitting || anySocialLoading}
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon
                      provider="facebook"
                      iconUrl={socialIconUrls.facebook}
                    />
                    {facebookLoading
                      ? t(lang, "auth", "registerFacebookLoading")
                      : t(lang, "auth", "registerFacebookCta")}
                  </button>
                )}
                {socialFlags.github && (
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("github")}
                    disabled={submitting || anySocialLoading}
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon
                      provider="github"
                      iconUrl={socialIconUrls.github}
                    />
                    {githubLoading
                      ? t(lang, "auth", "registerGithubLoading")
                      : t(lang, "auth", "registerGithubCta")}
                  </button>
                )}
                {socialFlags.linkedin && (
                  <button
                    type="button"
                    onClick={() => handleSocialRegister("linkedin")}
                    disabled={submitting || anySocialLoading}
                    className="be-social-button inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1 focus:ring-offset-[color:var(--card)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <SocialIcon
                      provider="linkedin"
                      iconUrl={socialIconUrls.linkedin}
                    />
                    {linkedinLoading
                      ? t(lang, "auth", "registerLinkedinLoading")
                      : t(lang, "auth", "registerLinkedinCta")}
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
                <span>{t(lang, "auth", "registerSocialDivider")}</span>
                <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
              </div>
            </>
          ) : showRegisterSocialUnavailableMessage ? (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
              {t(lang, "auth", "registerSocialUnavailable")}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "registerEmailLabel")}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t(lang, "auth", "registerEmailPlaceholder")}
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
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={Boolean(fieldErrors.email)}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "registerPasswordLabel")}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t(lang, "auth", "registerPasswordPlaceholder")}
                  className={`block w-full rounded-lg border px-4 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-1 ${
                    fieldErrors.password
                      ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                      : "border-gray-300 bg-white focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }}
                  onCopy={(e) => e.preventDefault()}
                  maxLength={100}
                  aria-describedby={
                    fieldErrors.password ? "password-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.password)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? t(lang, "common", "hidePassword")
                      : t(lang, "common", "showPassword")
                  }
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3l18 18"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t(lang, "auth", "registerPasswordHint")}
              </p>
              {passwordStrength && (
                <p
                  className={`mt-1 text-xs ${
                    passwordStrength === "strong"
                      ? "text-[color:var(--primary)]"
                      : passwordStrength === "medium"
                        ? "text-[color:var(--attention)]"
                        : "text-[color:var(--error)]"
                  }`}
                >
                  {passwordStrength === "strong"
                    ? t(lang, "auth", "registerPasswordStrengthStrong")
                    : passwordStrength === "medium"
                      ? t(lang, "auth", "registerPasswordStrengthMedium")
                      : t(lang, "auth", "registerPasswordStrengthWeak")}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "registerConfirmPasswordLabel")}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t(lang, "auth", "registerPasswordPlaceholder")}
                  className={`block w-full rounded-lg border px-4 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-1 ${
                    fieldErrors.confirmPassword
                      ? "border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] focus:border-[color:var(--error)] focus:ring-[color:var(--error)]"
                      : "border-gray-300 bg-white focus:border-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form && typeof form.requestSubmit === "function") {
                      form.requestSubmit();
                      return;
                    }
                    form?.dispatchEvent(
                      new Event("submit", { bubbles: true, cancelable: true }),
                    );
                  }}
                  onCopy={(e) => e.preventDefault()}
                  maxLength={100}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={submitting}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? t(lang, "common", "hidePassword")
                      : t(lang, "common", "showPassword")
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3l18 18"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div
              className={`flex items-start gap-2 ${
                fieldErrors.terms
                  ? "rounded-md border border-[color:var(--field-error-border)] bg-[color:var(--field-error-bg)] p-2"
                  : ""
              }`}
            >
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300"
                style={{ accentColor: "var(--primary)" }}
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.terms)}
                aria-describedby={fieldErrors.terms ? "terms-error" : undefined}
                disabled={submitting}
              />
              <label htmlFor="terms" className="text-xs text-gray-700">
                {t(lang, "auth", "registerTermsPrefix")}
                <button
                  type="button"
                  className="cursor-pointer text-[color:var(--primary)] underline-offset-2 hover:underline"
                  onClick={() => router.push(appendLangToPath("/legal/terms"))}
                  disabled={submitting}
                >
                  {t(lang, "common", "legalFooterTermsLink")}
                </button>
                {t(lang, "auth", "registerTermsAnd")}
                <button
                  type="button"
                  className="cursor-pointer text-[color:var(--primary)] underline-offset-2 hover:underline"
                  onClick={() =>
                    router.push(appendLangToPath("/legal/privacy"))
                  }
                  disabled={submitting}
                >
                  {t(lang, "common", "legalFooterPrivacyLink")}
                </button>
                {t(lang, "auth", "registerTermsSuffix")}
              </label>
            </div>
            {fieldErrors.terms && (
              <p id="terms-error" className="text-xs text-red-600">
                {fieldErrors.terms}
              </p>
            )}

            {registerCaptchaEnabled && recaptchaSiteKey ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  {t(lang, "auth", "registerCaptchaLabel")}
                </p>
                <RecaptchaWidget
                  siteKey={recaptchaSiteKey}
                  lang={lang}
                  disabled={submitting}
                  onTokenChange={handleCaptchaTokenChange}
                />
                {fieldErrors.captcha && (
                  <p className="text-xs text-red-600">{fieldErrors.captcha}</p>
                )}
              </div>
            ) : process.env.NODE_ENV !== "production" &&
              registerCaptchaEnabled ? (
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                {t(lang, "auth", "registerCaptchaPlaceholder")}
              </div>
            ) : null}

            {/* Honeypot field for bot detection */}
            <input
              type="text"
              name="honeypot"
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
              value=""
              readOnly
            />

            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-sm text-[color:var(--primary)]" role="status">
                {formSuccess}
              </p>
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
                ? t(lang, "auth", "registerSubmitLoading")
                : t(lang, "auth", "registerSubmit")}
            </button>
          </form>
        </section>

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            {t(lang, "auth", "registerHasAccount")}{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-[color:var(--primary)] hover:opacity-90"
              onClick={() => router.push(appendLangToPath("/auth/login"))}
              disabled={submitting}
            >
              {t(lang, "auth", "registerLoginLink")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
