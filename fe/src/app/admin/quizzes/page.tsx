"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { getAccessToken } from "../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

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
      const maybePassingScore = passingScoreRaw
        ? Number(passingScoreRaw)
        : null;

      if (!title) {
        setCreateError("Title is required.");
        setCreating(false);
        return;
      }

      if (
        passingScoreRaw &&
        (!Number.isFinite(maybePassingScore) || maybePassingScore < 0)
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
          <span className="text-gray-900">Quizzes</span>
        </div>

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
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
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
                {sortedQuizzes.map((quiz) => (
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
          </div>
        )}
      </section>
    </div>
  );
}
