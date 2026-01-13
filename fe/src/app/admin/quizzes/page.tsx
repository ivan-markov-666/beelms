"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import Link from "next/link";
import { Pagination } from "../../_components/pagination";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

type AdminQuizListItem = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: string;
  passingScore: number | null;
  questions: Array<unknown>;
  createdAt: string;
  updatedAt: string;
};

type CreateQuizForm = {
  title: string;
  description: string;
  language: string;
  status: string;
  passingScore: string;
};

const DEFAULT_FORM: CreateQuizForm = {
  title: "",
  description: "",
  language: "bg",
  status: "draft",
  passingScore: "",
};

function formatDateTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateIso;
  }
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [form, setForm] = useState<CreateQuizForm>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(
          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
        );
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на quizzes.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminQuizListItem[];
      setQuizzes(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на quizzes.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const sortedQuizzes = useMemo(() => {
    return quizzes
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [quizzes]);

  const totalCount = sortedQuizzes.length;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = sortedQuizzes.slice(startIndex, endIndex);
  const showingFrom = totalCount === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalCount);

  const exportCsv = () => {
    if (totalCount === 0 || typeof window === "undefined") {
      return;
    }

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = [
      "id",
      "title",
      "language",
      "status",
      "questions",
      "passingScore",
      "createdAt",
      "updatedAt",
    ];

    const rows = sortedQuizzes.map((quiz) => [
      quiz.id,
      quiz.title,
      quiz.language,
      quiz.status,
      Array.isArray(quiz.questions) ? quiz.questions.length : 0,
      typeof quiz.passingScore === "number" ? quiz.passingScore : "",
      quiz.createdAt,
      quiz.updatedAt,
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-quizzes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCreateError(null);
    setCreateSuccess(null);
    setCreatedQuizId(null);
    setCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCreateError(
          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
        );
        setCreating(false);
        return;
      }

      const title = form.title.trim();
      const description = form.description.trim();

      const passingScoreRaw = form.passingScore.trim();
      const parsedPassingScore = passingScoreRaw
        ? Number(passingScoreRaw)
        : NaN;
      const maybePassingScore = passingScoreRaw ? parsedPassingScore : null;

      if (!title) {
        setCreateError("Title is required.");
        setCreating(false);
        return;
      }

      if (
        passingScoreRaw &&
        (!Number.isFinite(parsedPassingScore) || parsedPassingScore < 0)
      ) {
        setCreateError("passingScore трябва да е число >= 0.");
        setCreating(false);
        return;
      }

      const payload: Record<string, unknown> = {
        title,
        language: form.language,
        status: form.status,
      };

      if (description) {
        payload.description = description;
      }

      if (maybePassingScore !== null) {
        payload.passingScore = maybePassingScore;
      }

      const res = await fetch(`${API_BASE_URL}/admin/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setCreateError("Неуспешно създаване на quiz.");
        setCreating(false);
        return;
      }

      const created = (await res.json()) as AdminQuizListItem;
      setForm(DEFAULT_FORM);
      setCreating(false);
      setQuizzes((prev) => [created, ...prev]);
      setCreateSuccess("Quiz е създаден.");
      setCreatedQuizId(created.id);
    } catch {
      setCreateError("Неуспешно създаване на quiz.");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Quizzes" },
          ]}
        />

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Quizzes
          </h1>
          <p className="text-gray-600">Администрация на quizzes (MVP).</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create quiz</h2>

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
              <ListboxSelect
                ariaLabel="Quiz language"
                value={form.language}
                onChange={(next) => setForm((p) => ({ ...p, language: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={[
                  { value: "bg", label: "bg" },
                  { value: "en", label: "en" },
                ]}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <ListboxSelect
                ariaLabel="Quiz status"
                value={form.status}
                onChange={(next) => setForm((p) => ({ ...p, status: next }))}
                buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                options={[
                  { value: "draft", label: "draft" },
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ]}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Passing score (optional)
              </span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.passingScore}
                onChange={(e) =>
                  setForm((p) => ({ ...p, passingScore: e.target.value }))
                }
                inputMode="numeric"
                placeholder="e.g. 3"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Description (optional)
            </span>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
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
                {createdQuizId && (
                  <Link
                    href={`/admin/quizzes/${createdQuizId}`}
                    className="font-medium text-green-800 hover:text-green-900 hover:underline"
                  >
                    Open quiz →
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
          <h2 className="text-lg font-semibold text-gray-900">Quizzes list</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={exportCsv}
              disabled={totalCount === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="text-sm font-medium text-green-700 hover:text-green-900"
              onClick={() => void load()}
            >
              Reload
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-3 text-sm text-gray-500">Loading quizzes...</p>
        )}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && sortedQuizzes.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No quizzes found.</p>
        )}

        {!loading && !error && sortedQuizzes.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Language</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Questions</th>
                  <th className="px-2 py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <Link
                        href={`/admin/quizzes/${quiz.id}`}
                        className="font-medium text-green-700 hover:text-green-900 hover:underline"
                      >
                        {quiz.title}
                      </Link>
                      {quiz.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                          {quiz.description}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2 text-gray-700">{quiz.language}</td>
                    <td className="px-2 py-2 text-gray-700">{quiz.status}</td>
                    <td className="px-2 py-2 text-gray-700">
                      {Array.isArray(quiz.questions)
                        ? quiz.questions.length
                        : 0}
                    </td>
                    <td className="px-2 py-2 text-gray-700">
                      {formatDateTime(quiz.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-3 py-3 text-xs text-gray-600 md:text-sm">
              <p>
                Showing <span className="font-semibold">{showingFrom}</span>-
                <span className="font-semibold">{showingTo}</span> of{" "}
                <span className="font-semibold">{totalCount}</span> quizzes
              </p>
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                pageSize={pageSize}
                onPageSizeChange={(next) => {
                  setCurrentPage(1);
                  setPageSize(next);
                }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
