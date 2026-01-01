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
} from "../../social-login";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  captcha?: string;
};

export function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();

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
  const [socialError, setSocialError] = useState<string | null>(null);

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

  const handleSocialRegister = async (
    provider: "google" | "facebook" | "github",
  ) => {
    const isGoogle = provider === "google";
    const isFacebook = provider === "facebook";
    if (
      (isGoogle && googleLoading) ||
      (isFacebook && facebookLoading) ||
      (!isGoogle && !isFacebook && githubLoading)
    ) {
      return;
    }

    setSocialError(null);
    if (isGoogle) {
      setGoogleLoading(true);
    } else if (isFacebook) {
      setFacebookLoading(true);
    } else {
      setGithubLoading(true);
    }

    try {
      const startFn = isGoogle
        ? startGoogleOAuth
        : isFacebook
          ? startFacebookOAuth
          : startGithubOAuth;
      await startFn({
        redirectPath: searchParams.get("redirect"),
      });
    } catch (error) {
      console.error(`${provider} OAuth authorize failed`, error);
      setSocialError(
        t(
          lang,
          "auth",
          isGoogle
            ? "registerGoogleError"
            : isFacebook
              ? "registerFacebookError"
              : "registerGithubError",
        ),
      );
      setGoogleLoading((prev) => (isGoogle ? false : prev));
      setFacebookLoading((prev) => (isFacebook ? false : prev));
      setGithubLoading((prev) => (!isGoogle && !isFacebook ? false : prev));
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

    if (recaptchaSiteKey && !captchaToken) {
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
          acceptTerms,
          captchaToken: recaptchaSiteKey
            ? (captchaToken ?? undefined)
            : undefined,
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
          router.push("/auth/login");
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
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialRegister("google")}
              disabled={
                submitting || googleLoading || facebookLoading || githubLoading
              }
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
                ? t(lang, "auth", "registerGoogleLoading")
                : t(lang, "auth", "registerGoogleCta")}
            </button>
            <button
              type="button"
              onClick={() => handleSocialRegister("github")}
              disabled={
                submitting || githubLoading || googleLoading || facebookLoading
              }
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
                ? t(lang, "auth", "registerGithubLoading")
                : t(lang, "auth", "registerGithubCta")}
            </button>
            <button
              type="button"
              onClick={() => handleSocialRegister("facebook")}
              disabled={
                submitting || facebookLoading || googleLoading || githubLoading
              }
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
                ? t(lang, "auth", "registerFacebookLoading")
                : t(lang, "auth", "registerFacebookCta")}
            </button>
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
                placeholder="your@email.com"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
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
                  placeholder="********"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
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
                      ? "text-green-600"
                      : passwordStrength === "medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {passwordStrength === "strong"
                    ? "Силна парола"
                    : passwordStrength === "medium"
                      ? "Средна парола"
                      : "Слаба парола"}
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
                  placeholder="********"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
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

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                disabled={submitting}
              />
              <label htmlFor="terms" className="text-xs text-gray-700">
                {t(lang, "auth", "registerTermsPrefix")}
                <button
                  type="button"
                  className="cursor-pointer text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
                  onClick={() => router.push("/legal/terms")}
                  disabled={submitting}
                >
                  {t(lang, "common", "legalFooterTermsLink")}
                </button>
                {t(lang, "auth", "registerTermsAnd")}
                <button
                  type="button"
                  className="cursor-pointer text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline"
                  onClick={() => router.push("/legal/privacy")}
                  disabled={submitting}
                >
                  {t(lang, "common", "legalFooterPrivacyLink")}
                </button>
                {t(lang, "auth", "registerTermsSuffix")}
              </label>
            </div>
            {fieldErrors.terms && (
              <p className="text-xs text-red-600">{fieldErrors.terms}</p>
            )}

            {recaptchaSiteKey ? (
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
            ) : (
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                {t(lang, "auth", "registerCaptchaPlaceholder")}
              </div>
            )}

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
              <p className="text-sm text-green-600" role="status">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
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
              className="cursor-pointer font-semibold text-green-700 hover:text-green-800"
              onClick={() => router.push("/auth/login")}
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
