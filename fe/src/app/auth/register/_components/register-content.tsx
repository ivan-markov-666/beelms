'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { clearAccessToken, getAccessToken } from "../../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export function RegisterContent() {
  const router = useRouter();
  const lang = useCurrentLang();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;

    const checkSession = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
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
      errors.email = t(lang, "auth", "registerErrorEmailRequired");
    } else {
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "registerErrorEmailInvalid");
      }
    }

    if (!password) {
      errors.password = t(lang, "auth", "registerErrorPasswordRequired");
    } else if (password.length < 8) {
      errors.password = t(lang, "auth", "registerErrorPasswordTooShort");
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
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
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
                {t(lang, "auth", "registerPasswordLabel")} 
                <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t(lang, "auth", "registerPasswordHint")}
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "registerConfirmPasswordLabel")} 
                <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-600">
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
                onChange={(e) => setAcceptTerms(e.target.checked)}
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

            <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              {t(lang, "auth", "registerCaptchaPlaceholder")}
            </div>

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
            {t(lang, "auth", "registerHasAccount")} {" "}
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
