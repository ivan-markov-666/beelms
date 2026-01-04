"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";

const API_BASE_URL = getApiBaseUrl();

type CourseCategory = {
  id: string;
  slug: string;
  title: string;
  order: number;
  active: boolean;
};

type CreateCategoryForm = {
  slug: string;
  title: string;
  order: string;
  active: boolean;
};

const DEFAULT_FORM: CreateCategoryForm = {
  slug: "",
  title: "",
  order: "0",
  active: true,
};

export default function AdminCourseCategoriesPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCategoryForm>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    slug: string;
    title: string;
    order: string;
    active: boolean;
  } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) =>
        a.order !== b.order
          ? a.order - b.order
          : a.title.localeCompare(b.title),
      );
  }, [categories]);

  const readErrorMessage = useCallback(
    async (res: Response): Promise<string> => {
      try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body?.message === "string" && body.message.trim()) {
          return body.message;
        }
      } catch {}

      return "Request failed";
    },
    [],
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

      const res = await fetch(`${API_BASE_URL}/admin/course-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Възникна грешка при зареждане на категориите.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as CourseCategory[];
      setCategories(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на категориите.");
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

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === "undefined") return;

    setCreateError(null);
    setCreateSuccess(null);
    setCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCreateError("Липсва достъп до Admin API.");
        setCreating(false);
        return;
      }

      const slug = form.slug.trim();
      const title = form.title.trim();
      const order = Number(form.order);

      if (!slug) {
        setCreateError("Slug is required.");
        setCreating(false);
        return;
      }

      if (!title) {
        setCreateError("Title is required.");
        setCreating(false);
        return;
      }

      if (
        form.order.trim() &&
        (!Number.isFinite(order) || !Number.isInteger(order) || order < 0)
      ) {
        setCreateError("Order must be an integer >= 0.");
        setCreating(false);
        return;
      }

      const payload = {
        slug,
        title,
        order: form.order.trim() ? order : 0,
        active: !!form.active,
      };

      const res = await fetch(`${API_BASE_URL}/admin/course-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setCreateError(msg || "Неуспешно създаване на категория.");
        setCreating(false);
        return;
      }

      const created = (await res.json()) as CourseCategory;
      setCategories((prev) => [created, ...prev]);
      setForm(DEFAULT_FORM);
      setCreateSuccess("Категорията е създадена.");
      setCreating(false);
    } catch {
      setCreateError("Неуспешно създаване на категория.");
      setCreating(false);
    }
  };

  const startEdit = (c: CourseCategory) => {
    setSaveError(null);
    setSaveSuccess(null);
    setEditingId(c.id);
    setEditDraft({
      slug: c.slug,
      title: c.title,
      order: String(c.order ?? 0),
      active: !!c.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (c: CourseCategory) => {
    if (typeof window === "undefined") return;
    if (!editDraft) return;

    setSaveError(null);
    setSaveSuccess(null);
    setSavingId(c.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setSaveError("Липсва достъп до Admin API.");
        setSavingId(null);
        return;
      }

      const nextSlug = editDraft.slug.trim();
      const nextTitle = editDraft.title.trim();
      const nextOrder = Number(editDraft.order);

      if (!nextSlug) {
        setSaveError("Slug is required.");
        setSavingId(null);
        return;
      }

      if (!nextTitle) {
        setSaveError("Title is required.");
        setSavingId(null);
        return;
      }

      if (
        !editDraft.order.trim() ||
        !Number.isFinite(nextOrder) ||
        !Number.isInteger(nextOrder) ||
        nextOrder < 0
      ) {
        setSaveError("Order must be an integer >= 0.");
        setSavingId(null);
        return;
      }

      const payload: Record<string, unknown> = {};
      if (nextSlug !== c.slug) payload.slug = nextSlug;
      if (nextTitle !== c.title) payload.title = nextTitle;
      if (nextOrder !== c.order) payload.order = nextOrder;
      if (!!editDraft.active !== !!c.active)
        payload.active = !!editDraft.active;

      if (Object.keys(payload).length === 0) {
        setSaveSuccess("Няма промени за запис.");
        setSavingId(null);
        cancelEdit();
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/course-categories/${encodeURIComponent(c.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setSaveError(msg || "Неуспешен запис.");
        setSavingId(null);
        return;
      }

      const updated = (await res.json()) as CourseCategory;
      setCategories((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      setSaveSuccess("Записано.");
      setSavingId(null);
      cancelEdit();
    } catch {
      setSaveError("Неуспешен запис.");
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Courses", href: "/admin/courses" },
            { label: "Categories" },
          ]}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Create category
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Slug</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="e.g. web-development"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Title</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Web development"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Order</span>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
                value={form.order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, order: e.target.value }))
                }
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, active: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

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
              {createSuccess}
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
          <h2 className="text-lg font-semibold text-gray-900">
            Categories list
          </h2>
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

        {!loading && !error && sorted.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">No categories found.</p>
        )}

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

        {!loading && !error && sorted.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Slug</th>
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editDraft?.title ?? ""}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, title: e.target.value } : p,
                              )
                            }
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {c.title}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editDraft?.slug ?? ""}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, slug: e.target.value } : p,
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-700">{c.slug}</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editDraft?.order ?? "0"}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, order: e.target.value } : p,
                              )
                            }
                            inputMode="numeric"
                          />
                        ) : (
                          <span className="text-gray-700">{c.order}</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={!!editDraft?.active}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, active: e.target.checked } : p,
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-700">
                            {c.active ? "yes" : "no"}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-60"
                              disabled={savingId === c.id}
                              onClick={() => void saveEdit(c)}
                            >
                              {savingId === c.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="text-sm text-gray-600 hover:text-gray-800"
                              disabled={savingId === c.id}
                              onClick={() => cancelEdit()}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-medium text-green-700 hover:text-green-900"
                            onClick={() => startEdit(c)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
