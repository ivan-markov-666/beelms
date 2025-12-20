"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken } from "../../auth-token";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  const normalizedBase = base.endsWith("/api")
    ? base
    : `${base.replace(/\/$/, "")}/api`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

const STRIPE_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENTS === "true";

function formatPrice(currency: string, priceCents: number): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  const amount = priceCents / 100;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

export function EnrollCourseButton({
  courseId,
  isPaid,
  currency,
  priceCents,
}: {
  courseId: string;
  isPaid: boolean;
  currency?: string | null;
  priceCents?: number | null;
}) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "unlocking" | "enrolling">(
    "idle",
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(!!getAccessToken());
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    const checkEnrolled = async () => {
      try {
        const res = await fetch(apiUrl("/users/me/courses"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          setHasToken(false);
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as Array<{ id: string }>;
        if (!cancelled) {
          setEnrolled(data.some((c) => c.id === courseId));
        }
      } catch {}
    };

    void checkEnrolled();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const purchaseIfNeeded = async (accessToken: string) => {
    if (!isPaid) {
      return true;
    }

    if (!STRIPE_PAYMENTS_ENABLED) {
      setError("Плащането не е налично.");
      setPhase("idle");
      return false;
    }

    setPhase("unlocking");

    const res = await fetch(apiUrl(`/courses/${courseId}/checkout`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      setHasToken(false);
      setError("Няма активна сесия. Моля, влезте отново.");
      setPhase("idle");
      return false;
    }

    if (!res.ok) {
      setError("Плащането не е налично (Stripe не е конфигуриран). ");
      setPhase("idle");
      return false;
    }

    const body = (await res.json()) as { url?: string };
    if (!body.url) {
      setError("Неуспешно стартиране на плащането.");
      setPhase("idle");
      return false;
    }

    window.location.href = body.url;
    return false;
  };

  const enroll = async () => {
    setError(null);
    setSuccess(null);

    const accessToken = getAccessToken();

    if (!accessToken) {
      setHasToken(false);
      return;
    }

    setPhase("enrolling");

    try {
      if (isPaid) {
        const purchased = await purchaseIfNeeded(accessToken);
        if (!purchased) {
          return;
        }

        setPhase("enrolling");
      }

      const res = await fetch(apiUrl(`/courses/${courseId}/enroll`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 401) {
        setHasToken(false);
        setError("Няма активна сесия. Моля, влезте отново.");
        setPhase("idle");
        return;
      }

      if (res.status === 403) {
        setError("Курсът е платен и не е отключен (Payment required).");
        setPhase("idle");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Записването в курса не беше успешно. Опитайте отново.");
        setPhase("idle");
        return;
      }

      setSuccess(
        isPaid
          ? "Курсът е отключен и записването е успешно."
          : "Записването е успешно.",
      );
      setEnrolled(true);
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setPhase("idle");
    }
  };

  if (hasToken === false) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
      >
        Вход за записване
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={enroll}
        disabled={phase !== "idle" || enrolled}
        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
      >
        {phase === "unlocking"
          ? "Отключване..."
          : phase === "enrolling"
            ? "Записване..."
            : enrolled
              ? "Enrolled"
              : isPaid
                ? STRIPE_PAYMENTS_ENABLED
                  ? typeof priceCents === "number" && !!currency
                    ? `Pay ${formatPrice(currency, priceCents)} & Enroll`
                    : "Pay & Enroll"
                  : "Unlock & Enroll"
                : "Enroll"}
      </button>

      {success && <p className="text-sm text-green-700">{success}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {success && (
        <Link
          href="/my-courses"
          className="text-sm text-green-700 hover:text-green-800"
        >
          Виж My Courses →
        </Link>
      )}
    </div>
  );
}
