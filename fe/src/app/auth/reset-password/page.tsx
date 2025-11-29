'use client';

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type FieldErrors = {
  newPassword?: string;
  confirmNewPassword?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      errors.newPassword = "Моля, въведете нова парола.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Паролата трябва да е поне 8 символа.";
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = "Моля, потвърдете новата парола.";
    } else if (confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = "Паролите не съвпадат.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!token) {
      setFormError(
        "Линкът за смяна на паролата е невалиден или е изтекъл. Моля, заявете нов линк от екрана 'Забравена парола'.",
      );
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
          setFormError(
            "Линкът за смяна на паролата е невалиден или е изтекъл. Моля, заявете нов линк от екрана 'Забравена парола'.",
          );
        } else {
          setFormError(
            "Смяната на паролата не успя. Моля, опитайте отново по-късно.",
          );
        }
      } else {
        setFormSuccess(
          "Паролата беше сменена успешно. Ще ви пренасочим към страницата за вход...",
        );
        setCompleted(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch {
      setFormError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Смяна на парола
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          Въведете новата си парола (минимум 8 символа).
        </p>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-zinc-800"
            >
              Нова парола
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting || completed}
            />
            {fieldErrors.newPassword && (
              <p className="text-xs text-red-600">{fieldErrors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-zinc-800"
            >
              Потвърди новата парола
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800"
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

          {formError && (
            <div className="space-y-2" aria-live="assertive">
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
              {formError ===
                "Линкът за смяна на паролата е невалиден или е изтекъл. Моля, заявете нов линк от екрана 'Забравена парола'." && (
                <button
                  type="button"
                  className="text-xs text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                  onClick={() => router.push("/auth/forgot-password")}
                  disabled={submitting || completed}
                >
                  Към екрана „Забравена парола“
                </button>
              )}
            </div>
          )}
          {formSuccess && (
            <div className="space-y-2" aria-live="polite">
              <p className="text-sm text-emerald-600" role="status">
                {formSuccess}
              </p>
              <button
                type="button"
                className="text-xs text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                onClick={() => router.push("/auth/login")}
                disabled={submitting}
              >
                Към страницата за вход
              </button>
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting || completed}
          >
            {submitting ? "Смяна..." : "Смени паролата"}
          </button>

          <p className="text-xs text-zinc-600">
            Вече помните паролата си?{" "}
            <button
              type="button"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              onClick={() => router.push("/auth/login")}
              disabled={submitting}
            >
              Върни се към вход
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
