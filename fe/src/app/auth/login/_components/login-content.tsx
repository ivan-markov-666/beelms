"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { startGoogleOAuth } from "../../social-login";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type FieldErrors = {
  email?: string;
  password?: string;
  captcha?: string;
};

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();

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

  const handleGoogleLogin = async () => {
    if (googleLoading) return;

    setSocialError(null);
    setGoogleLoading(true);

    try {
      await startGoogleOAuth({
        redirectPath: searchParams.get("redirect"),
      });
    } catch (error) {
      console.error("Google OAuth authorize failed", error);
      setSocialError(t(lang, "auth", "loginGoogleError"));
      setGoogleLoading(false);
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
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting || googleLoading}
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
