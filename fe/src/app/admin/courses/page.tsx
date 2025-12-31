"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";

const API_BASE_URL = getApiBaseUrl();

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

type CourseDetail = CourseSummary & {
  curriculum: unknown[];
};

type CreateCourseForm = {
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string;
  priceCents: string;
};

const DEFAULT_FORM: CreateCourseForm = {
  title: "",
  description: "",
  language: "bg",
  status: "draft",
  isPaid: false,
  currency: "eur",
  priceCents: "999",
};

export default function AdminCoursesPage() {
  const lang = useCurrentLang();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCourseForm>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(t(lang, "common", "adminUsersNoToken"));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на курсовете.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as CourseSummary[];
      setCourses(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на курсовете.");
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCourses();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCourses]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCreateError(null);
    setCreateSuccess(null);
    setCreatedCourseId(null);
    setCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCreateError(t(lang, "common", "adminUsersNoToken"));
        setCreating(false);
        return;
      }

      const currency = form.currency.trim().toLowerCase();
      const priceRaw = form.priceCents.trim();
      const priceCents = /^\d+$/.test(priceRaw)
        ? Number.parseInt(priceRaw, 10)
        : NaN;

      if (form.isPaid) {
        if (!/^[a-z]{3}$/.test(currency)) {
          setCreateError("Paid course изисква валидна валута (напр. EUR).");
          setCreating(false);
          return;
        }
        if (!Number.isFinite(priceCents) || priceCents <= 0) {
          setCreateError(
            "Paid course изисква валидна цена в cents (напр. 999).",
          );
          setCreating(false);
          return;
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        language: form.language,
        status: form.status,
        isPaid: form.isPaid,
        ...(form.isPaid
          ? {
              currency,
              priceCents,
            }
          : {}),
      };

      const res = await fetch(`${API_BASE_URL}/admin/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setCreateError("Неуспешно създаване на курс.");
        setCreating(false);
        return;
      }

      const created = (await res.json()) as CourseDetail;
      setForm(DEFAULT_FORM);
      setCreating(false);

      setCourses((prev) => [created, ...prev]);
      setCreateSuccess("Курсът е създаден.");
      setCreatedCourseId(created.id);
    } catch {
      setCreateError("Неусешно създаване на курс.");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/admin" className="hover:text-green-600">
            Admin
          </Link>
          <svg
            className="mx-2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900">Courses</span>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Courses
          </h1>
          <p className="text-gray-600">Администрация на курсове (MVP).</p>
          <div className="mt-2">
            <Link
              href="/admin/courses/categories"
              className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
            >
              Manage course categories →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create course</h2>

        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Title</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Language
              </span>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                value={form.language}
                onChange={(e) =>
                  setForm((p) => ({ ...p, language: e.target.value }))
                }
              >
                <option value="bg">bg</option>
                <option value="en">en</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPaid: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">Paid course</span>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Currency
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
                value={form.currency}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currency: e.target.value }))
                }
                disabled={!form.isPaid}
                required={form.isPaid}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Price (cents)
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceCents: e.target.value }))
                }
                disabled={!form.isPaid}
                inputMode="numeric"
                required={form.isPaid}
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Description
            </span>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              required
            />
          </label>

          {createError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {createError}
            </div>
          )}

          {createSuccess && (
            <div
              className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              role="status"
            >
              <div className="flex items-center justify-between gap-3">
                <span>{createSuccess}</span>
                {createdCourseId && (
                  <Link
                    href={`/admin/courses/${createdCourseId}`}
                    className="font-medium text-green-800 hover:text-green-900 hover:underline"
                  >
                    Open course →
                  </Link>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Courses list</h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void loadCourses()}
          >
            Reload
          </button>
        </div>

        {loading && (
          <p className="mt-3 text-sm text-gray-500">Loading courses...</p>
        )}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No courses found.</p>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Language</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Paid</th>
                  <th className="px-2 py-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="font-medium text-green-700 hover:text-green-900 hover:underline"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                        {course.description}
                      </p>
                    </td>
                    <td className="px-2 py-2 text-gray-700">
                      {course.category?.title ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-gray-700">
                      {course.language}
                    </td>
                    <td className="px-2 py-2 text-gray-700">{course.status}</td>
                    <td className="px-2 py-2 text-gray-700">
                      {course.isPaid ? "yes" : "no"}
                    </td>
                    <td className="px-2 py-2 text-gray-700">
                      {course.isPaid && course.priceCents
                        ? `${(course.priceCents / 100).toFixed(2)} ${(
                            course.currency ?? "eur"
                          ).toUpperCase()}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
