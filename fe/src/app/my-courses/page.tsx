"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../auth-token";
import { buildApiUrl } from "../api-url";

type MyCourseListItem = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  enrollmentStatus: "not_started" | "in_progress" | "completed";
  progressPercent: number | null;
  enrolledAt: string | null;
};

function enrollmentStatusLabel(
  status: MyCourseListItem["enrollmentStatus"],
): string {
  switch (status) {
    case "not_started":
      return "Не е започнат";
    case "in_progress":
      return "В прогрес";
    case "completed":
      return "Завършен";
  }
}

function courseCtaLabel(status: MyCourseListItem["enrollmentStatus"]): string {
  switch (status) {
    case "not_started":
      return "Започни →";
    case "in_progress":
      return "Продължи →";
    case "completed":
      return "Отвори курса →";
  }
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyCourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);

  const handleRemove = async (course: MyCourseListItem) => {
    if (typeof window === "undefined") return;
    if (course.isPaid) return;

    const ok = window.confirm(
      `Сигурен ли си, че искаш да премахнеш курса "${course.title}" от My Courses? Това ще изтрие и прогреса ти.`,
    );
    if (!ok) return;

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setRemovingCourseId(course.id);
    setError(null);

    try {
      const res = await fetch(
        buildApiUrl(`/courses/${encodeURIComponent(course.id)}/unenroll`),
        {
          method: "POST",
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
        setError("Платен курс не може да бъде премахнат.");
        return;
      }

      if (!res.ok && res.status !== 204) {
        setError("Неуспешно премахване на курса. Опитайте отново.");
        return;
      }

      setItems((prev) => prev.filter((c) => c.id !== course.id));
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setRemovingCourseId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const res = await fetch(buildApiUrl("/users/me/courses"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (res.status === 404) {
          router.replace("/courses");
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

      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">
            Все още нямате записани курсове.
          </p>
          <Link
            href="/courses"
            className="mt-3 inline-block text-sm text-[color:var(--primary)] hover:opacity-90"
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
              <div className="mb-3 flex items-start justify-between gap-3">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-lg font-semibold text-gray-900 hover:opacity-90"
                >
                  {course.title}
                </Link>
                <span
                  className="shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold"
                  style={
                    course.isPaid
                      ? {
                          borderColor: "var(--attention)",
                          backgroundColor:
                            "color-mix(in srgb, var(--attention) 15%, white)",
                          color: "var(--attention)",
                        }
                      : {
                          borderColor: "var(--primary)",
                          backgroundColor:
                            "color-mix(in srgb, var(--primary) 15%, white)",
                          color: "var(--primary)",
                        }
                  }
                >
                  {course.isPaid ? "Paid" : "Free"}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-4">
                {course.description}
              </p>

              {typeof course.progressPercent === "number" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Прогрес</span>
                    <span>{course.progressPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(Math.max(course.progressPercent, 0), 100)}%`,
                        backgroundColor: "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-1">
                  {course.language}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  {enrollmentStatusLabel(course.enrollmentStatus)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-sm text-[color:var(--primary)] hover:opacity-90"
                >
                  {courseCtaLabel(course.enrollmentStatus)}
                </Link>

                {course.enrollmentStatus === "completed" && (
                  <Link
                    href={`/my-courses/${course.id}/certificate`}
                    className="text-sm text-[color:var(--primary)] hover:opacity-90"
                  >
                    Certificate →
                  </Link>
                )}

                {!course.isPaid && (
                  <button
                    type="button"
                    onClick={() => void handleRemove(course)}
                    disabled={removingCourseId === course.id}
                    className="ml-auto rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--error)",
                      borderColor: "var(--error)",
                      color: "var(--on-error)",
                    }}
                  >
                    {removingCourseId === course.id ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
