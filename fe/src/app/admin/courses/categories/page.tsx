"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";
import { Pagination } from "../../../_components/pagination";
import { StyledCheckbox } from "../../_components/styled-checkbox";
import { InfoTooltip } from "../../_components/info-tooltip";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

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
  const lang = useCurrentLang();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) =>
        a.order !== b.order
          ? a.order - b.order
          : a.title.localeCompare(b.title),
      );
  }, [categories]);

  const totalCount = sorted.length;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = sorted.slice(startIndex, endIndex);
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

    const header = ["id", "title", "slug", "order", "active"];
    const rows = sorted.map((c) => [
      c.id,
      c.title,
      c.slug,
      c.order,
      c.active ? "true" : "false",
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-course-categories-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const readErrorMessage = useCallback(
    async (res: Response): Promise<string> => {
      try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body?.message === "string" && body.message.trim()) {
          return body.message;
        }
      } catch {}

      return t(lang, "common", "adminCoursesRequestFailed");
    },
    [lang],
  );

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(t(lang, "common", "adminErrorMissingApiAccess"));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/course-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError(t(lang, "common", "adminCoursesCategoriesLoadError"));
        setLoading(false);
        return;
      }

      const data = (await res.json()) as CourseCategory[];
      setCategories(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setError(t(lang, "common", "adminCoursesCategoriesLoadError"));
      setLoading(false);
    }
  }, [lang]);

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
        setCreateError(t(lang, "common", "adminErrorMissingApiAccess"));
        setCreating(false);
        return;
      }

      const slug = form.slug.trim();
      const title = form.title.trim();
      const order = Number(form.order);

      if (!slug) {
        setCreateError(t(lang, "common", "adminCoursesCategoriesSlugRequired"));
        setCreating(false);
        return;
      }

      if (!title) {
        setCreateError(
          t(lang, "common", "adminCoursesCategoriesTitleRequired"),
        );
        setCreating(false);
        return;
      }

      if (
        form.order.trim() &&
        (!Number.isFinite(order) || !Number.isInteger(order) || order < 0)
      ) {
        setCreateError(t(lang, "common", "adminCoursesCategoriesOrderInvalid"));
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
        setCreateError(
          msg || t(lang, "common", "adminCoursesCategoriesCreateError"),
        );
        setCreating(false);
        return;
      }

      const created = (await res.json()) as CourseCategory;
      setCategories((prev) => [created, ...prev]);
      setForm(DEFAULT_FORM);
      setCreateSuccess(
        t(lang, "common", "adminCoursesCategoriesCreateSuccess"),
      );
      setCreating(false);
    } catch {
      setCreateError(t(lang, "common", "adminCoursesCategoriesCreateError"));
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
        setSaveError(t(lang, "common", "adminErrorMissingApiAccess"));
        setSavingId(null);
        return;
      }

      const nextSlug = editDraft.slug.trim();
      const nextTitle = editDraft.title.trim();
      const nextOrder = Number(editDraft.order);

      if (!nextSlug) {
        setSaveError(t(lang, "common", "adminCoursesCategoriesSlugRequired"));
        setSavingId(null);
        return;
      }

      if (!nextTitle) {
        setSaveError(t(lang, "common", "adminCoursesCategoriesTitleRequired"));
        setSavingId(null);
        return;
      }

      if (
        !editDraft.order.trim() ||
        !Number.isFinite(nextOrder) ||
        !Number.isInteger(nextOrder) ||
        nextOrder < 0
      ) {
        setSaveError(t(lang, "common", "adminCoursesCategoriesOrderInvalid"));
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
        setSaveSuccess(t(lang, "common", "adminCoursesCategoriesNoChanges"));
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
        setSaveError(
          msg || t(lang, "common", "adminCoursesCategoriesSaveError"),
        );
        setSavingId(null);
        return;
      }

      const updated = (await res.json()) as CourseCategory;
      setCategories((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      setSaveSuccess(t(lang, "common", "adminCoursesCategoriesSaved"));
      setSavingId(null);
      cancelEdit();
    } catch {
      setSaveError(t(lang, "common", "adminCoursesCategoriesSaveError"));
      setSavingId(null);
    }
  };

  const deleteCategory = async (c: CourseCategory) => {
    if (typeof window === "undefined") return;

    const ok = window.confirm(
      `${t(lang, "common", "adminCoursesCategoriesDeleteConfirmPrefix")} "${c.title}"? ${t(
        lang,
        "common",
        "adminCoursesCategoriesDeleteConfirmSuffix",
      )}`,
    );
    if (!ok) return;

    setSaveError(null);
    setSaveSuccess(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeletingId(c.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setDeleteError(t(lang, "common", "adminErrorMissingApiAccess"));
        setDeletingId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/course-categories/${encodeURIComponent(c.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setDeleteError(
          msg || t(lang, "common", "adminCoursesCategoriesDeleteError"),
        );
        setDeletingId(null);
        return;
      }

      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      if (editingId === c.id) {
        cancelEdit();
      }
      setDeleteSuccess(t(lang, "common", "adminCoursesCategoriesDeleted"));
      setDeletingId(null);
    } catch {
      setDeleteError(t(lang, "common", "adminCoursesCategoriesDeleteError"));
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <AdminBreadcrumbs
          items={[
            { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
            {
              label: t(lang, "common", "adminDashboardTabCourses"),
              href: "/admin/courses",
            },
            { label: t(lang, "common", "adminCoursesCategoriesTitle") },
          ]}
          className="text-[color:var(--foreground)] opacity-70"
        />
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            {t(lang, "common", "adminCoursesCategoriesCreateTitle")}
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-[color:var(--primary)] hover:opacity-90 hover:underline"
            onClick={() => void load()}
          >
            {t(lang, "common", "adminCoursesCategoriesReload")}
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminCoursesCategoriesSlugLabel")}
                </span>
                <InfoTooltip
                  label={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesInfoTooltipLabel",
                  )}
                  title={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesSlugHelpTitle",
                  )}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesSlugHelpDescription",
                  )}
                />
              </span>
              <input
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder={t(
                  lang,
                  "common",
                  "adminCoursesCategoriesSlugPlaceholder",
                )}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminCoursesCategoriesNameLabel")}
                </span>
                <InfoTooltip
                  label={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesInfoTooltipLabel",
                  )}
                  title={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesTitleHelpTitle",
                  )}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesTitleHelpDescription",
                  )}
                />
              </span>
              <input
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder={t(
                  lang,
                  "common",
                  "adminCoursesCategoriesNamePlaceholder",
                )}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminCoursesCategoriesOrderLabel")}
                </span>
                <InfoTooltip
                  label={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesInfoTooltipLabel",
                  )}
                  title={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesOrderHelpTitle",
                  )}
                  description={t(
                    lang,
                    "common",
                    "adminCoursesCategoriesOrderHelpDescription",
                  )}
                />
              </span>
              <input
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)] placeholder:opacity-50 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                value={form.order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, order: e.target.value }))
                }
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label className="flex items-center gap-2 rounded-md border border-[color:var(--border)] px-3 py-2">
              <StyledCheckbox
                checked={form.active}
                ariaLabel={t(
                  lang,
                  "common",
                  "adminCoursesCategoriesActiveLabel",
                )}
                onChange={(checked) =>
                  setForm((p) => ({ ...p, active: checked }))
                }
                size="lg"
              />
              <span className="text-sm text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminCoursesCategoriesActiveLabel")}
              </span>
            </label>
          </div>

          {createError && (
            <div
              className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]"
              role="alert"
            >
              {createError}
            </div>
          )}

          {createSuccess && (
            <div
              className="rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--primary)]"
              role="status"
            >
              {createSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center rounded-lg border border-[color:var(--primary)] bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {creating
              ? t(lang, "common", "adminCoursesCategoriesCreating")
              : t(lang, "common", "adminCoursesCategoriesCreate")}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            {t(lang, "common", "adminCoursesCategoriesListTitle")}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="be-btn-ghost rounded-lg border px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              onClick={exportCsv}
              disabled={totalCount === 0}
            >
              {t(lang, "common", "adminCoursesCategoriesExportCsv")}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-[color:var(--primary)] hover:opacity-90 hover:underline"
              onClick={() => void load()}
            >
              {t(lang, "common", "adminCoursesCategoriesReload")}
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-60">
            {t(lang, "common", "adminCoursesCategoriesLoading")}
          </p>
        )}

        {!loading && error && (
          <div
            className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <p className="mt-3 text-sm text-[color:var(--foreground)] opacity-70">
            {t(lang, "common", "adminCoursesCategoriesEmpty")}
          </p>
        )}

        {saveError && (
          <div
            className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]"
            role="alert"
          >
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div
            className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--primary)]"
            role="status"
          >
            {saveSuccess}
          </div>
        )}

        {deleteError && (
          <div
            className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--error)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--error)]"
            role="alert"
          >
            {deleteError}
          </div>
        )}

        {deleteSuccess && (
          <div
            className="mt-3 rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_14%,var(--card))] px-4 py-3 text-sm text-[color:var(--primary)]"
            role="status"
          >
            {deleteSuccess}
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                <tr>
                  <th className="px-2 py-2">
                    {t(lang, "common", "adminCoursesCategoriesTableTitle")}
                  </th>
                  <th className="px-2 py-2">
                    {t(lang, "common", "adminCoursesCategoriesTableSlug")}
                  </th>
                  <th className="px-2 py-2">
                    {t(lang, "common", "adminCoursesCategoriesTableOrder")}
                  </th>
                  <th className="px-2 py-2">
                    {t(lang, "common", "adminCoursesCategoriesTableActive")}
                  </th>
                  <th className="px-2 py-2">
                    {t(lang, "common", "adminCoursesCategoriesTableActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {pageItems.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,var(--card))]"
                    >
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-sm text-[color:var(--foreground)]"
                            value={editDraft?.title ?? ""}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, title: e.target.value } : p,
                              )
                            }
                          />
                        ) : (
                          <span className="font-medium text-[color:var(--foreground)]">
                            {c.title}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-sm text-[color:var(--foreground)]"
                            value={editDraft?.slug ?? ""}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, slug: e.target.value } : p,
                              )
                            }
                          />
                        ) : (
                          <span className="text-[color:var(--foreground)] opacity-80">
                            {c.slug}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <input
                            className="w-24 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-sm text-[color:var(--foreground)]"
                            value={editDraft?.order ?? "0"}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, order: e.target.value } : p,
                              )
                            }
                            inputMode="numeric"
                          />
                        ) : (
                          <span className="text-[color:var(--foreground)] opacity-80">
                            {c.order}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <StyledCheckbox
                            checked={!!editDraft?.active}
                            ariaLabel={`${t(
                              lang,
                              "common",
                              "adminCoursesCategoriesActiveLabel",
                            )} ${c.title}`}
                            onChange={(checked) =>
                              setEditDraft((p) =>
                                p ? { ...p, active: checked } : p,
                              )
                            }
                            size="lg"
                          />
                        ) : (
                          <span className="text-[color:var(--foreground)] opacity-80">
                            {c.active
                              ? t(lang, "common", "adminCoursesCategoriesYes")
                              : t(lang, "common", "adminCoursesCategoriesNo")}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-sm font-medium text-[color:var(--primary)] hover:opacity-90 disabled:opacity-60"
                              disabled={savingId === c.id}
                              onClick={() => void saveEdit(c)}
                            >
                              {savingId === c.id
                                ? t(
                                    lang,
                                    "common",
                                    "adminCoursesCategoriesSaving",
                                  )
                                : t(
                                    lang,
                                    "common",
                                    "adminCoursesCategoriesSave",
                                  )}
                            </button>
                            <button
                              type="button"
                              className="text-sm text-[color:var(--foreground)] opacity-70 hover:opacity-90"
                              disabled={savingId === c.id}
                              onClick={() => cancelEdit()}
                            >
                              {t(
                                lang,
                                "common",
                                "adminCoursesCategoriesCancel",
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-sm font-medium text-[color:var(--primary)] hover:opacity-90"
                              disabled={deletingId === c.id}
                              onClick={() => startEdit(c)}
                            >
                              {t(lang, "common", "adminCoursesCategoriesEdit")}
                            </button>
                            <button
                              type="button"
                              className="text-sm font-medium text-[color:var(--error)] hover:opacity-90 disabled:opacity-60"
                              disabled={deletingId === c.id}
                              onClick={() => void deleteCategory(c)}
                            >
                              {deletingId === c.id
                                ? t(
                                    lang,
                                    "common",
                                    "adminCoursesCategoriesDeleting",
                                  )
                                : t(
                                    lang,
                                    "common",
                                    "adminCoursesCategoriesDelete",
                                  )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] px-3 py-3 text-xs text-[color:var(--foreground)] opacity-80 md:text-sm">
              <p>
                {t(lang, "common", "adminCoursesCategoriesShowingPrefix")}{" "}
                <span className="font-semibold">{showingFrom}</span>-
                <span className="font-semibold">{showingTo}</span>{" "}
                {t(lang, "common", "adminCoursesCategoriesShowingOf")}{" "}
                <span className="font-semibold">{totalCount}</span>{" "}
                {t(lang, "common", "adminCoursesCategoriesShowingSuffix")}
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
