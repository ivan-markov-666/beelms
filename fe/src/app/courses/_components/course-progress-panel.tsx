"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken } from "../../auth-token";
import { buildApiUrl } from "../../api-url";

type CurriculumProgressItem = {
  id: string;
  title: string;
  itemType: string;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
  completed: boolean;
  completedAt: string | null;
};

type CurriculumProgress = {
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  items: CurriculumProgressItem[];
};

export function CourseProgressPanel({
  courseId,
  courseLanguage,
}: {
  courseId: string;
  courseLanguage: string;
}) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CurriculumProgress | null>(null);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    setHasToken(!!token);

    if (!token) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        buildApiUrl(
          `/courses/${encodeURIComponent(courseId)}/curriculum/progress`,
        ),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        setHasToken(false);
        setError(null);
        setData(null);
        return;
      }

      if (res.status === 403) {
        setError("Запиши се в курса, за да виждаш прогреса.");
        setData(null);
        return;
      }

      if (!res.ok) {
        setError("Неуспешно зареждане на прогреса.");
        setData(null);
        return;
      }

      const json = (await res.json()) as CurriculumProgress;
      setError(null);
      setData(json);
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ courseId?: string }>;
      if (custom.detail?.courseId && custom.detail.courseId !== courseId) {
        return;
      }
      void refresh();
    };

    window.addEventListener("course-progress-updated", handler);
    return () => {
      window.removeEventListener("course-progress-updated", handler);
    };
  }, [courseId, refresh]);

  if (loading) {
    return null;
  }

  if (hasToken === false) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Прогрес</h2>
        <p className="mt-2 text-sm text-gray-700">
          Влез, за да виждаш прогреса си.
        </p>
        <Link
          href="/auth/login"
          className="mt-3 inline-block text-sm text-green-700 hover:text-green-800"
        >
          Вход →
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Прогрес</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const safePercent = Math.min(Math.max(data.progressPercent ?? 0, 0), 100);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Прогрес</h2>
        <span className="text-sm font-semibold text-gray-700">
          {safePercent}%
        </span>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-green-600"
          style={{ width: `${safePercent}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Завършени: {data.completedItems}/{data.totalItems}
      </p>

      {safePercent >= 100 && (
        <div className="mt-4">
          <Link
            href={`/my-courses/${encodeURIComponent(courseId)}/certificate`}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
          >
            Certificate
          </Link>
        </div>
      )}

      {data.items.length > 0 && (
        <ol className="mt-4 space-y-2 text-sm text-gray-700">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <span
                className={`mt-[3px] inline-block h-4 w-4 rounded-full border ${
                  item.completed
                    ? "border-green-600 bg-green-600"
                    : "border-gray-300 bg-white"
                }`}
                aria-label={item.completed ? "Completed" : "Not completed"}
              />
              <div className="min-w-0">
                {item.itemType === "wiki" && item.wikiSlug ? (
                  <Link
                    href={`/courses/${encodeURIComponent(
                      courseId,
                    )}/wiki/${encodeURIComponent(
                      item.wikiSlug,
                    )}?lang=${encodeURIComponent(courseLanguage)}`}
                    className="font-medium text-green-700 hover:text-green-800 hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : item.itemType === "task" && item.taskId ? (
                  <Link
                    href={`/courses/${encodeURIComponent(
                      courseId,
                    )}/tasks/${encodeURIComponent(item.taskId)}`}
                    className="font-medium text-green-700 hover:text-green-800 hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : item.itemType === "quiz" && item.quizId ? (
                  <Link
                    href={`/courses/${encodeURIComponent(
                      courseId,
                    )}/quizzes/${encodeURIComponent(item.quizId)}`}
                    className="font-medium text-green-700 hover:text-green-800 hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">
                    {item.title}
                  </span>
                )}
                <span className="ml-2 text-xs text-gray-500">
                  ({item.itemType})
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
