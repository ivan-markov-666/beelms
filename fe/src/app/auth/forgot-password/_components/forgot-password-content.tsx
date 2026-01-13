"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { buildApiUrl } from "../../../api-url";
import { RecaptchaWidget } from "../../../_components/recaptcha-widget";
import { usePublicSettings } from "../../../_hooks/use-public-settings";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type FieldErrors = {
  email?: string;
  captcha?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.034 4.388 11.045 10.125 11.875V15.563H7.078v-3.49h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.313 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.93-1.953 1.887v2.259h3.328l-.532 3.49h-2.796v8.385C19.612 23.118 24 18.107 24 12.073z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#181717"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.003 0c2.292-1.552 3.298-1.23 3.298-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.804 5.625-5.476 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .321.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#0A66C2"
        d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.086V9h3.104v1.561h.044c.433-.82 1.494-1.688 3.072-1.688 3.287 0 3.894 2.164 3.894 4.977v6.602zM5.337 7.433a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM6.907 20.452H3.672V9h3.235v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729V22.27C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export function ForgotPasswordContent() {
  const router = useRouter();
  const lang = useCurrentLang();
  const { settings: publicSettings } = usePublicSettings();

  const registerEnabled = publicSettings?.features
    ? publicSettings.features.auth !== false &&
      publicSettings.features.authRegister !== false
    : true;

  const forgotCaptchaEnabled = publicSettings?.features
    ? publicSettings.features.captcha !== false &&
      publicSettings.features.captchaForgotPassword !== false
    : false;

  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = t(lang, "auth", "forgotErrorEmailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "forgotErrorEmailInvalid");
      }
    }

    if (RECAPTCHA_SITE_KEY && forgotCaptchaEnabled && !captchaToken) {
      errors.captcha = t(lang, "auth", "forgotErrorCaptchaRequired");
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
      const res = await fetch(buildApiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          captchaToken:
            RECAPTCHA_SITE_KEY && forgotCaptchaEnabled
              ? (captchaToken ?? undefined)
              : undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          setFormError(t(lang, "auth", "forgotErrorInvalidData"));
        } else {
          setFormError(t(lang, "auth", "forgotErrorGeneric"));
        }
      } else {
        setFormSuccess(t(lang, "auth", "forgotSuccess"));
      }
    } catch {
      setFormError(t(lang, "auth", "forgotErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!registerEnabled) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
        <main className="w-full max-w-md">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t(lang, "auth", "forgotDisabledTitle")}
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            {t(lang, "auth", "forgotDisabledMessage")}
          </p>

          <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <button
              type="button"
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              onClick={() => router.push("/auth/login")}
            >
              {t(lang, "auth", "forgotDisabledLoginCta")}
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
          {t(lang, "auth", "forgotTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "forgotSubtitle")}
        </p>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p>{t(lang, "auth", "socialResetPasswordHintNoProviders")}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="inline-flex" aria-label="Google">
              <GoogleIcon className="h-4 w-4" />
            </span>
            <span className="inline-flex" aria-label="Facebook">
              <FacebookIcon className="h-4 w-4" />
            </span>
            <span className="inline-flex" aria-label="GitHub">
              <GithubIcon className="h-4 w-4" />
            </span>
            <span className="inline-flex" aria-label="LinkedIn">
              <LinkedinIcon className="h-4 w-4" />
            </span>
          </div>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "forgotEmailLabel")}
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
              <p className="mt-2 text-xs text-gray-500">
                {t(lang, "auth", "forgotResetLinkInfo")}
              </p>
            </div>

            {forgotCaptchaEnabled && RECAPTCHA_SITE_KEY ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  {t(lang, "auth", "forgotCaptchaLabel")}
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
            ) : process.env.NODE_ENV !== "production" &&
              forgotCaptchaEnabled ? (
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                {t(lang, "auth", "forgotCaptchaPlaceholder")}
              </div>
            ) : null}

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
                ? t(lang, "auth", "forgotSubmitLoading")
                : t(lang, "auth", "forgotSubmit")}
            </button>
          </form>
        </section>

        <div className="mt-6 flex items-center justify-center text-xs text-green-700">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 hover:text-green-800"
            onClick={() => router.push("/auth/login")}
            disabled={submitting}
          >
            <span aria-hidden="true">←</span>
            <span>{t(lang, "auth", "forgotLoginLink")}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
