"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../auth-token";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
  const normalizedBase = base.endsWith("/api")
    ? base
    : `${base.replace(/\/$/, "")}/api`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

type MyCourseListItem = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  enrollmentStatus: "not_started" | "in_progress" | "completed";
  progressPercent: number | null;
  enrolledAt: string | null;
};

export default function MyCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const res = await fetch(apiUrl("/users/me/courses"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          setError("Неуспешно зареждане на My Courses.");
          return;
        }

        const data = (await res.json()) as MyCourseListItem[];

        if (!cancelled) {
          setItems(data);
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
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">My Courses</h1>
        <p className="text-sm text-zinc-600">
          Записаните курсове за текущия потребител.
        </p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">
            Все още нямате записани курсове.
          </p>
          <Link
            href="/courses"
            className="mt-3 inline-block text-sm text-green-700 hover:text-green-800"
          >
            Отиди към Courses →
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((course) => (
            <div
              key={course.id}
              className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/courses/${course.id}`}
                className="mb-2 text-lg font-semibold text-gray-900 hover:text-green-800"
              >
                {course.title}
              </Link>
              <p className="text-sm text-gray-600 line-clamp-4">
                {course.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-1">
                  {course.language}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  {course.enrollmentStatus}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-sm text-green-700 hover:text-green-800"
                >
                  Open course →
                </Link>

                {course.enrollmentStatus === "completed" && (
                  <Link
                    href={`/my-courses/${course.id}/certificate`}
                    className="text-sm text-green-700 hover:text-green-800"
                  >
                    Certificate →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
