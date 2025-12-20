"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAccessToken } from "../../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type CourseModuleItem = {
  id: string;
  itemType: "wiki" | "task" | "quiz";
  title: string;
  order: number;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  curriculum: CourseModuleItem[];
};

type CourseEditForm = {
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
};

type CreateCurriculumItemForm = {
  title: string;
  wikiSlug: string;
  order: string;
};

const DEFAULT_FORM: CreateCurriculumItemForm = {
  title: "",
  wikiSlug: "",
  order: "",
};

export default function AdminCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [curriculum, setCurriculum] = useState<CourseModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState<CourseEditForm | null>(null);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseSaveError, setCourseSaveError] = useState<string | null>(null);
  const [courseSaveSuccess, setCourseSaveSuccess] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<CreateCurriculumItemForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    wikiSlug: string;
    order: string;
  } | null>(null);

  const isCourseDirty = useMemo(() => {
    if (!course || !courseForm) return false;
    return (
      courseForm.title.trim() !== course.title ||
      courseForm.description.trim() !== course.description ||
      courseForm.language !== course.language ||
      courseForm.status !== course.status ||
      courseForm.isPaid !== course.isPaid
    );
  }, [course, courseForm]);

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

  const sortedCurriculum = useMemo(() => {
    return curriculum.slice().sort((a, b) => a.order - b.order);
  }, [curriculum]);

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

      if (!courseId) {
        setError("Missing courseId");
        setLoading(false);
        return;
      }

      const [detailRes, curriculumRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}/curriculum`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      if (!detailRes.ok) {
        setError("Възникна грешка при зареждане на курса.");
        setLoading(false);
        return;
      }

      const detail = (await detailRes.json()) as CourseDetail;
      setCourse(detail);
      setCourseForm({
        title: detail.title,
        description: detail.description,
        language: detail.language,
        status: detail.status,
        isPaid: !!detail.isPaid,
      });

      if (!curriculumRes.ok) {
        setCurriculum([]);
        setLoading(false);
        return;
      }

      const items = (await curriculumRes.json()) as CourseModuleItem[];
      setCurriculum(Array.isArray(items) ? items : []);
      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на курса.");
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const handleAddWikiItem = async () => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

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

      const payload: {
        itemType: "wiki";
        title: string;
        wikiSlug: string;
        order?: number;
      } = {
        itemType: "wiki",
        title: form.title.trim(),
        wikiSlug: form.wikiSlug.trim(),
      };

      const maybeOrder = Number(form.order);
      if (form.order.trim() && Number.isFinite(maybeOrder) && maybeOrder > 0) {
        payload.order = maybeOrder;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}/curriculum`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setSaveError(msg || "Неуспешно добавяне на curriculum item.");
        setSaving(false);
        return;
      }

      const created = (await res.json()) as CourseModuleItem;
      setCurriculum((prev) => [...prev, created]);
      setForm(DEFAULT_FORM);
      setSaveSuccess("Добавено.");
      setSaving(false);
    } catch {
      setSaveError("Неуспешно добавяне на curriculum item.");
      setSaving(false);
    }
  };

  const saveCourse = async () => {
    if (typeof window === "undefined") return;
    if (!courseId || !course || !courseForm) return;

    setCourseSaveError(null);
    setCourseSaveSuccess(null);
    setCourseSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setCourseSaveError("Липсва достъп до Admin API.");
        setCourseSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {};

      const nextTitle = courseForm.title.trim();
      const nextDescription = courseForm.description.trim();

      if (nextTitle !== course.title) {
        payload.title = nextTitle;
      }
      if (nextDescription !== course.description) {
        payload.description = nextDescription;
      }
      if (courseForm.language !== course.language) {
        payload.language = courseForm.language;
      }
      if (courseForm.status !== course.status) {
        payload.status = courseForm.status;
      }
      if (courseForm.isPaid !== course.isPaid) {
        payload.isPaid = courseForm.isPaid;
      }

      if (Object.keys(payload).length === 0) {
        setCourseSaveSuccess("Няма промени за запис.");
        setCourseSaving(false);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(courseId)}`,
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
        setCourseSaveError(msg || "Неуспешен запис.");
        setCourseSaving(false);
        return;
      }

      const updated = (await res.json()) as CourseDetail;
      setCourse(updated);
      setCurriculum(
        Array.isArray(updated.curriculum) ? updated.curriculum : [],
      );
      setCourseForm({
        title: updated.title,
        description: updated.description,
        language: updated.language,
        status: updated.status,
        isPaid: !!updated.isPaid,
      });
      setCourseSaveSuccess("Записано.");
      setCourseSaving(false);
    } catch {
      setCourseSaveError("Неуспешен запис.");
      setCourseSaving(false);
    }
  };

  const startEditItem = (item: CourseModuleItem) => {
    setActionError(null);
    setActionSuccess(null);
    setEditingItemId(item.id);
    setEditDraft({
      title: item.title,
      wikiSlug: item.wikiSlug ?? "",
      order: String(item.order),
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditDraft(null);
  };

  const saveEditItem = async (item: CourseModuleItem) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;
    if (!editDraft) return;

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError("Липсва достъп до Admin API.");
        setActionBusyId(null);
        return;
      }

      const payload: Record<string, unknown> = {};

      const nextTitle = editDraft.title.trim();
      const nextWikiSlug = editDraft.wikiSlug.trim();
      const nextOrder = Number(editDraft.order);

      if (nextTitle && nextTitle !== item.title) {
        payload.title = nextTitle;
      }

      if (item.itemType === "wiki") {
        if (nextWikiSlug && nextWikiSlug !== (item.wikiSlug ?? "")) {
          payload.wikiSlug = nextWikiSlug;
        }
      }

      if (
        Number.isFinite(nextOrder) &&
        nextOrder > 0 &&
        nextOrder !== item.order
      ) {
        payload.order = nextOrder;
      }

      if (Object.keys(payload).length === 0) {
        setActionSuccess("Няма промени за запис.");
        setActionBusyId(null);
        cancelEditItem();
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
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
        setActionError(msg || "Неуспешно записване.");
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess("Записано.");
      setActionBusyId(null);
      cancelEditItem();
    } catch {
      setActionError("Неуспешно записване.");
      setActionBusyId(null);
    }
  };

  const moveItem = async (item: CourseModuleItem, delta: -1 | 1) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    const targetOrder = item.order + delta;
    if (targetOrder < 1) {
      setActionBusyId(null);
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError("Липсва достъп до Admin API.");
        setActionBusyId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: targetOrder }),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setActionError(msg || "Неуспешно пренареждане.");
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess("Пренаредено.");
      setActionBusyId(null);
    } catch {
      setActionError("Неуспешно пренареждане.");
      setActionBusyId(null);
    }
  };

  const deleteItem = async (item: CourseModuleItem) => {
    if (typeof window === "undefined") return;
    if (!courseId) return;

    const ok = window.confirm(
      `Сигурен ли си, че искаш да изтриеш "${item.title}"?`,
    );
    if (!ok) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setActionBusyId(item.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setActionError("Липсва достъп до Admin API.");
        setActionBusyId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/courses/${encodeURIComponent(
          courseId,
        )}/curriculum/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setActionError(msg || "Неуспешно изтриване.");
        setActionBusyId(null);
        return;
      }

      await load();
      setActionSuccess("Изтрито.");
      setActionBusyId(null);
    } catch {
      setActionError("Неуспешно изтриване.");
      setActionBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-700">{error ?? "Course not found"}</p>
        <Link
          href="/admin/courses"
          className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Link
          href="/admin/courses"
          className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to courses
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{course.description}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.language}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.status}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">
              {course.isPaid ? "paid" : "free"}
            </span>
            {course.isPaid && course.priceCents && (
              <span className="rounded bg-gray-100 px-2 py-1">
                {(course.priceCents / 100).toFixed(2)} {(course.currency ?? "eur").toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Course settings
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-60"
            disabled={courseSaving || !isCourseDirty}
            onClick={() => void saveCourse()}
          >
            {courseSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {courseSaveError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {courseSaveError}
          </div>
        )}

        {courseSaveSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {courseSaveSuccess}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Title</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={courseForm?.title ?? ""}
              onChange={(e) =>
                setCourseForm((p) => (p ? { ...p, title: e.target.value } : p))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Language</span>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              value={courseForm?.language ?? "bg"}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, language: e.target.value } : p,
                )
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
              value={courseForm?.status ?? "draft"}
              onChange={(e) =>
                setCourseForm((p) => (p ? { ...p, status: e.target.value } : p))
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
              checked={courseForm?.isPaid ?? false}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, isPaid: e.target.checked } : p,
                )
              }
            />
            <span className="text-sm text-gray-700">Paid course</span>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Currency</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
              value={courseForm?.currency ?? ""}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, currency: e.target.value } : p,
                )
              }
              disabled={!(courseForm?.isPaid ?? false)}
              placeholder="eur"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Price (cents)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
              value={courseForm?.priceCents ?? ""}
              onChange={(e) =>
                setCourseForm((p) =>
                  p ? { ...p, priceCents: e.target.value } : p,
                )
              }
              disabled={!(courseForm?.isPaid ?? false)}
              inputMode="numeric"
              placeholder="999"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-medium text-gray-600">Description</span>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            rows={3}
            value={courseForm?.description ?? ""}
            onChange={(e) =>
              setCourseForm((p) =>
                p ? { ...p, description: e.target.value } : p,
              )
            }
          />
        </label>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Curriculum</h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Title</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Wiki slug</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.wikiSlug}
              onChange={(e) =>
                setForm((p) => ({ ...p, wikiSlug: e.target.value }))
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Order (optional)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.order}
              onChange={(e) =>
                setForm((p) => ({ ...p, order: e.target.value }))
              }
              placeholder="e.g. 1"
            />
          </label>
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

        <button
          type="button"
          className="mt-3 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
          disabled={
            saving ||
            !form.title.trim() ||
            !form.wikiSlug.trim() ||
            form.title.length < 1
          }
          onClick={() => void handleAddWikiItem()}
        >
          {saving ? "Adding..." : "Add wiki item"}
        </button>

        {actionError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {actionSuccess}
          </div>
        )}

        {sortedCurriculum.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No curriculum items.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {sortedCurriculum.map((item, idx) => {
              const isEditing = editingItemId === item.id;
              const draft = isEditing ? editDraft : null;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div>
                    {isEditing && draft ? (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">
                            Title
                          </span>
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                            value={draft.title}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, title: e.target.value } : p,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">
                            Order
                          </span>
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                            value={draft.order}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, order: e.target.value } : p,
                              )
                            }
                          />
                        </label>

                        {item.itemType === "wiki" ? (
                          <label className="space-y-1">
                            <span className="text-[11px] font-medium text-gray-600">
                              Wiki slug
                            </span>
                            <input
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                              value={draft.wikiSlug}
                              onChange={(e) =>
                                setEditDraft((p) =>
                                  p ? { ...p, wikiSlug: e.target.value } : p,
                                )
                              }
                            />
                          </label>
                        ) : (
                          <div />
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.order}. {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.itemType}
                          {item.wikiSlug ? ` • ${item.wikiSlug}` : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={actionBusyId === item.id}
                          onClick={() => void saveEditItem(item)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={actionBusyId === item.id}
                          onClick={() => cancelEditItem()}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        disabled={actionBusyId === item.id || !!editingItemId}
                        onClick={() => startEditItem(item)}
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      disabled={actionBusyId === item.id || idx === 0}
                      onClick={() => void moveItem(item, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      disabled={
                        actionBusyId === item.id ||
                        idx === sortedCurriculum.length - 1
                      }
                      onClick={() => void moveItem(item, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={actionBusyId === item.id}
                      onClick={() => void deleteItem(item)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
