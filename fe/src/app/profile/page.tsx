'use client';

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clearAccessToken, getAccessToken } from "../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type UserProfile = {
  id: string;
  email: string;
  createdAt: string;
  emailChangeLimitReached: boolean;
  emailChangeLimitResetAt: string | null;
};

type UserExport = {
  id: string;
  email: string;
  createdAt: string;
  active: boolean;
};

function formatDate(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateIso;
  }
}

function formatDateTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateIso;
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [emailEditOpen, setEmailEditOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailLastSubmitted, setEmailLastSubmitted] = useState<string | null>(
    null,
  );
  const [emailLastSubmittedAt, setEmailLastSubmittedAt] = useState<
    number | null
  >(null);
  const [emailChangeLimitWarning, setEmailChangeLimitWarning] = useState<
    string | null
  >(null);

  const [passwordEditOpen, setPasswordEditOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<UserExport | null>(null);

  const [deleteStep1Open, setDeleteStep1Open] = useState(false);
  const [deleteStep2Open, setDeleteStep2Open] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      const stored = getAccessToken();
      if (!stored) {
        router.replace("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${stored}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            try {
              clearAccessToken();
            } catch {
              // ignore
            }
            router.replace("/auth/login");
            return;
          }

          if (!cancelled) {
            setGlobalError("Неуспешно зареждане на профила. Моля, опитайте отново.");
          }
          return;
        }

        const data = (await res.json()) as UserProfile;
        if (!cancelled) {
          setAuthToken(stored);
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setGlobalError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!profile) return;

    if (profile.emailChangeLimitReached) {
      setEmailChangeLimitWarning(
        "Достигнат е максималният брой потвърждения на нов имейл за последните 24 часа. Моля, опитайте отново след 24 часа.",
      );
    } else {
      setEmailChangeLimitWarning(null);
    }
  }, [profile]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        clearAccessToken();
      } catch {
        // ignore
      }
    }
    router.replace("/");
  };

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !authToken) return;

    setEmailError(null);
    setEmailSuccess(null);

    const value = emailInput.trim();
    if (!value || !/.+@.+\..+/.test(value)) {
      setEmailError("Моля, въведете валиден email адрес.");
      return;
    }

    if (value === profile.email) {
      setEmailError("Новият email съвпада с текущия email адрес.");
      return;
    }

    if (emailChangeLimitWarning) {
      setEmailError(emailChangeLimitWarning);
      return;
    }

    const now = Date.now();

    if (
      emailLastSubmitted &&
      value === emailLastSubmitted &&
      emailLastSubmittedAt
    ) {
      const THROTTLE_MS = 60 * 1000;
      if (now - emailLastSubmittedAt < THROTTLE_MS) {
        setEmailSuccess(
          "Вече изпратихме имейл за потвърждение на този адрес. Моля, използвайте най-новия получен линк или проверете пощата си. Може да заявите нов имейл отново след 60 секунди.",
        );
        return;
      }
    }

    setEmailSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: value }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const limitMessage =
            "Достигнат е максималният брой потвърждения на нов имейл за последните 24 часа. Моля, опитайте отново след 24 часа.";
          setEmailError(limitMessage);
          setEmailChangeLimitWarning(limitMessage);
          return;
        }

        setEmailError(
          "Промяната на email не беше успешна. Моля, опитайте отново.",
        );
        return;
      }

      const updated = (await res.json()) as UserProfile;
      setProfile(updated);
      setEmailLastSubmitted(value);
      setEmailLastSubmittedAt(now);
      setEmailSuccess(
        "Изпратихме имейл за потвърждение на новия адрес. Промяната ще влезе в сила след потвърждение.",
      );
    } catch {
      setEmailError("Възникна грешка при връзката със сървъра.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authToken) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Новата парола трябва да е поне 8 символа.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Новата парола и потвърждението трябва да съвпадат.");
      return;
    }

    setPasswordSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        setPasswordError(
          "Смяната на паролата не беше успешна. Моля, опитайте отново.",
        );
        return;
      }

      setPasswordSuccess("Паролата беше успешно сменена.");
      setPasswordEditOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Възникна грешка при връзката със сървъра.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (!authToken) return;

    setExportError(null);
    setExportSuccess(null);
    setExportData(null);
    setExportSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ captchaToken: "dummy-captcha-token" }),
      });

      if (!res.ok) {
        setExportError(
          "Експортът на данни не беше успешен. Моля, опитайте отново.",
        );
        return;
      }

      const data = (await res.json()) as UserExport;
      setExportData(data);
      setExportSuccess("Заявката за експорт на данни беше приета.");
    } catch {
      setExportError("Възникна грешка при връзката със сървъра.");
    } finally {
      setExportSubmitting(false);
    }
  };

  const handleFinalDelete = async () => {
    if (!authToken) return;

    setDeleteError(null);
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        setDeleteError(
          "Изтриването на акаунта не беше успешно. Моля, опитайте отново.",
        );
        return;
      }

      if (typeof window !== "undefined") {
        try {
          clearAccessToken();
        } catch {
          // ignore
        }
      }

      router.replace("/auth/account-deleted");
    } catch {
      setDeleteError("Възникна грешка при връзката със сървъра.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Зареждане на профила...</p>
        </main>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <main className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600" role="alert">
            {globalError}
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => router.replace("/auth/login")}
          >
            Към страницата за вход
          </button>
        </main>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <main className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-zinc-900">Моят профил</h1>
            <p className="text-sm text-zinc-600">
              Управлявайте вашия акаунт и данни
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Изход
          </button>
        </div>        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 flex items-center text-xl font-bold text-gray-900">
            <span
              aria-hidden="true"
              className="mr-2 inline-flex h-6 w-6 items-center justify-center text-green-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            <span>Профилна информация</span>
          </h2>

          <div className="space-y-4">
            <div className="border-b border-zinc-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Email адрес
                    </p>
                    <span
                      className="cursor-help rounded-full border border-zinc-400 px-1 text-[10px] leading-none text-zinc-600"
                      title="Можете да заявите до 3 успешни смени на имейл адрес за последните 24 часа. При достигане на лимита ще получавате съобщение при потвърждение на новия имейл и ще трябва да изчакате до 24 часа, преди да заявите нова промяна."
                    >
                      i
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-900">{profile.email}</p>
                  {emailChangeLimitWarning && !emailEditOpen && (
                    <>
                      <p className="mt-1 text-xs text-amber-700" role="alert">
                        {emailChangeLimitWarning}
                      </p>
                      {profile.emailChangeLimitResetAt && (
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          Лимитът ще бъде нулиран около{" "}
                          {formatDateTime(profile.emailChangeLimitResetAt)}.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-green-700 hover:text-green-800"
                  onClick={() => {
                    setEmailInput(profile.email);
                    setEmailEditOpen((open) => !open);
                    setEmailError(null);
                    setEmailSuccess(null);
                  }}
                >
                  Промяна
                </button>
              </div>

              {emailEditOpen && (
                <form
                  onSubmit={handleEmailSubmit}
                  className="mt-3 max-w-md space-y-2"
                >
                  <label
                    htmlFor="email-input"
                    className="block text-xs font-medium text-zinc-700"
                  >
                    Нов email адрес
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={emailSubmitting}
                  />
                  {emailError && (
                    <p className="text-xs text-red-600" role="alert">
                      {emailError}
                    </p>
                  )}
                  {emailSuccess && (
                    <p className="text-xs text-green-600" role="status">
                      {emailSuccess}
                    </p>
                  )}
                  {emailChangeLimitWarning && (
                    <>
                      <p className="text-xs text-amber-700" role="alert">
                        {emailChangeLimitWarning}
                      </p>
                      {profile.emailChangeLimitResetAt && (
                        <p className="text-[11px] text-amber-700">
                          Лимитът ще бъде нулиран около{" "}
                          {formatDateTime(profile.emailChangeLimitResetAt)}.
                        </p>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
                      disabled={emailSubmitting}
                    >
                      Запази
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200"
                      onClick={() => {
                        setEmailEditOpen(false);
                        setEmailError(null);
                        setEmailSuccess(null);
                      }}
                      disabled={emailSubmitting}
                    >
                      Отказ
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="border-b border-zinc-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Парола
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">••••••••</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  onClick={() => {
                    setPasswordEditOpen((open) => !open);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                >
                  Промяна
                </button>
              </div>

              {passwordError && (
                <p className="mt-2 text-xs text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="mt-2 text-xs text-green-600" role="status">
                  {passwordSuccess}
                </p>
              )}

              {passwordEditOpen && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="mt-3 space-y-2"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor="current-password"
                        className="block text-xs font-medium text-zinc-700"
                      >
                        Текуща парола
                      </label>
                      <input
                        id="current-password"
                        type="password"
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={passwordSubmitting}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-xs font-medium text-zinc-700"
                      >
                        Нова парола
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={passwordSubmitting}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-xs font-medium text-zinc-700"
                      >
                        Потвърждение
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={passwordSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
                      disabled={passwordSubmitting}
                    >
                      Запази
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200"
                      onClick={() => {
                        setPasswordEditOpen(false);
                        setPasswordError(null);
                        setPasswordSuccess(null);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={passwordSubmitting}
                    >
                      Отказ
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Дата на регистрация
              </p>
              <p className="mt-1 text-sm text-zinc-900">
                {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-bold text-gray-900">
            <span
              aria-hidden="true"
              className="mr-2 inline-flex h-6 w-6 items-center justify-center text-blue-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </span>
            <span>Експорт на данни (GDPR)</span>
          </h2>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              Можете да изтеглите всички ваши данни, съхранявани в системата.
              Експортът включва профилна информация, история на действията и
              други свързани данни.
            </p>
          </div>
          <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            CAPTCHA / reCAPTCHA (placeholder за защита от ботове при заявка
            за експорт на лични данни)
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
            disabled={exportSubmitting}
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Експортирай моите данни
          </button>
          {exportError && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {exportError}
            </p>
          )}
          {exportSuccess && (
            <p className="mt-2 text-xs text-green-600" role="status">
              {exportSuccess}
            </p>
          )}
          {exportData && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Детайли от експортираните данни
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">ID:</span> {exportData.id}
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">Email:</span> {exportData.email}
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">Дата на регистрация:</span> {" "}
                {formatDate(exportData.createdAt)}
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">Активен акаунт:</span> {" "}
                {exportData.active ? "Да" : "Не"}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-bold text-gray-900">
            <span
              aria-hidden="true"
              className="mr-2 inline-flex h-6 w-6 items-center justify-center text-red-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.062 19h13.876A2 2 0 0021 16.34L13.732 4a2 2 0 00-3.464 0L3 16.34A2 2 0 005.062 19z"
                />
              </svg>
            </span>
            <span>Закриване на акаунта (изтриване)</span>
          </h2>
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-sm font-medium text-red-900">
              ⚠️ Внимание: Това действие е необратимо!
            </p>
            <p className="text-sm text-red-800">
              При закриване/изтриване на акаунта личните ви данни ще бъдат
              премахнати от системата, съгласно нашите правила за защита на
              данните и GDPR. Това действие е окончателно и не може да бъде
              отменено.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteStep1Open(true);
              setDeleteError(null);
            }}
            className="flex items-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Изтрий акаунта завинаги
          </button>
          {deleteError && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {deleteError}
            </p>
          )}
        </section>

        {deleteStep1Open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-zinc-900">
                Закриване на акаунта
              </h3>
              <p className="mb-4 text-sm text-zinc-700">
                Акаунтът ви ще бъде завинаги закрит и изтрит. Това действие е необратимо
                и ще доведе до премахване на вашите лични данни съгласно нашите правила
                за защита на данните и GDPR.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  onClick={() => setDeleteStep1Open(false)}
                >
                  Затвори
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  onClick={() => {
                    setDeleteStep1Open(false);
                    setDeleteStep2Open(true);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteStep2Open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-zinc-900">
                Потвърдете изтриването на акаунта
              </h3>
              <p className="mb-4 text-sm text-zinc-700">
                Наистина ли искате акаунтът ви да бъде изтрит напълно? Това действие е
                окончателно и не може да бъде отменено.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  onClick={() => setDeleteStep2Open(false)}
                  disabled={deleteSubmitting}
                >
                  Отказ
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                  onClick={handleFinalDelete}
                  disabled={deleteSubmitting}
                >
                  Да, изтрий акаунта завинаги
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
