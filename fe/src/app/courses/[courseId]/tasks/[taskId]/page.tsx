"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken } from "../../../../auth-token";
import { MarkTaskCompletedButton } from "../../../_components/mark-task-completed-button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type CourseTaskDetail = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  updatedAt: string;
};

export default function CourseTaskPage() {
  const params = useParams<{ courseId: string; taskId: string }>();
  const courseId = params?.courseId;
  const taskId = params?.taskId;

  const [task, setTask] = useState<CourseTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!courseId || !taskId) return;

    let cancelled = false;

    const token = getAccessToken();
    if (!token) {
      window.setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Трябва да си логнат, за да отвориш тази задача.");
        }
      }, 0);
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(
            courseId,
          )}/tasks/${encodeURIComponent(taskId)}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (cancelled) return;

        if (res.status === 401) {
          setError("Трябва да си логнат, за да отвориш тази задача.");
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          setError(
            "Нямаш достъп до тази задача. Отключи/запиши се в курса от страницата на курса.",
          );
          setLoading(false);
          return;
        }

        if (res.status === 404) {
          setError("Задачата не е намерена.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Неуспешно зареждане на задачата.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as CourseTaskDetail;
        setTask(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Неуспешно зареждане на задачата.");
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [courseId, taskId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">
          <Link
            href={
              courseId ? `/courses/${encodeURIComponent(courseId)}` : "/courses"
            }
            className="hover:underline"
          >
            ← Назад към курса
          </Link>
        </p>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}

        {!loading && error && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && task && (
          <>
            <h1 className="text-4xl font-bold text-zinc-900">{task.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-1">
                {task.language}
              </span>
              <span className="rounded bg-gray-100 px-2 py-1">
                {task.status}
              </span>
            </div>
          </>
        )}
      </header>

      {!loading && !error && task && (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Задача</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
              {task.description}
            </p>
          </section>

          {courseId && taskId && (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Прогрес</h2>
              <p className="mt-2 text-sm text-gray-600">
                Маркирай задачата като завършена, за да се обнови прогресът ти.
              </p>
              <div className="mt-3">
                <MarkTaskCompletedButton courseId={courseId} taskId={taskId} />
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
