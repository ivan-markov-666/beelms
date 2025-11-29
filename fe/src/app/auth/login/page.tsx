'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const lang = useCurrentLang();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Ако потребителят вече има запазен токен, правим кратка проверка към
  // бекенда (`GET /api/users/me`). Ако токенът е валиден, го пренасочваме
  // към началната страница, иначе чистим невалидния токен и показваме формата.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isCancelled = false;

    const checkSession = async () => {
      try {
        const token = window.localStorage.getItem("qa4free_access_token");
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
            window.localStorage.removeItem("qa4free_access_token");
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
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(email)) {
        errors.email = t(lang, "auth", "loginErrorEmailInvalid");
      }
    }

    if (!password) {
      errors.password = t(lang, "auth", "loginErrorPasswordRequired");
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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
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
            window.localStorage.setItem(
              "qa4free_access_token",
              data.accessToken,
            );
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          {t(lang, "auth", "loginTitle")}
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          {t(lang, "auth", "loginSubtitle")}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
              {t(lang, "auth", "loginEmailLabel")}
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

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800"
            >
              {t(lang, "auth", "loginPasswordLabel")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting
              ? t(lang, "auth", "loginSubmitLoading")
              : t(lang, "auth", "loginSubmit")}
          </button>

          <div className="flex items-center justify-between text-xs text-zinc-600">
            <button
              type="button"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              onClick={() => router.push("/auth/forgot-password")}
              disabled={submitting}
            >
              {t(lang, "auth", "loginForgotLink")}
            </button>
            <button
              type="button"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              onClick={() => router.push("/auth/register")}
              disabled={submitting}
            >
              {t(lang, "auth", "loginRegisterLink")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
