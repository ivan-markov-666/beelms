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
import { getApiBaseUrl } from "../../api-url";

const API_BASE_URL = getApiBaseUrl();

type AdminTask = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CreateTaskForm = {
  title: string;
  description: string;
  language: string;
  status: string;
};

const DEFAULT_FORM: CreateTaskForm = {
  title: "",
  description: "",
  language: "bg",
  status: "draft",
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

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateTaskForm>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

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

      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на tasks.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminTask[];
      setTasks(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на tasks.");
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

  const sortedTasks = useMemo(() => {
    return tasks.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tasks]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCreateError(null);
    setCreateSuccess(null);
    setCreatedTaskId(null);
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

      if (!title) {
        setCreateError("Title is required.");
        setCreating(false);
        return;
      }

      if (!description) {
        setCreateError("Description is required.");
        setCreating(false);
        return;
      }

      const payload = {
        title,
        description,
        language: form.language,
        status: form.status,
      };

      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setCreateError("Неуспешно създаване на task.");
        setCreating(false);
        return;
      }

      const created = (await res.json()) as AdminTask;
      setForm(DEFAULT_FORM);
      setCreating(false);
      setTasks((prev) => [created, ...prev]);
      setCreateSuccess("Task е създаден.");
      setCreatedTaskId(created.id);
    } catch {
      setCreateError("Неуспешно създаване на task.");
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
          <span className="text-gray-900">Tasks</span>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Tasks
          </h1>
          <p className="text-gray-600">Администрация на tasks (MVP).</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create task</h2>

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
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Description
            </span>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              rows={4}
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
                {createdTaskId && (
                  <Link
                    href={`/admin/tasks/${createdTaskId}`}
                    className="font-medium text-green-800 hover:text-green-900 hover:underline"
                  >
                    Open task →
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
          <h2 className="text-lg font-semibold text-gray-900">Tasks list</h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
        </div>

        {loading && <p className="mt-3 text-sm text-gray-500">Loading...</p>}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && sortedTasks.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No tasks found.</p>
        )}

        {!loading && !error && sortedTasks.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Language</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <Link
                        href={`/admin/tasks/${task.id}`}
                        className="font-medium text-green-700 hover:text-green-900 hover:underline"
                      >
                        {task.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                        {task.description}
                      </p>
                    </td>
                    <td className="px-2 py-2 text-gray-700">{task.language}</td>
                    <td className="px-2 py-2 text-gray-700">{task.status}</td>
                    <td className="px-2 py-2 text-gray-700">
                      {formatDateTime(task.updatedAt)}
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
