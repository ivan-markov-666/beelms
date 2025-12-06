"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

type MediaItem = {
  filename: string;
  url: string;
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
  const [lastSavedForm, setLastSavedForm] = useState<FormState | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
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

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        if (typeof window === "undefined") {
          return;
        }

        const token = window.localStorage.getItem("qa4free_access_token");
        if (!token) {
          if (!cancelled) {
            setError(
              "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
            );
            setLoading(false);
          }
          return;
        }

        const langToLoad = currentLanguage;
        let url = `${ADMIN_API_BASE_URL}/admin/wiki/articles/by-slug/${encodeURIComponent(
          slug,
        )}`;
        if (langToLoad) {
          url += `?lang=${encodeURIComponent(langToLoad)}`;
        }

        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (cancelled) {
          return;
        }

        if (res.status === 404) {
          if (langToLoad) {
            const emptyForm: FormState = {
              language: langToLoad,
              title: "",
              content: "",
              status: "draft",
            };
            setForm(emptyForm);
            setLastSavedForm(null);
            setLoading(false);
            return;
          }

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
        const loadedForm: FormState = {
          language: data.language ?? currentLanguage ?? "bg",
          title: data.title ?? "",
          content: data.content ?? "",
          status: data.status ?? "draft",
        };
        setForm(loadedForm);
        setLastSavedForm(loadedForm);
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
  }, [slug, currentLanguage]);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("qa4free_access_token");
    if (!token) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setMediaLoading(true);
      setMediaError(null);
      setCopyMessage(null);

      try {
        const res = await fetch(
          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
            articleId,
          )}/media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (!res.ok) {
          if (!cancelled) {
            setMediaError("Възникна грешка при зареждане на изображенията.");
            setMediaLoading(false);
          }
          return;
        }

        const data = (await res.json()) as MediaItem[];

        if (cancelled) {
          return;
        }

        setMediaItems(Array.isArray(data) ? data : []);
        setMediaLoading(false);
      } catch {
        if (!cancelled) {
          setMediaError("Възникна грешка при зареждане на изображенията.");
          setMediaLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

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

  const handleChangeLanguage = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newLang = event.target.value;
    setForm((current) =>
      current
        ? { ...current, language: newLang }
        : { language: newLang, title: "", content: "", status: "draft" },
    );
    setCurrentLanguage(newLang);
  };

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

  const isDirty =
    !!form &&
    (!lastSavedForm ||
      form.language !== lastSavedForm.language ||
      form.title !== lastSavedForm.title ||
      form.content !== lastSavedForm.content ||
      form.status !== lastSavedForm.status);

  const isContentDirty =
    !!form && (!lastSavedForm || form.content !== lastSavedForm.content);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isContentDirty || !articleId || !form) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("qa4free_access_token");
    if (!token) {
      return;
    }

    if (form.status !== "draft") {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
            articleId,
          )}/draft-autosave`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              language: form.language,
              title: form.title,
              content: form.content,
            }),
          },
        );

        if (!res.ok) {
          return;
        }

        setLastSavedForm(form);
      } catch {
        return;
      }
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isContentDirty, articleId, form]);

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

      const savedForm: FormState = {
        language: updated.language ?? form.language,
        title: updated.title ?? form.title,
        content: updated.content ?? form.content,
        status: updated.status ?? form.status,
      };

      setForm(savedForm);
      setLastSavedForm(savedForm);
      setSuccess("Промените са запазени успешно.");
      setVersionsReloadKey((value) => value + 1);
      setSaving(false);
    } catch {
      setError("Възникна грешка при запис на промените.");
      setSaving(false);
    }
  };

  const handleUploadClick = () => {
    if (!articleId) {
      setError("Липсва Article ID. Моля, заредете отново страницата.");
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    if (!articleId) {
      setError("Липсва Article ID. Моля, заредете отново страницата.");
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("qa4free_access_token");
    if (!token) {
      setError(
        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
      );
      return;
    }

    const file = files[0];

    setUploading(true);
    setMediaError(null);
    setCopyMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          articleId,
        )}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!res.ok) {
        setMediaError("Възникна грешка при качване на изображението.");
        setUploading(false);
        return;
      }
      try {
        const listRes = await fetch(
          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
            articleId,
          )}/media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (listRes.ok) {
          const data = (await listRes.json()) as MediaItem[];
          setMediaItems(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore reload errors here, main upload already succeeded
      }
      setUploading(false);
    } catch {
      setMediaError("Възникна грешка при качване на изображението.");
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (filename: string) => {
    if (!articleId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("qa4free_access_token");
    if (!token) {
      setError(
        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
      );
      return;
    }

    setMediaError(null);
    setCopyMessage(null);

    try {
      const res = await fetch(
        `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          articleId,
        )}/media/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok && res.status !== 404) {
        setMediaError("Възникна грешка при изтриване на изображението.");
        return;
      }
      try {
        const listRes = await fetch(
          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
            articleId,
          )}/media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (listRes.ok) {
          const data = (await listRes.json()) as MediaItem[];
          setMediaItems(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore reload errors here
      }
    } catch {
      setMediaError("Възникна грешка при изтриване на изображението.");
    }
  };

  const handleCopyMarkdown = async (item: MediaItem) => {
    const markdownSnippet = `![image](${item.url})`;

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        setCopyMessage("Clipboard API не е наличен в този браузър.");
        return;
      }

      await navigator.clipboard.writeText(markdownSnippet);
      setCopyMessage("Markdown snippet е копиран в клипборда.");
    } catch {
      setCopyMessage("Неуспешно копиране на markdown snippet.");
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

      setForm((current) => {
        const restoredForm: FormState = {
          language: updated.language ?? current?.language ?? "bg",
          title: updated.title ?? current?.title ?? "",
          content: updated.content ?? current?.content ?? "",
          status: updated.status ?? current?.status ?? "draft",
        };
        setLastSavedForm(restoredForm);
        return restoredForm;
      });
      setSuccess("Статията беше върната към избраната версия.");
      setRollbackVersionId(null);
      setVersionsReloadKey((value) => value + 1);
    } catch {
      setError("Възникна грешка при връщане към избраната версия.");
      setRollbackVersionId(null);
    }
  };

  const latestVersionIdsByLang: Record<string, string> = {};
  for (const v of versions) {
    if (!latestVersionIdsByLang[v.language]) {
      latestVersionIdsByLang[v.language] = v.id;
    }
  }

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
          className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
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
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
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
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={form.language}
                  onChange={handleChangeLanguage}
                >
                  <option value="bg">bg</option>
                  <option value="en">en</option>
                  <option value="de">de</option>
                </select>
                <p className="text-xs text-zinc-500">
                  Смяната на езика зарежда или създава отделна версия на
                  съдържанието за избрания език.
                </p>
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
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                className="block min-h-[200px] w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={form.content}
                onChange={handleChange("content")}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/admin/wiki"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                onClick={(event) => {
                  if (!isDirty) {
                    return;
                  }

                  const confirmed = window.confirm(
                    "Имате незапазени промени. Сигурни ли сте, че искате да напуснете страницата?",
                  );
                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                Отказ
              </Link>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Запазване..." : "Запази"}
              </button>
            </div>
            {isDirty && (
              <p className="pt-1 text-right text-xs text-zinc-500">
                Има незапазени промени.
              </p>
            )}
          </form>

          <section
            aria-label="Изображения към статията"
            className="border-t border-zinc-200 pt-4"
          >
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Изображения към статията
            </h3>
            <p className="mb-3 text-xs text-zinc-600">
              Качете изображения, които искате да реферирате от markdown
              съдържанието по-горе. След качване ще видите готов URL, който
              може да поставите директно в текста.
            </p>

            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading || !articleId}
                className="inline-flex items-center rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? "Качване..." : "Upload image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              <span className="text-xs text-zinc-500">
                Първо се уверете, че статията е запазена и има Article ID.
              </span>
            </div>

            {mediaLoading && (
              <p className="text-xs text-zinc-600">Зареждане на изображения...</p>
            )}
            {mediaError && !mediaLoading && (
              <p className="text-xs text-red-600" role="alert">
                {mediaError}
              </p>
            )}
            {copyMessage && (
              <p className="text-xs text-green-700" role="status">
                {copyMessage}
              </p>
            )}

            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">
                  Uploaded images
                </span>
              </div>
              {articleId == null ? (
                <p className="text-xs text-zinc-500">
                  Все още няма Article ID. Заредете статията отново или изчакайте
                  да се зареди напълно.
                </p>
              ) : mediaItems.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Все още няма качени изображения за тази статия.
                </p>
              ) : (
                <ul className="space-y-1 text-[11px] font-mono text-zinc-700">
                  {mediaItems.map((item) => (
                    <li
                      key={item.filename}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="break-all">{item.url}</span>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMarkdown(item)}
                          className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-900"
                        >
                          Copy markdown
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.filename)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

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
                          {latestVersionIdsByLang[version.language] ===
                          version.id ? (
                            <span className="text-xs font-semibold text-zinc-500">
                              Текуща версия
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRollback(version.id)}
                              disabled={rollbackVersionId === version.id}
                              className="text-sm font-medium text-green-700 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {rollbackVersionId === version.id
                                ? "Връщане..."
                                : "Върни"}
                            </button>
                          )}
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
