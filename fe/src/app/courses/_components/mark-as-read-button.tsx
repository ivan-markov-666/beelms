"use client";

import { useState, useEffect, useCallback } from "react";
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

interface MarkAsReadButtonProps {
  courseId: string;
  wikiSlug: string;
}

export function MarkAsReadButton({
  courseId,
  wikiSlug,
}: MarkAsReadButtonProps) {
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

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

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = (await res.json()) as CurriculumProgress;

      setProgressPercent(data.progressPercent);

      const item = data.items.find(
        (i) => i.itemType === "wiki" && i.wikiSlug === wikiSlug,
      );

      if (item) {
        setItemId(item.id);
        setCompleted(item.completed);
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [courseId, wikiSlug]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  const handleMarkAsRead = async () => {
    if (!itemId || marking || completed) return;

    const token = getAccessToken();
    if (!token) {
      setError("Трябва да си логнат.");
      return;
    }

    setMarking(true);
    setError(null);

    try {
      const res = await fetch(
        buildApiUrl(
          `/courses/${encodeURIComponent(courseId)}/curriculum/${encodeURIComponent(itemId)}/complete`,
        ),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 204 || res.ok) {
        setCompleted(true);

        await fetchProgress();

        window.dispatchEvent(
          new CustomEvent("course-progress-updated", {
            detail: { courseId },
          }),
        );
      } else if (res.status === 401) {
        setError("Трябва да си логнат.");
      } else if (res.status === 403) {
        setError("Трябва да се запишеш в курса.");
      } else {
        setError("Неуспешно маркиране.");
      }
    } catch {
      setError("Неуспешно маркиране.");
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!itemId) {
    return null;
  }

  if (completed) {
    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--primary)",
            backgroundColor: "color-mix(in srgb, var(--primary) 10%, white)",
            color: "var(--primary)",
          }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Прочетено</span>
        </div>

        {typeof progressPercent === "number" && progressPercent >= 100 && (
          <Link
            href={`/my-courses/${encodeURIComponent(courseId)}/certificate`}
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            Certificate
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleMarkAsRead}
        disabled={marking}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          backgroundColor: "var(--primary)",
          borderColor: "var(--primary)",
          color: "var(--on-primary)",
        }}
      >
        {marking ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Маркиране...</span>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Маркирай като прочетено</span>
          </>
        )}
      </button>
      {error && <p className="text-xs text-[color:var(--error)]">{error}</p>}
    </div>
  );
}
