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

export function EnrollCourseButton({
  courseId,
  isPaid,
}: {
  courseId: string;
  isPaid: boolean;
}) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

    const res = await fetch(apiUrl(`/courses/${courseId}/purchase`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      setHasToken(false);
      setError("Няма активна сесия. Моля, влезте отново.");
      return false;
    }

    if (!res.ok && res.status !== 204) {
      setError("Неуспешно отключване на курса. Опитайте отново.");
      return false;
    }

    return true;
  };

  const enroll = async () => {
    setError(null);
    setSuccess(null);

    const accessToken = getAccessToken();

    if (!accessToken) {
      setHasToken(false);
      return;
    }

    setSubmitting(true);

    try {
      if (isPaid) {
        const purchased = await purchaseIfNeeded(accessToken);
        if (!purchased) {
          return;
        }
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
        return;
      }

      if (res.status === 403) {
        setError(
          "Този курс е платен. Записването изисква плащане (Payment required).",
        );
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Записването в курса не беше успешно. Опитайте отново.");
        return;
      }

      setSuccess("Записването е успешно.");
      setEnrolled(true);
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSubmitting(false);
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
        disabled={submitting || enrolled}
        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
      >
        {submitting
          ? isPaid
            ? "Отключване..."
            : "Записване..."
          : enrolled
            ? "Enrolled"
            : isPaid
              ? "Unlock & Enroll"
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
