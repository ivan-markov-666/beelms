'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccessToken } from "../../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type Status =
  | "idle"
  | "loading"
  | "success"
  | "invalid_or_expired"
  | "missing_token"
  | "error";

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(() =>
    token ? "loading" : "missing_token",
  );
  const [message, setMessage] = useState<string | null>(() =>
    token
      ? null
      : "Линкът за потвърждение е невалиден. Моля, използвайте най-новия линк, изпратен на имейла ви.",
  );
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const updateHasToken = () => {
      if (cancelled) return;
      try {
        const stored = getAccessToken();
        setHasAccessToken(Boolean(stored));
      } catch {
        setHasAccessToken(false);
      }
    };

    const timeoutId = window.setTimeout(updateHasToken, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    const verify = async () => {
      setStatus("loading");
      setMessage(null);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (res.ok) {
          setStatus("success");
          setMessage(
            "Имейлът беше потвърден успешно. Вече можете да продължите да използвате акаунта си.",
          );

          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(
                "beelms_email_change_limit_reached_at",
              );
            } catch {
              // ignore
            }
          }
        } else if (res.status === 429) {
          setStatus("invalid_or_expired");
          setMessage(
            "Не успяхме да потвърдим този линк за промяна на имейл адреса. Върнете се в профила си, за да видите повече информация за лимита на промените на имейл адрес за последните 24 часа.",
          );

          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                "beelms_email_change_limit_reached_at",
                new Date().toISOString(),
              );
            } catch {
              // ignore
            }
          }
        } else if (res.status === 400) {
          setStatus("invalid_or_expired");
          setMessage(
            "Линкът за потвърждение е невалиден или е изтекъл. Ако имате нужда от нов линк, влезте в акаунта си и заявете ново потвърждение.",
          );
        } else {
          setStatus("error");
          setMessage(
            "Потвърждението на имейла не успя. Моля, опитайте отново по-късно.",
          );
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          "Потвърждението на имейла не успя. Моля, опитайте отново по-късно.",
        );
      }
    };

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const goToLogin = () => {
    router.push("/auth/login");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  const goHome = () => {
    router.push("/");
  };

  const isLoading = status === "loading";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Потвърждение на имейл
        </h1>
        <p className="mb-4 text-sm text-zinc-600">
          Тази страница потвърждава имейл адреса ви чрез получен по имейл линк.
        </p>

        {isLoading && (
          <p className="text-sm text-zinc-600">Потвърждаваме имейла ви...</p>
        )}

        {!isLoading && message && (
          <p
            className={`text-sm ${
              status === "success"
                ? "text-green-600"
                : status === "invalid_or_expired" || status === "missing_token"
                ? "text-amber-700"
                : "text-red-600"
            }`}
            role={status === "success" ? "status" : "alert"}
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {status === "success" && (
            <button
              type="button"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              onClick={hasAccessToken ? goToProfile : goToLogin}
            >
              {hasAccessToken ? "Към профила" : "Към страницата за вход"}
            </button>
          )}

          {(status === "invalid_or_expired" || status === "missing_token") && (
            <button
              type="button"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              onClick={goToLogin}
            >
              Към страницата за вход
            </button>
          )}

          {status === "error" && (
            <button
              type="button"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              onClick={goHome}
            >
              Към началната страница
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
