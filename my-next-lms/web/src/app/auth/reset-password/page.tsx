'use client';

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  newPassword?: string;
  confirmNewPassword?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();

  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!newPassword) {
      errors.newPassword = t(
        lang,
        "auth",
        "resetErrorNewPasswordRequired",
      );
    } else if (newPassword.length < 8) {
      errors.newPassword = t(lang, "auth", "resetErrorNewPasswordTooShort");
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = t(
        lang,
        "auth",
        "resetErrorConfirmPasswordRequired",
      );
    } else if (confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = t(
        lang,
        "auth",
        "resetErrorPasswordsMismatch",
      );
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!token) {
      setFormError(t(lang, "auth", "resetErrorInvalidOrExpiredLink"));
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          setFormError(t(lang, "auth", "resetErrorInvalidOrExpiredLink"));
        } else {
          setFormError(t(lang, "auth", "resetErrorGeneric"));
        }
      } else {
        setFormSuccess(t(lang, "auth", "resetSuccess"));
        setCompleted(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch {
      setFormError(t(lang, "auth", "resetErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
      <main className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {t(lang, "auth", "resetTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "resetSubtitle")}
        </p>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t(lang, "auth", "resetInfoMessage")}
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "resetNewPasswordLabel")} {" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting || completed}
              />
              {fieldErrors.newPassword && (
                <p className="text-xs text-red-600">{fieldErrors.newPassword}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  lang,
                  "auth",
                  "resetPasswordRequirementsItemMinLength",
                )}
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-800"
              >
                {t(lang, "auth", "resetConfirmNewPasswordLabel")} {" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.confirmNewPassword && (
                <p className="text-xs text-red-600">
                  {fieldErrors.confirmNewPassword}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-700">
                {t(lang, "auth", "resetPasswordRequirementsTitle")}
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-green-500">
                    ●
                  </span>
                  {t(
                    lang,
                    "auth",
                    "resetPasswordRequirementsItemMinLength",
                  )}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-emerald-500">
                    ●
                  </span>
                  {t(
                    lang,
                    "auth",
                    "resetPasswordRequirementsItemRecommendation",
                  )}
                </li>
              </ul>
            </div>

            {formError && (
              <div className="space-y-2" aria-live="assertive">
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
                {formError ===
                  t(lang, "auth", "resetErrorInvalidOrExpiredLink") && (
                  <button
                    type="button"
                    className="text-xs text-gray-900 underline underline-offset-2 hover:text-gray-700"
                    onClick={() => router.push("/auth/forgot-password")}
                    disabled={submitting || completed}
                  >
                    {t(lang, "auth", "resetGoToForgotCta")}
                  </button>
                )}
              </div>
            )}
            {formSuccess && (
              <div className="space-y-2" aria-live="polite">
                <p className="text-sm text-green-600" role="status">
                  {formSuccess}
                </p>
                <button
                  type="button"
                  className="text-xs text-gray-900 underline underline-offset-2 hover:text-gray-700"
                  onClick={() => router.push("/auth/login")}
                  disabled={submitting}
                >
                  {t(lang, "auth", "resetSuccessLoginCta")}
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting || completed}
            >
              {submitting
                ? t(lang, "auth", "resetSubmitLoading")
                : t(lang, "auth", "resetSubmit")}
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
            <span>{t(lang, "auth", "resetBackToLogin")}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
