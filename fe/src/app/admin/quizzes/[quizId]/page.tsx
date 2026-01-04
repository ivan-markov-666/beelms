"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";

const API_BASE_URL = getApiBaseUrl();

type AdminQuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  order: number;
};

type AdminQuiz = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: string;
  passingScore: number | null;
  questions: AdminQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

type QuizEditForm = {
  title: string;
  description: string;
  language: string;
  status: string;
  passingScore: string;
};

type QuestionCreateForm = {
  text: string;
  optionsText: string;
  correctOptionIndex: string;
  order: string;
};

function parseOptions(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !!line);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {}

  return "Request failed";
}

export default function AdminQuizDetailPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params?.quizId;

  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<QuizEditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Админ табло", href: "/admin" },
      { label: "Quizzes", href: "/admin/quizzes" },
      { label: quiz?.title ?? "Quiz details" },
    ],
    [quiz?.title],
  );

  const [deleting, setDeleting] = useState(false);

  const [questionForm, setQuestionForm] = useState<QuestionCreateForm>({
    text: "",
    optionsText: "",
    correctOptionIndex: "0",
    order: "",
  });
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionSuccess, setQuestionSuccess] = useState<string | null>(null);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState<QuestionCreateForm | null>(null);
  const [questionActionBusyId, setQuestionActionBusyId] = useState<
    string | null
  >(null);

  const sortedQuestions = useMemo(() => {
    const list = quiz?.questions ?? [];
    return list.slice().sort((a, b) => a.order - b.order);
  }, [quiz]);

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

      if (!quizId) {
        setError("Missing quizId");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(quizId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        setError("Възникна грешка при зареждане на quiz.");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminQuiz;
      setQuiz(data);
      setForm({
        title: data.title,
        description: data.description ?? "",
        language: data.language,
        status: data.status,
        passingScore:
          typeof data.passingScore === "number"
            ? String(data.passingScore)
            : "",
      });

      setLoading(false);
    } catch {
      setError("Възникна грешка при зареждане на quiz.");
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const isDirty = useMemo(() => {
    if (!quiz || !form) return false;

    const nextPassingRaw = form.passingScore.trim();
    const currentPassing =
      typeof quiz.passingScore === "number" ? quiz.passingScore : null;
    const nextPassing = nextPassingRaw ? Number(nextPassingRaw) : null;

    return (
      form.title.trim() !== quiz.title ||
      form.description.trim() !== (quiz.description ?? "") ||
      form.language !== quiz.language ||
      form.status !== quiz.status ||
      (Number.isFinite(nextPassing) ? nextPassing : null) !== currentPassing
    );
  }, [quiz, form]);

  const save = async () => {
    if (typeof window === "undefined") return;
    if (!quizId || !quiz || !form) return;

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
      const nextDescription = form.description.trim();

      if (nextTitle && nextTitle !== quiz.title) payload.title = nextTitle;
      if (nextDescription !== (quiz.description ?? "")) {
        payload.description = nextDescription || null;
      }
      if (form.language !== quiz.language) payload.language = form.language;
      if (form.status !== quiz.status) payload.status = form.status;

      const passingRaw = form.passingScore.trim();
      if (passingRaw !== "") {
        const nextPassing = Number(passingRaw);
        if (!Number.isFinite(nextPassing) || nextPassing < 0) {
          setSaveError("passingScore трябва да е число >= 0.");
          setSaving(false);
          return;
        }
        if (nextPassing !== (quiz.passingScore ?? null)) {
          payload.passingScore = nextPassing;
        }
      } else if (quiz.passingScore !== null) {
        payload.passingScore = null;
      }

      if (Object.keys(payload).length === 0) {
        setSaveSuccess("Няма промени за запис.");
        setSaving(false);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(quizId)}`,
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
        setSaving(false);
        return;
      }

      const updated = (await res.json()) as AdminQuiz;
      setQuiz(updated);
      setForm({
        title: updated.title,
        description: updated.description ?? "",
        language: updated.language,
        status: updated.status,
        passingScore:
          typeof updated.passingScore === "number"
            ? String(updated.passingScore)
            : "",
      });
      setSaveSuccess("Записано.");
      setSaving(false);
    } catch {
      setSaveError("Неуспешен запис.");
      setSaving(false);
    }
  };

  const deleteQuiz = async () => {
    if (typeof window === "undefined") return;
    if (!quizId) return;

    const ok = window.confirm("Сигурен ли си, че искаш да изтриеш този quiz?");
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

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(quizId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setDeleteError(msg || "Неуспешно изтриване.");
        setDeleting(false);
        return;
      }

      window.location.href = "/admin/quizzes";
    } catch {
      setDeleteError("Неуспешно изтриване.");
      setDeleting(false);
    }
  };

  const addQuestion = async () => {
    if (typeof window === "undefined") return;
    if (!quizId) return;

    setQuestionError(null);
    setQuestionSuccess(null);
    setQuestionSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setQuestionError("Липсва достъп до Admin API.");
        setQuestionSaving(false);
        return;
      }

      const text = questionForm.text.trim();
      const options = parseOptions(questionForm.optionsText);
      const correctOptionIndex = Number(questionForm.correctOptionIndex);
      const maybeOrder = Number(questionForm.order);

      if (!text) {
        setQuestionError("Question text is required.");
        setQuestionSaving(false);
        return;
      }
      if (options.length < 2) {
        setQuestionError("Нужни са поне 2 options (по един ред). ");
        setQuestionSaving(false);
        return;
      }
      if (
        !Number.isFinite(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        setQuestionError("correctOptionIndex е извън диапазон.");
        setQuestionSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        text,
        options,
        correctOptionIndex,
      };

      if (
        questionForm.order.trim() &&
        Number.isFinite(maybeOrder) &&
        maybeOrder > 0
      ) {
        payload.order = maybeOrder;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(quizId)}/questions`,
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
        setQuestionError(msg || "Неуспешно добавяне на въпрос.");
        setQuestionSaving(false);
        return;
      }

      const updated = (await res.json()) as AdminQuiz;
      setQuiz(updated);
      setQuestionForm({
        text: "",
        optionsText: "",
        correctOptionIndex: "0",
        order: "",
      });
      setQuestionSuccess("Добавено.");
      setQuestionSaving(false);
    } catch {
      setQuestionError("Неуспешно добавяне на въпрос.");
      setQuestionSaving(false);
    }
  };

  const startEditQuestion = (q: AdminQuizQuestion) => {
    setQuestionError(null);
    setQuestionSuccess(null);
    setEditingQuestionId(q.id);
    setEditDraft({
      text: q.text,
      optionsText: q.options.join("\n"),
      correctOptionIndex: String(q.correctOptionIndex),
      order: String(q.order),
    });
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditDraft(null);
  };

  const saveQuestion = async (q: AdminQuizQuestion) => {
    if (typeof window === "undefined") return;
    if (!quizId || !editDraft) return;

    setQuestionError(null);
    setQuestionSuccess(null);
    setQuestionActionBusyId(q.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setQuestionError("Липсва достъп до Admin API.");
        setQuestionActionBusyId(null);
        return;
      }

      const text = editDraft.text.trim();
      const options = parseOptions(editDraft.optionsText);
      const correctOptionIndex = Number(editDraft.correctOptionIndex);
      const maybeOrder = Number(editDraft.order);

      if (!text) {
        setQuestionError("Question text is required.");
        setQuestionActionBusyId(null);
        return;
      }
      if (options.length < 2) {
        setQuestionError("Нужни са поне 2 options (по един ред). ");
        setQuestionActionBusyId(null);
        return;
      }
      if (
        !Number.isFinite(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        setQuestionError("correctOptionIndex е извън диапазон.");
        setQuestionActionBusyId(null);
        return;
      }

      if (!Number.isFinite(maybeOrder) || maybeOrder <= 0) {
        setQuestionError("order трябва да е число > 0.");
        setQuestionActionBusyId(null);
        return;
      }

      const payload = {
        text,
        options,
        correctOptionIndex,
        order: maybeOrder,
      };

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(
          quizId,
        )}/questions/${encodeURIComponent(q.id)}`,
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
        setQuestionError(msg || "Неуспешно записване.");
        setQuestionActionBusyId(null);
        return;
      }

      const updated = (await res.json()) as AdminQuiz;
      setQuiz(updated);
      setQuestionSuccess("Записано.");
      setQuestionActionBusyId(null);
      cancelEditQuestion();
    } catch {
      setQuestionError("Неуспешно записване.");
      setQuestionActionBusyId(null);
    }
  };

  const deleteQuestion = async (q: AdminQuizQuestion) => {
    if (typeof window === "undefined") return;
    if (!quizId) return;

    const ok = window.confirm(
      `Сигурен ли си, че искаш да изтриеш този въпрос?`,
    );
    if (!ok) return;

    setQuestionError(null);
    setQuestionSuccess(null);
    setQuestionActionBusyId(q.id);

    try {
      const token = getAccessToken();
      if (!token) {
        setQuestionError("Липсва достъп до Admin API.");
        setQuestionActionBusyId(null);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/quizzes/${encodeURIComponent(
          quizId,
        )}/questions/${encodeURIComponent(q.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const msg = await readErrorMessage(res);
        setQuestionError(msg || "Неуспешно изтриване.");
        setQuestionActionBusyId(null);
        return;
      }

      await load();
      setQuestionSuccess("Изтрито.");
      setQuestionActionBusyId(null);
      cancelEditQuestion();
    } catch {
      setQuestionError("Неуспешно изтриване.");
      setQuestionActionBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-gray-500">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz || error) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumbs items={breadcrumbItems} />
        <p className="text-sm text-red-700">{error ?? "Quiz not found"}</p>
        <Link
          href="/admin/quizzes"
          className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={breadcrumbItems} />

      <section className="space-y-3">
        <Link
          href="/admin/quizzes"
          className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          ← Back to quizzes
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {quiz.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {quiz.description ?? "(no description)"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {quiz.language}
            </span>
            <span className="rounded bg-gray-100 px-2 py-1">{quiz.status}</span>
            <span className="rounded bg-gray-100 px-2 py-1">
              passingScore: {quiz.passingScore ?? "-"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Quiz settings</h2>
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
              onClick={() => void deleteQuiz()}
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
              value={form.title}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, title: e.target.value } : p))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Language</span>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              value={form.language}
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
              value={form.status}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, status: e.target.value } : p))
              }
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Passing score
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={form.passingScore}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, passingScore: e.target.value } : p))
              }
              inputMode="numeric"
              placeholder="(empty = null)"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-medium text-gray-600">Description</span>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((p) => (p ? { ...p, description: e.target.value } : p))
            }
          />
        </label>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-900"
            onClick={() => void load()}
          >
            Reload
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Question text
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={questionForm.text}
              onChange={(e) =>
                setQuestionForm((p) => ({ ...p, text: e.target.value }))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Correct option index
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={questionForm.correctOptionIndex}
              onChange={(e) =>
                setQuestionForm((p) => ({
                  ...p,
                  correctOptionIndex: e.target.value,
                }))
              }
              inputMode="numeric"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Options (one per line)
            </span>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              rows={4}
              value={questionForm.optionsText}
              onChange={(e) =>
                setQuestionForm((p) => ({ ...p, optionsText: e.target.value }))
              }
              placeholder="Option 0\nOption 1\nOption 2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Order (optional)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              value={questionForm.order}
              onChange={(e) =>
                setQuestionForm((p) => ({ ...p, order: e.target.value }))
              }
              inputMode="numeric"
              placeholder="e.g. 1"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
              disabled={questionSaving}
              onClick={() => void addQuestion()}
            >
              {questionSaving ? "Adding..." : "Add question"}
            </button>
          </div>
        </div>

        {questionError && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {questionError}
          </div>
        )}

        {questionSuccess && (
          <div
            className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {questionSuccess}
          </div>
        )}

        {sortedQuestions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No questions.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {sortedQuestions.map((q) => {
              const isEditing = editingQuestionId === q.id;
              const draft = isEditing ? editDraft : null;

              return (
                <li
                  key={q.id}
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3"
                >
                  {isEditing && draft ? (
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">
                            Question text
                          </span>
                          <input
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                            value={draft.text}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, text: e.target.value } : p,
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
                            inputMode="numeric"
                          />
                        </label>
                      </div>

                      <label className="space-y-1">
                        <span className="text-[11px] font-medium text-gray-600">
                          Options (one per line)
                        </span>
                        <textarea
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                          rows={3}
                          value={draft.optionsText}
                          onChange={(e) =>
                            setEditDraft((p) =>
                              p ? { ...p, optionsText: e.target.value } : p,
                            )
                          }
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] font-medium text-gray-600">
                          Correct option index
                        </span>
                        <input
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                          value={draft.correctOptionIndex}
                          onChange={(e) =>
                            setEditDraft((p) =>
                              p
                                ? {
                                    ...p,
                                    correctOptionIndex: e.target.value,
                                  }
                                : p,
                            )
                          }
                          inputMode="numeric"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={questionActionBusyId === q.id}
                          onClick={() => void saveQuestion(q)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={questionActionBusyId === q.id}
                          onClick={() => cancelEditQuestion()}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {q.order}. {q.text}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          correct: {q.correctOptionIndex}
                        </p>
                        <ol className="mt-2 list-decimal pl-5 text-xs text-gray-700">
                          {q.options.map((opt, idx) => (
                            <li
                              key={`${q.id}-${idx}`}
                              className={
                                idx === q.correctOptionIndex
                                  ? "font-semibold text-green-800"
                                  : ""
                              }
                            >
                              {opt}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          disabled={!!editingQuestionId}
                          onClick={() => startEditQuestion(q)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                          disabled={questionActionBusyId === q.id}
                          onClick={() => void deleteQuestion(q)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
