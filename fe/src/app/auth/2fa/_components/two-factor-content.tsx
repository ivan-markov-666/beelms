"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { buildApiUrl } from "../../../api-url";
import { setAccessToken } from "../../../auth-token";

type FieldErrors = {
  code?: string;
};

export function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useCurrentLang();

  const challengeToken = searchParams.get("challenge") ?? "";
  const redirectPath = useMemo(() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/wiki";
    if (!raw.startsWith("/")) return "/wiki";
    if (raw.startsWith("//")) return "/wiki";
    return raw;
  }, [searchParams]);

  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!challengeToken) {
      setFormError(t(lang, "auth", "twoFactorErrorMissingChallenge"));
    }
  }, [challengeToken, lang]);

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const trimmed = code.trim();

    if (!trimmed) {
      errors.code = t(lang, "auth", "twoFactorErrorCodeRequired");
    } else if (!/^[0-9]{6}$/.test(trimmed)) {
      errors.code = t(lang, "auth", "twoFactorErrorCodeInvalidFormat");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!challengeToken) {
      setFormError(t(lang, "auth", "twoFactorErrorMissingChallenge"));
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(buildApiUrl("/auth/login/2fa"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeToken,
          code: code.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setFormError(t(lang, "auth", "twoFactorErrorInvalidCode"));
        } else {
          setFormError(t(lang, "auth", "twoFactorErrorGeneric"));
        }
        return;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        tokenType?: string;
      };

      if (data?.accessToken) {
        try {
          setAccessToken(data.accessToken);
        } catch {
          // ignore
        }
      }

      router.push(redirectPath);
    } catch {
      setFormError(t(lang, "auth", "loginErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {t(lang, "auth", "twoFactorTitle")}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t(lang, "auth", "twoFactorSubtitle")}
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {formError && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                {t(lang, "auth", "twoFactorCodeLabel")}
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.code && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {fieldErrors.code}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !challengeToken}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? t(lang, "auth", "twoFactorSubmitLoading")
                : t(lang, "auth", "twoFactorSubmit")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              {t(lang, "auth", "twoFactorBackToLogin")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
