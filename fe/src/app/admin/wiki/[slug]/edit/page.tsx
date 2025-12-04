"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/_?api$/, "")
  : "http://localhost:3000";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type WikiArticleDetail = {
  id: string;
  slug: string;
  language: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
};

type FormState = {
  language: string;
  title: string;
  content: string;
  status: string;
};

type AdminWikiArticleVersion = {
  id: string;
  version: number;
  language: string;
  title: string;
  createdAt: string;
  createdBy: string | null;
};

function formatDateTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateIso;
  }
}

export default function AdminWikiEditPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [articleId, setArticleId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [versions, setVersions] = useState<AdminWikiArticleVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(
    null,
  );
  const [versionsReloadKey, setVersionsReloadKey] = useState(0);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const res = await fetch(
          `${PUBLIC_API_BASE_URL}/api/wiki/articles/${encodeURIComponent(
            slug,
          )}`,
          {
            cache: "no-store",
          },
        );

        if (cancelled) {
          return;
        }

        if (res.status === 404) {
          setError("Статията не е намерена.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(
            "Възникна грешка при зареждане на статията за редакция.",
          );
          setLoading(false);
          return;
        }

        const data = (await res.json()) as WikiArticleDetail;

        setArticleId(data.id);
        setForm({
          language: data.language ?? "bg",
          title: data.title ?? "",
          content: data.content ?? "",
          status: data.status ?? "draft",
        });
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при зареждане на статията за редакция.");
          setLoading(false);
        }
      }
    };

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let cancelled = false;

    const loadVersions = async () => {
      setVersionsLoading(true);
      setVersionsError(null);

      try {
        const token = window.localStorage.getItem("qa4free_access_token");
        if (!token) {
          if (!cancelled) {
            setVersionsError(
              "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
            );
            setVersionsLoading(false);
          }
          return;
        }

        const res = await fetch(
          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
            articleId,
          )}/versions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          if (!cancelled) {
            setVersionsError(
              "Възникна грешка при зареждане на версиите.",
            );
            setVersionsLoading(false);
          }
          return;
        }

        const data = (await res.json()) as AdminWikiArticleVersion[];

        if (cancelled) {
          return;
        }

        setVersions(data ?? []);
        setVersionsLoading(false);
      } catch {
        if (!cancelled) {
          setVersionsError("Възникна грешка при зареждане на версиите.");
          setVersionsLoading(false);
        }
      }
    };

    void loadVersions();

    return () => {
      cancelled = true;
    };
  }, [articleId, versionsReloadKey]);

  const handleChange =
    (field: keyof FormState) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>,
    ) => {
      if (!form) return;
      setForm({ ...form, [field]: event.target.value });
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form || !articleId) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = window.localStorage.getItem("qa4free_access_token");
      if (!token) {
        setError(
          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
        );
        setSaving(false);
        return;
      }

      const res = await fetch(
        `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          articleId,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            language: form.language,
            title: form.title,
            content: form.content,
            status: form.status,
          }),
        },
      );

      if (res.status === 404) {
        setError("Статията не е намерена.");
        setSaving(false);
        return;
      }

      if (res.status === 400) {
        setError("Невалидни данни за статията. Моля, проверете полетата.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setError("Възникна грешка при запис на промените.");
        setSaving(false);
        return;
      }

      const updated = (await res.json()) as WikiArticleDetail;

      setForm({
        language: updated.language ?? form.language,
        title: updated.title ?? form.title,
        content: updated.content ?? form.content,
        status: updated.status ?? form.status,
      });
      setSuccess("Промените са запазени успешно.");
      setSaving(false);
    } catch {
      setError("Възникна грешка при запис на промените.");
      setSaving(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!articleId) {
      return;
    }

    const confirmed = window.confirm(
      "Сигурни ли сте, че искате да върнете статията към тази версия?",
    );
    if (!confirmed) {
      return;
    }

    setRollbackVersionId(versionId);
    setError(null);
    setSuccess(null);

    try {
      const token = window.localStorage.getItem("qa4free_access_token");
      if (!token) {
        setError(
          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
        );
        setRollbackVersionId(null);
        return;
      }

      const res = await fetch(
        `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          articleId,
        )}/versions/${encodeURIComponent(versionId)}/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 404) {
        setError("Избраната версия или статия не беше намерена.");
        setRollbackVersionId(null);
        return;
      }

      if (res.status === 400) {
        setError(
          "Невалидна заявка за връщане към версия. Моля, опитайте отново.",
        );
        setRollbackVersionId(null);
        return;
      }

      if (!res.ok) {
        setError("Възникна грешка при връщане към избраната версия.");
        setRollbackVersionId(null);
        return;
      }

      const updated = (await res.json()) as WikiArticleDetail;

      setForm((current) => ({
        language: updated.language ?? current?.language ?? "bg",
        title: updated.title ?? current?.title ?? "",
        content: updated.content ?? current?.content ?? "",
        status: updated.status ?? current?.status ?? "draft",
      }));
      setSuccess("Статията беше върната към избраната версия.");
      setRollbackVersionId(null);
      setVersionsReloadKey((value) => value + 1);
    } catch {
      setError("Възникна грешка при връщане към избраната версия.");
      setRollbackVersionId(null);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-zinc-900">
            Редакция на Wiki статия
          </h2>
          <p className="text-sm text-zinc-600">
            Преглед и редакция на съдържанието на избрана Wiki статия.
          </p>
        </div>
        <Link
          href="/admin/wiki"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          ← Назад към Admin Wiki
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-zinc-600">
          Зареждане на статията за редакция...
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && success && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {!loading && !error && form && (
        <div className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Език
                </label>
                <select
                  id="language"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={form.language}
                  onChange={handleChange("language")}
                >
                  <option value="bg">bg</option>
                  <option value="en">en</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Статус
                </label>
                <select
                  id="status"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={form.status}
                  onChange={handleChange("status")}
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zinc-800"
              >
                Заглавие
              </label>
              <input
                id="title"
                type="text"
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={form.title}
                onChange={handleChange("title")}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-zinc-800"
              >
                Съдържание
              </label>
              <textarea
                id="content"
                className="block min-h-[200px] w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={form.content}
                onChange={handleChange("content")}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/admin/wiki"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                Отказ
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Запазване..." : "Запази"}
              </button>
            </div>
          </form>

          <section
            aria-label="Версии на статията"
            className="border-t border-zinc-200 pt-4"
          >
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Версии на статията
            </h3>

            {versionsLoading && (
              <p className="text-sm text-zinc-600">
                Зареждане на версиите...
              </p>
            )}

            {!versionsLoading && versionsError && (
              <p className="text-sm text-red-600" role="alert">
                {versionsError}
              </p>
            )}

            {!versionsLoading && !versionsError && versions.length === 0 && (
              <p className="text-sm text-zinc-600">
                Няма налични версии за тази статия.
              </p>
            )}

            {!versionsLoading && !versionsError && versions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="mt-2 min-w-full table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-2 align-middle">Версия</th>
                      <th className="px-3 py-2 align-middle">Език</th>
                      <th className="px-3 py-2 align-middle">Заглавие</th>
                      <th className="px-3 py-2 align-middle">Създадена на</th>
                      <th className="px-3 py-2 align-middle">Създадена от</th>
                      <th className="px-3 py-2 align-middle text-right">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((version) => (
                      <tr
                        key={version.id}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                      >
                        <td className="px-3 py-2 align-middle text-zinc-900">
                          v{version.version}
                        </td>
                        <td className="px-3 py-2 align-middle text-zinc-900">
                          {version.language}
                        </td>
                        <td className="px-3 py-2 align-middle text-zinc-900">
                          {version.title}
                        </td>
                        <td className="px-3 py-2 align-middle text-zinc-700">
                          {formatDateTime(version.createdAt)}
                        </td>
                        <td className="px-3 py-2 align-middle text-zinc-700">
                          {version.createdBy ?? "—"}
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => handleRollback(version.id)}
                            disabled={rollbackVersionId === version.id}
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {rollbackVersionId === version.id
                              ? "Връщане..."
                              : "Върни"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
