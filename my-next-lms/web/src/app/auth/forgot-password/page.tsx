'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  email?: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const lang = useCurrentLang();

  const [email, setEmail] = useState("");
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
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
      <main className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {t(lang, "auth", "forgotTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "forgotSubtitle")}
        </p>

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

            <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              {t(lang, "auth", "forgotCaptchaPlaceholder")}
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
