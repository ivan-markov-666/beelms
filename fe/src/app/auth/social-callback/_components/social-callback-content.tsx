"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "../../../../i18n/t";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { setAccessToken } from "../../../auth-token";
import {
  DEFAULT_SOCIAL_REDIRECT,
  normalizeSocialRedirectPath,
} from "../../social-login";

export function SocialCallbackContent() {
  const lang = useCurrentLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = useMemo(() => {
    return (
      normalizeSocialRedirectPath(searchParams.get("redirect")) ??
      DEFAULT_SOCIAL_REDIRECT
    );
  }, [searchParams]);

  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const hasError = !token || Boolean(error);

  useEffect(() => {
    if (hasError || !token) {
      return;
    }

    try {
      setAccessToken(token);
    } catch {
      // ignore storage errors
    }

    const timer = setTimeout(() => {
      router.replace(redirectPath);
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasError, redirectPath, router, token]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <main className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {hasError
            ? t(lang, "auth", "socialCallbackErrorTitle")
            : t(lang, "auth", "socialCallbackTitle")}
        </h1>
        {!hasError ? (
          <div className="space-y-2 text-sm text-gray-600">
            <p>{t(lang, "auth", "socialCallbackProcessing")}</p>
            <p>{t(lang, "auth", "socialCallbackRedirectNotice")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-600" role="alert">
              {t(lang, "auth", "socialCallbackError")}
            </p>
            <button
              type="button"
              className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              onClick={() => router.push("/auth/login")}
            >
              {t(lang, "auth", "socialCallbackErrorCta")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
