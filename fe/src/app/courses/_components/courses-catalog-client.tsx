"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../auth-token";
import { buildApiUrl } from "../../api-url";

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
};

type MyCourseProgressItem = {
  id: string;
  progressPercent: number | null;
  enrollmentStatus: string;
};

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

export function CoursesCatalogClient({
  courses,
}: {
  courses: CourseSummary[];
}) {
  const [progressByCourseId, setProgressByCourseId] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(buildApiUrl("/users/me/courses"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = (await res.json()) as MyCourseProgressItem[];
        const map: Record<string, number> = {};

        for (const item of Array.isArray(data) ? data : []) {
          const id = (item?.id ?? "").trim();
          if (!id) continue;

          const p =
            typeof item.progressPercent === "number"
              ? Math.min(Math.max(item.progressPercent, 0), 100)
              : null;

          if (p !== null) {
            map[id] = p;
          }
        }

        if (!cancelled) {
          setProgressByCourseId(map);
        }
      } catch {
        // ignore
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const progressSet = useMemo(
    () => new Set(Object.keys(progressByCourseId)),
    [progressByCourseId],
  );

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const percent = progressSet.has(course.id)
          ? progressByCourseId[course.id]
          : null;

        return (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {course.title}
              </h2>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    course.isPaid
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {course.isPaid ? "Paid" : "Free"}
                </span>

                {course.isPaid &&
                  typeof course.priceCents === "number" &&
                  !!course.currency && (
                    <span className="text-[11px] font-semibold text-zinc-700">
                      {formatPrice(course.currency, course.priceCents)}
                    </span>
                  )}
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-4">
              {course.description}
            </p>

            {course.category?.title && (
              <div className="mt-3">
                <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {course.category.title}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-1">
                {course.language}
              </span>
              <span className="rounded bg-gray-100 px-2 py-1">
                {course.status}
              </span>
            </div>

            {typeof percent === "number" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </section>
  );
}
