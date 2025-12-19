"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../../auth-token";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  const normalizedBase = base.endsWith("/api")
    ? base
    : `${base.replace(/\/$/, "")}/api`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

type CourseCertificate = {
  courseId: string;
  courseTitle: string;
  userId: string;
  userEmail: string;
  completedAt: string;
  issuedAt: string;
};

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

export default function CourseCertificatePage(props: {
  params: { courseId: string } | Promise<{ courseId: string }>;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CourseCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const resolvedParams = await props.params;

      try {
        const res = await fetch(
          apiUrl(`/courses/${resolvedParams.courseId}/certificate`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (res.status === 403) {
          if (!cancelled) {
            setError("Сертификатът е наличен само след завършване на курса.");
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на сертификата.");
          }
          return;
        }

        const data = (await res.json()) as CourseCertificate;

        if (!cancelled) {
          setCertificate(data);
        }
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [props.params, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <Link
          href="/my-courses"
          className="text-sm text-green-700 hover:text-green-800"
        >
          ← Back to My Courses
        </Link>
        <h1 className="text-3xl font-semibold text-zinc-900">Certificate</h1>
        <p className="text-sm text-zinc-600">Certificate (MVP).</p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && certificate && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {certificate.courseTitle}
            </h2>
            <p className="text-sm text-gray-700">
              Awarded to <span className="font-semibold">{certificate.userEmail}</span>
            </p>
            <p className="text-sm text-gray-700">
              Completed at: {formatDateTime(certificate.completedAt)}
            </p>
            <p className="text-sm text-gray-700">
              Issued at: {formatDateTime(certificate.issuedAt)}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href={`/courses/${certificate.courseId}`}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              View course
            </Link>
            <Link
              href="/my-courses"
              className="text-sm text-green-700 hover:text-green-800"
            >
              Back to My Courses
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
