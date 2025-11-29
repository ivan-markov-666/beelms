'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  email?: string;
  captcha?: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const lang = useCurrentLang();

  const [email, setEmail] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = t(lang, "auth", "forgotErrorEmailRequired");
    } else {
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "forgotErrorEmailInvalid");
      }
    }

    if (!captchaChecked) {
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
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          captchaToken: captchaChecked ? "dummy-captcha-token" : undefined,
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          {t(lang, "auth", "forgotTitle")}
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          {t(lang, "auth", "forgotSubtitle")}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
              {t(lang, "auth", "forgotEmailLabel")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mt-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                id="captcha"
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-zinc-800 focus:ring-zinc-800"
                checked={captchaChecked}
                onChange={(e) => setCaptchaChecked(e.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="captcha" className="text-xs text-zinc-700">
                {t(lang, "auth", "forgotCaptchaLabel")}
              </label>
            </div>
            {fieldErrors.captcha && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.captcha}</p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="text-sm text-emerald-600" role="status">
              {formSuccess}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting
              ? t(lang, "auth", "forgotSubmitLoading")
              : t(lang, "auth", "forgotSubmit")}
          </button>

          <p className="text-xs text-zinc-600">
            {t(lang, "auth", "forgotHasPassword")} {" "}
            <button
              type="button"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              onClick={() => router.push("/auth/login")}
              disabled={submitting}
            >
              {t(lang, "auth", "forgotLoginLink")}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
