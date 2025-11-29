'use client';

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  captcha?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
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
      errors.email = "Моля, въведете имейл.";
    } else {
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(email)) {
        errors.email = "Моля, въведете валиден имейл адрес.";
      }
    }

    if (!password) {
      errors.password = "Моля, въведете парола.";
    } else if (password.length < 8) {
      errors.password = "Паролата трябва да е поне 8 символа.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Моля, потвърдете паролата.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Паролите не съвпадат.";
    }

    if (!acceptTerms) {
      errors.terms = "Необходимо е да приемете условията.";
    }

    if (!captchaChecked) {
      errors.captcha = "Моля, потвърдете, че не сте робот.";
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
          captchaToken: captchaChecked ? "dummy-captcha-token" : undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setFormError("Този имейл вече е регистриран.");
        } else if (res.status === 400) {
          setFormError(
            "Данните не са валидни. Моля, проверете формата и опитайте отново.",
          );
        } else {
          setFormError("Регистрацията не успя. Моля, опитайте отново по-късно.");
        }
      } else {
        setFormSuccess(
          "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 13000);
      }
    } catch {
      setFormError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Зареждане...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Регистрация
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          Създайте своя безплатен акаунт в QA4Free.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
              Имейл
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
              Парола
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-800"
            >
              Потвърди паролата
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-800 focus:ring-zinc-800"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={submitting}
            />
            <label htmlFor="terms" className="text-xs text-zinc-700">
              Съгласен съм с Условията за ползване и Политиката за поверителност.
            </label>
          </div>
          {fieldErrors.terms && (
            <p className="text-xs text-red-600">{fieldErrors.terms}</p>
          )}

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
                Не съм робот (placeholder за CAPTCHA интеграция).
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
            {submitting ? "Изпращане..." : "Регистрация"}
          </button>

          <p className="text-xs text-zinc-600">
            Вече имате акаунт?{" "}
            <button
              type="button"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              onClick={() => router.push("/auth/login")}
              disabled={submitting}
            >
              Вход
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
