"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";

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

type TaskEditForm = {
  title: string;
  description: string;
  language: string;
  status: string;
};

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {}

  return "Request failed";
}

export default function AdminTaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId;

  const [task, setTask] = useState<AdminTask | null>(null);
  const [form, setForm] = useState<TaskEditForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Админ табло", href: "/admin" },
      { label: "Tasks", href: "/admin/tasks" },
      { label: task?.title ?? "Task details" },
    ],
    [task?.title],
  );

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

      if (!taskId) {
        setError("Missing taskId");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на task.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminTask;
      setTask(data);
      setForm({
        title: data.title,
        description: data.description,
        language: data.language,
        status: data.status,
      });
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на task.");
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const isDirty = useMemo(() => {
    if (!task || !form) return false;
    return (
      form.title.trim() !== task.title ||
      form.description.trim() !== task.description ||
      form.language !== task.language ||
      form.status !== task.status
    );
  }, [task, form]);

  const save = async () => {
    if (typeof window === "undefined") return;
    if (!taskId || !task || !form) return;

    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setSaveError("Липсва достъп до Admin API.");
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {};
      const nextTitle = form.title.trim();
      const nextDesc = form.description.trim();

      if (nextTitle !== task.title) payload.title = nextTitle;
      if (nextDesc !== task.description) payload.description = nextDesc;
      if (form.language !== task.language) payload.language = form.language;
      if (form.status !== task.status) payload.status = form.status;

      if (Object.keys(payload).length === 0) {
        setSaveSuccess("Няма промени за запис.");
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setSaveError(msg || "Неуспешен запис.");
        setSaving(false);
        return;
      }

      const updated = (await res.json()) as AdminTask;
      setTask(updated);
      setForm({
        title: updated.title,
        description: updated.description,
        language: updated.language,
        status: updated.status,
      });
      setSaveSuccess("Записано.");
      setSaving(false);
    } catch {
      setSaveError("Неуспешен запис.");
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (typeof window === "undefined") return;
    if (!taskId) return;

    const ok = window.confirm("Сигурен ли си, че искаш да изтриеш този task?");
    if (!ok) return;

    setDeleteError(null);
    setDeleting(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setDeleteError("Липсва достъп до Admin API.");
        setDeleting(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setDeleteError(msg || "Неуспешно изтриване.");
        setDeleting(false);
        return;
      }

      window.location.href = "/admin/tasks";
    } catch {
      setDeleteError("Неуспешно изтриване.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-gray-500">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-red-700">{error ?? "Task not found"}</p>
        <Link
          href="/admin/tasks"
          className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={breadcrumbItems} />

      <section className="space-y-4">
        <Link
          href="/admin/tasks"
          className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to tasks
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {task.title}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {task.language}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">{task.status}</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Task settings</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              disabled={saving || !isDirty}
              onClick={() => void save()}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="rounded border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              disabled={deleting}
              onClick={() => void deleteTask()}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {saveError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {saveSuccess}
          </div>
        )}

        {deleteError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {deleteError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Title</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form?.title ?? ""}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, title: e.target.value } : p))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Language</span>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              value={form?.language ?? "bg"}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, language: e.target.value } : p))
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
              value={form?.status ?? "draft"}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, status: e.target.value } : p))
              }
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-medium text-gray-600">Description</span>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            rows={6}
            value={form?.description ?? ""}
            onChange={(e) =>
              setForm((p) => (p ? { ...p, description: e.target.value } : p))
            }
          />
        </label>
      </section>
    </div>
  );
}
