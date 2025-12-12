"use client";

import { useEffect, useRef, useState } from "react";
import { diffWords, type Change } from "diff";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WikiMarkdown } from "../../../../wiki/_components/wiki-markdown";

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type WikiArticleDetail = {
  id: string;
  slug: string;
  language: string;
  title: string;
  subtitle?: string;
  content: string;
  status: string;
  articleStatus?: string;
  languageStatus?: string;
  updatedAt: string;
};

type FormState = {
  language: string;
  title: string;
  subtitle: string;
  content: string;
  status: string;
};

type AdminWikiArticleVersion = {
  id: string;
  version: number;
  language: string;
  title: string;
  subtitle?: string;
  content: string;
  createdAt: string;
  createdBy: string | null;
  status: string;
};

type MediaItem = {
  filename: string;
  url: string;
};

const VERSIONS_PAGE_SIZE = 10;

function normalizeMarkdownContent(raw: string): string {
  if (!raw) {
    return raw;
  }

  const trimmed = raw.trim();

  if (!trimmed.startsWith("```")) {
    return raw;
  }

  const match = trimmed.match(/^```([a-zA-Z0-9]*)\s+([\s\S]*?)\s*```$/);

  if (!match || match.length < 3) {
    return raw;
  }

  const fenceLang = match[1];
  const inner = match[2];

  if (fenceLang === "mermaid") {
    return raw;
  }

  return inner;
}

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

function renderDiff(oldText: string, newText: string) {
  const parts: Change[] = diffWords(oldText ?? "", newText ?? "");

  return (
    <>
      {parts.map((part: Change, index: number) => {
        const key = `${index}-${part.added ? "a" : part.removed ? "r" : "u"}`;

        if (part.added) {
          return (
            <span
              key={key}
              className="bg-green-100 text-green-800"
            >
              {part.value}
            </span>
          );
        }

        if (part.removed) {
          return (
            <span
              key={key}
              className="bg-red-100 text-red-800 line-through"
            >
              {part.value}
            </span>
          );
        }

        return <span key={key}>{part.value}</span>;
      })}
    </>
  );
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
  const [versionsPage, setVersionsPage] = useState(1);
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(
    null,
  );
  const [versionsReloadKey, setVersionsReloadKey] = useState(0);

  const [compareSelectionIds, setCompareSelectionIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<
    | {
        left: AdminWikiArticleVersion;
        right: AdminWikiArticleVersion;
      }
    | null
  >(null);

  const [deleteVersionStep1Id, setDeleteVersionStep1Id] = useState<string | null>(
    null,
  );
  const [deleteVersionStep2Id, setDeleteVersionStep2Id] = useState<string | null>(
    null,
  );
  const [deleteVersionSubmitting, setDeleteVersionSubmitting] = useState(false);
  const [deleteVersionError, setDeleteVersionError] = useState<string | null>(
    null,
  );
  const [selectedVersionIdsForDelete, setSelectedVersionIdsForDelete] =
    useState<string[]>([]);
  const [bulkDeleteStep1Open, setBulkDeleteStep1Open] = useState(false);
  const [bulkDeleteStep2Open, setBulkDeleteStep2Open] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [viewVersionId, setViewVersionId] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

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
              subtitle: "",
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
        const effectiveStatus = data.languageStatus ?? data.status ?? "draft";
        const loadedForm: FormState = {
          language: data.language ?? currentLanguage ?? "bg",
          title: data.title ?? "",
          subtitle: data.subtitle ?? "",
          content: data.content ?? "",
          status: effectiveStatus,
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
        : { language: newLang, title: "", subtitle: "", content: "", status: "draft" },
    );
    setCurrentLanguage(newLang);
    setVersionsPage(1);
    setCompareSelectionIds([]);
    setComparison(null);
    setCompareError(null);
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
      form.subtitle !== lastSavedForm.subtitle ||
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
              subtitle: form.subtitle,
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
            subtitle: form.subtitle,
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

      const effectiveStatus =
        updated.languageStatus ?? updated.status ?? form.status;

      const savedForm: FormState = {
        language: updated.language ?? form.language,
        title: updated.title ?? form.title,
        subtitle: updated.subtitle ?? form.subtitle,
        content: updated.content ?? form.content,
        status: effectiveStatus,
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
        try {
          const errorData: unknown = await res.json();
          let backendMessage: string | null = null;

          if (
            errorData &&
            typeof errorData === "object" &&
            "message" in errorData
          ) {
            const message = (errorData as { message?: unknown }).message;
            if (typeof message === "string") {
              backendMessage = message;
            } else if (Array.isArray(message)) {
              backendMessage = message
                .filter((part): part is string => typeof part === "string")
                .join(" ");
            }
          }

          setMediaError(
            backendMessage ??
              "Възникна грешка при качване на изображението.",
          );
        } catch {
          setMediaError("Възникна грешка при качване на изображението.");
        }
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

    const confirmed = window.confirm(
      "Сигурни ли сте, че искате да изтриете това изображение?",
    );

    if (!confirmed) {
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
        const effectiveStatus =
          updated.languageStatus ?? updated.status ?? current?.status ?? "draft";

        const restoredForm: FormState = {
          language: updated.language ?? current?.language ?? "bg",
          title: updated.title ?? current?.title ?? "",
          subtitle: updated.subtitle ?? current?.subtitle ?? "",
          content: updated.content ?? current?.content ?? "",
          status: effectiveStatus,
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

  const handleToggleCompare = (version: AdminWikiArticleVersion) => {
    setCompareError(null);
    setComparison(null);

    setCompareSelectionIds((current) => {
      const isSelected = current.includes(version.id);
      if (isSelected) {
        return current.filter((id) => id !== version.id);
      }

      if (current.length === 0) {
        return [version.id];
      }

      const firstSelected = versions.find((v) => v.id === current[0]);
      if (firstSelected && firstSelected.language !== version.language) {
        setCompareError(
          'Може да сравнявате само версии на един и същи език.',
        );
        return current;
      }

      if (current.length === 1) {
        return [...current, version.id];
      }

      return [current[0], version.id];
    });
  };

  const handleCompareSelected = () => {
    if (compareSelectionIds.length !== 2) {
      return;
    }

    const [firstId, secondId] = compareSelectionIds;
    const first = versions.find((v) => v.id === firstId);
    const second = versions.find((v) => v.id === secondId);

    if (!first || !second) {
      return;
    }

    const firstTime = new Date(first.createdAt).getTime() || 0;
    const secondTime = new Date(second.createdAt).getTime() || 0;

    if (firstTime <= secondTime) {
      setComparison({ left: first, right: second });
    } else {
      setComparison({ left: second, right: first });
    }
  };

  const latestVersionIdsByLang: Record<string, string> = {};
  for (const v of versions) {
    if (!latestVersionIdsByLang[v.language]) {
      latestVersionIdsByLang[v.language] = v.id;
    }
  }

  const visibleVersions = form
    ? versions.filter((v) => v.language === form.language)
    : versions;

  const totalVisibleVersions = visibleVersions.length;
  const totalVersionsPages =
    totalVisibleVersions === 0
      ? 1
      : Math.ceil(totalVisibleVersions / VERSIONS_PAGE_SIZE);

  const currentVersionsPage =
    versionsPage < 1
      ? 1
      : versionsPage > totalVersionsPages
        ? totalVersionsPages
        : versionsPage;

  const paginatedVersions = visibleVersions.slice(
    (currentVersionsPage - 1) * VERSIONS_PAGE_SIZE,
    currentVersionsPage * VERSIONS_PAGE_SIZE,
  );

  const deleteVersionTarget =
    deleteVersionStep2Id == null
      ? null
      : versions.find((v) => v.id === deleteVersionStep2Id) ?? null;

  const viewVersionTarget =
    viewVersionId == null
      ? null
      : versions.find((v) => v.id === viewVersionId) ?? null;

  const deletablePaginatedVersions = paginatedVersions.filter(
    (v) => latestVersionIdsByLang[v.language] !== v.id,
  );

  const selectedDeletableOnPageForDelete = deletablePaginatedVersions.filter(
    (v) => selectedVersionIdsForDelete.includes(v.id),
  );

  const isAllPageSelectedForDelete =
    deletablePaginatedVersions.length > 0 &&
    selectedDeletableOnPageForDelete.length ===
      deletablePaginatedVersions.length;

  const hasAnySelectedForDelete = selectedVersionIdsForDelete.length > 0;

  const publicWikiHref =
    slug != null
      ? `/wiki/${encodeURIComponent(slug)}${
          form?.language
            ? `?lang=${encodeURIComponent(form.language)}`
            : ""
        }`
      : null;

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
        <div className="flex flex-col items-end gap-1 text-right">
          {publicWikiHref && (
            <Link
              href={publicWikiHref}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Отвори публичната страница
            </Link>
          )}
          <Link
            href="/admin/wiki"
            className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
          >
            ← Назад към Admin Wiki
          </Link>
        </div>
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
                htmlFor="subtitle"
                className="block text-sm font-medium text-zinc-800"
              >
                Подзаглавие (по избор)
              </label>
              <input
                id="subtitle"
                type="text"
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={form.subtitle}
                onChange={handleChange("subtitle")}
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
                className="block min-h-[60vh] w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={form.content}
                onChange={handleChange("content")}
              />
              <p className="text-xs text-zinc-500">
                За диаграми използвайте fenced code block с език{" "}
                <code>mermaid</code>, напр.:{" "}
                <code>{"```mermaid ... ```"}</code>. Диаграмите ще се виждат в
                прегледа и в публичната Wiki.
              </p>
            </div>

            <section
              aria-label="Преглед на съдържанието"
              className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3"
            >
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between gap-2 text-left"
                onClick={() => setPreviewExpanded((value) => !value)}
              >
                <h3 className="text-sm font-semibold text-zinc-900">
                  Преглед (както в публичната Wiki)
                </h3>
                <span className="text-xs font-medium text-zinc-700 hover:text-zinc-900">
                  {previewExpanded ? "Скрий прегледа" : "Покажи прегледа"}
                </span>
              </button>
              {previewExpanded && (
                <div className="rounded-md bg-white px-4 py-3">
                  <header className="space-y-1 border-b border-zinc-100 pb-3">
                    <h1 className="text-2xl font-bold text-zinc-900">
                      {form.title.trim().length > 0
                        ? form.title
                        : "(без заглавие)"}
                    </h1>
                    {form.subtitle.trim().length > 0 && (
                      <p className="text-sm text-zinc-600">{form.subtitle}</p>
                    )}
                  </header>
                  <article
                    className="wiki-markdown mt-3 text-sm leading-relaxed"
                    style={{ color: "#111827" }}
                  >
                    <WikiMarkdown
                      content={normalizeMarkdownContent(form.content)}
                    />
                  </article>
                </div>
              )}
            </section>

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
              <p className="pt-2 text-right text-sm font-semibold text-orange-600">
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
                      <div className="flex items-center gap-2">
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="h-10 w-10 rounded border border-zinc-200 bg-white object-cover"
                          loading="lazy"
                        />
                        <span className="break-all">{item.url}</span>
                      </div>
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
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Версии на статията
              </h3>
            </div>

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

            {!versionsLoading && !versionsError && totalVisibleVersions === 0 && (
              <p className="text-sm text-zinc-600">
                Няма налични версии за този език.
              </p>
            )}

            {!versionsLoading && !versionsError && totalVisibleVersions > 0 && (
              <div className="overflow-x-auto">
                <table className="mt-2 min-w-full table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-2 align-middle text-center">
                        Сравни
                      </th>
                      <th className="px-3 py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                          checked={isAllPageSelectedForDelete}
                          disabled={deletablePaginatedVersions.length === 0}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            if (checked) {
                              setSelectedVersionIdsForDelete((current) => {
                                const next = new Set(current);
                                for (const v of deletablePaginatedVersions) {
                                  next.add(v.id);
                                }
                                return Array.from(next);
                              });
                            } else {
                              setSelectedVersionIdsForDelete((current) =>
                                current.filter(
                                  (id) =>
                                    !paginatedVersions.some((v) => v.id === id),
                                ),
                              );
                            }
                          }}
                        />
                      </th>
                      <th className="px-3 py-2 align-middle">Версия</th>
                      <th className="px-3 py-2 align-middle">Език</th>
                      <th className="px-3 py-2 align-middle">Заглавие</th>
                      <th className="px-3 py-2 align-middle">Подзаглавие</th>
                      <th className="px-3 py-2 align-middle">Създадена на</th>
                      <th className="px-3 py-2 align-middle">Създадена от</th>
                      <th className="px-3 py-2 align-middle text-right">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVersions.map((version) => {
                      const isLatestForLanguage =
                        latestVersionIdsByLang[version.language] === version.id;

                      return (
                        <tr
                          key={version.id}
                          className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                        >
                          <td className="px-3 py-2 align-middle text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                              checked={compareSelectionIds.includes(version.id)}
                              onChange={() => handleToggleCompare(version)}
                            />
                          </td>
                          <td className="px-3 py-2 align-middle text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                              checked={selectedVersionIdsForDelete.includes(
                                version.id,
                              )}
                              disabled={isLatestForLanguage}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setSelectedVersionIdsForDelete((current) => {
                                  if (checked) {
                                    if (current.includes(version.id)) {
                                      return current;
                                    }
                                    return [...current, version.id];
                                  }

                                  return current.filter((id) => id !== version.id);
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-900">
                            <div className="flex items-center gap-2">
                              <span>v{version.version}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-900">
                            {version.language}
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-900">
                            {version.title}
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-700">
                            {version.subtitle && version.subtitle.trim().length > 0
                              ? version.subtitle
                              : "—"}
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-700">
                            {formatDateTime(version.createdAt)}
                          </td>
                          <td className="px-3 py-2 align-middle text-zinc-700">
                            {version.createdBy ?? "—"}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setViewVersionId(version.id)}
                                className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                              >
                                Преглед
                              </button>
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
                              <button
                                type="button"
                                onClick={() => {
                                  if (isLatestForLanguage) {
                                    return;
                                  }
                                  setDeleteVersionError(null);
                                  setDeleteVersionStep1Id(version.id);
                                }}
                                disabled={isLatestForLanguage}
                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Изтрий
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col text-xs text-zinc-500">
                    <span>
                      Изберете две версии (един и същи език), за да ги сравните.
                    </span>
                    {compareError && (
                      <span className="text-red-600">{compareError}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-500">
                      Страница {currentVersionsPage} от {totalVersionsPages} (
                      {totalVisibleVersions} версии)
                    </span>
                    {totalVersionsPages > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setVersionsPage((page) => Math.max(1, page - 1))
                          }
                          disabled={currentVersionsPage <= 1}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Предишна
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalVersionsPages },
                            (_, index) => index + 1,
                          ).map((pageNumber) => {
                            const isCurrent = pageNumber === currentVersionsPage;
                            return (
                              <button
                                key={pageNumber}
                                type="button"
                                onClick={() => setVersionsPage(pageNumber)}
                                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                  isCurrent
                                    ? "border-green-600 bg-green-600 text-white"
                                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setVersionsPage((page) =>
                              Math.min(totalVersionsPages, page + 1),
                            )
                          }
                          disabled={currentVersionsPage >= totalVersionsPages}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Следваща
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleCompareSelected}
                      disabled={compareSelectionIds.length !== 2}
                      className="inline-flex items-center rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Сравни избраните версии
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasAnySelectedForDelete) {
                          return;
                        }
                        setBulkDeleteError(null);
                        setBulkDeleteStep1Open(true);
                      }}
                      disabled={!hasAnySelectedForDelete}
                      className="inline-flex items-center rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Изтрий избраните
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
          {comparison && (
            <section
              aria-label="Сравнение на версии"
              className="mt-4 border-t border-zinc-200 pt-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Сравнение на версии
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Ляво: по-стара версия. Дясно: по-нова версия.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  onClick={() => setComparison(null)}
                >
                  Изчисти сравнението
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-zinc-900">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-red-700">
                        Версия v{comparison.left.version}
                      </p>
                      <p className="text-[11px] text-red-700">
                        {formatDateTime(comparison.left.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      По-стара
                    </span>
                  </div>
                  <div className="mb-1 text-[11px]">
                    <span className="font-semibold text-red-700">Заглавие:</span>{" "}
                    <span className="whitespace-pre-wrap break-words">
                      {comparison.left.title}
                    </span>
                  </div>
                  <div className="mb-1 text-[11px]">
                    <span className="font-semibold text-red-700">Подзаглавие:</span>{" "}
                    <span className="whitespace-pre-wrap break-words">
                      {comparison.left.subtitle ?? "—"}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                    {comparison.left.content}
                  </div>
                </div>
                <div className="rounded-md border border-green-100 bg-green-50 p-3 text-xs text-zinc-900">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-green-700">
                        Версия v{comparison.right.version}
                      </p>
                      <p className="text-[11px] text-green-700">
                        {formatDateTime(comparison.right.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      По-нова
                    </span>
                  </div>
                  <div className="mb-1 text-[11px]">
                    <span className="font-semibold text-green-700">Заглавие:</span>{" "}
                    <span className="whitespace-pre-wrap break-words">
                      {renderDiff(comparison.left.title, comparison.right.title)}
                    </span>
                  </div>
                  <div className="mb-1 text-[11px]">
                    <span className="font-semibold text-green-700">Подзаглавие:</span>{" "}
                    <span className="whitespace-pre-wrap break-words">
                      {renderDiff(
                        comparison.left.subtitle ?? "",
                        comparison.right.subtitle ?? "",
                      )}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                    {renderDiff(comparison.left.content, comparison.right.content)}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                <span className="rounded-sm bg-red-100 px-1 text-red-800 line-through">
                  текст
                </span>{" "}
                = премахнат текст,
                <span className="rounded-sm bg-green-100 px-1 text-green-800">
                  текст
                </span>{" "}
                = добавен текст.
              </p>
            </section>
          )}
          {viewVersionTarget && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-zinc-900">
                      Преглед на версия v{viewVersionTarget.version} ({
                        viewVersionTarget.language
                      })
                    </h3>
                    <p className="text-xs text-zinc-600">
                      Създадена на {formatDateTime(viewVersionTarget.createdAt)}
                      {viewVersionTarget.createdBy
                        ? ` от ${viewVersionTarget.createdBy}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewVersionId(null)}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    Затвори
                  </button>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <header className="space-y-1 border-b border-zinc-100 pb-3">
                    <h1 className="text-xl font-bold text-zinc-900">
                      {viewVersionTarget.title.trim().length > 0
                        ? viewVersionTarget.title
                        : "(без заглавие)"}
                    </h1>
                    {viewVersionTarget.subtitle &&
                      viewVersionTarget.subtitle.trim().length > 0 && (
                        <p className="text-sm text-zinc-600">
                          {viewVersionTarget.subtitle}
                        </p>
                      )}
                  </header>
                  <article
                    className="wiki-markdown mt-3 text-sm leading-relaxed"
                    style={{ color: "#111827" }}
                  >
                    <WikiMarkdown
                      content={normalizeMarkdownContent(
                        viewVersionTarget.content,
                      )}
                    />
                  </article>
                </div>
              </div>
            </div>
          )}
          {deleteVersionStep1Id && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 className="mb-2 text-base font-semibold text-zinc-900">
                  Изтриване на версия
                </h3>
                <p className="mb-4 text-sm text-zinc-700">
                  Тази версия ще бъде завинаги премахната от историята на
                  статията. Това действие е необратимо и може да повлияе на
                  проследимостта на промените.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                    onClick={() => setDeleteVersionStep1Id(null)}
                  >
                    Затвори
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    onClick={() => {
                      setDeleteVersionStep2Id(deleteVersionStep1Id);
                      setDeleteVersionStep1Id(null);
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {deleteVersionStep2Id && deleteVersionTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 className="mb-2 text-base font-semibold text-zinc-900">
                  Потвърдете изтриването на версията
                </h3>
                <p className="mb-3 text-sm text-zinc-700">
                  Наистина ли искате да изтриете тази версия? Това действие е
                  окончателно и не може да бъде отменено.
                </p>
                <p className="mb-3 text-xs text-zinc-600">
                  Версия v{deleteVersionTarget.version} ({deleteVersionTarget.language})
                  , създадена на {formatDateTime(deleteVersionTarget.createdAt)}.
                </p>
                {deleteVersionError && (
                  <p className="mb-3 text-xs text-red-600" role="alert">
                    {deleteVersionError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-70"
                    onClick={() => setDeleteVersionStep2Id(null)}
                    disabled={deleteVersionSubmitting}
                  >
                    Отказ
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                    onClick={async () => {
                      if (!articleId || !deleteVersionStep2Id || !deleteVersionTarget) {
                        return;
                      }

                      if (
                        latestVersionIdsByLang[deleteVersionTarget.language] ===
                        deleteVersionTarget.id
                      ) {
                        setDeleteVersionError(
                          "Текущата активна версия не може да бъде изтрита.",
                        );
                        return;
                      }

                      if (typeof window === "undefined") {
                        return;
                      }

                      setDeleteVersionError(null);
                      setDeleteVersionSubmitting(true);

                      try {
                        const token =
                          window.localStorage.getItem("qa4free_access_token");
                        if (!token) {
                          setDeleteVersionError(
                            "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
                          );
                          setDeleteVersionSubmitting(false);
                          return;
                        }

                        const res = await fetch(
                          `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
                            articleId,
                          )}/versions/${encodeURIComponent(
                            deleteVersionStep2Id,
                          )}`,
                          {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          },
                        );

                      if (!res.ok) {
                        if (res.status === 400) {
                          setDeleteVersionError(
                            "Тази версия не може да бъде изтрита, защото е последната версия на статията.",
                          );
                        } else if (res.status === 404) {
                          setDeleteVersionError(
                            "Версията или статията не бяха намерени.",
                          );
                        } else {
                          setDeleteVersionError(
                            "Възникна грешка при изтриване на версията.",
                          );
                        }
                        setDeleteVersionSubmitting(false);
                        return;
                      }

                      setVersions((current) =>
                        current.filter((v) => v.id !== deleteVersionStep2Id),
                      );
                      setCompareSelectionIds((current) =>
                        current.filter((id) => id !== deleteVersionStep2Id),
                      );
                      setComparison((current) => {
                        if (!current) {
                          return current;
                        }
                        if (
                          current.left.id === deleteVersionStep2Id ||
                          current.right.id === deleteVersionStep2Id
                        ) {
                          return null;
                        }
                        return current;
                      });
                      setDeleteVersionStep2Id(null);
                    } catch {
                      setDeleteVersionError(
                        "Възникна грешка при изтриване на версията.",
                      );
                    } finally {
                      setDeleteVersionSubmitting(false);
                    }
                  }}
                  disabled={deleteVersionSubmitting}
                >
                  Да, изтрий версията
                </button>
              </div>
            </div>
          </div>
        )}
        {bulkDeleteStep1Open && hasAnySelectedForDelete && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-zinc-900">
                Изтриване на избрани версии
              </h3>
              <p className="mb-4 text-sm text-zinc-700">
                Ще бъдат завинаги премахнати {selectedVersionIdsForDelete.length}
                {" "}
                версии от историята на статията. Това действие е необратимо и
                може да повлияе на проследимостта на промените.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  onClick={() => setBulkDeleteStep1Open(false)}
                >
                  Затвори
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  onClick={() => {
                    setBulkDeleteError(null);
                    setBulkDeleteStep1Open(false);
                    setBulkDeleteStep2Open(true);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {bulkDeleteStep2Open && hasAnySelectedForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-base font-semibold text-zinc-900">
                Потвърдете изтриването на избраните версии
              </h3>
              <p className="mb-3 text-sm text-zinc-700">
                Наистина ли искате да изтриете избраните версии? Това действие е
                окончателно и не може да бъде отменено.
              </p>
              {bulkDeleteError && (
                <p className="mb-3 text-xs text-red-600" role="alert">
                  {bulkDeleteError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-70"
                  onClick={() => {
                    if (bulkDeleteSubmitting) {
                      return;
                    }
                    setBulkDeleteStep2Open(false);
                    setBulkDeleteError(null);
                  }}
                  disabled={bulkDeleteSubmitting}
                >
                  Отказ
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                  onClick={async () => {
                    if (!articleId || selectedVersionIdsForDelete.length === 0) {
                      return;
                    }

                    if (typeof window === "undefined") {
                      return;
                    }

                    setBulkDeleteError(null);
                    setBulkDeleteSubmitting(true);

                    try {
                      const token =
                        window.localStorage.getItem("qa4free_access_token");
                      if (!token) {
                        setBulkDeleteError(
                          "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
                        );
                        setBulkDeleteSubmitting(false);
                        return;
                      }

                      let failedCount = 0;

                      for (const versionId of selectedVersionIdsForDelete) {
                        try {
                          const res = await fetch(
                            `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
                              articleId,
                            )}/versions/${encodeURIComponent(versionId)}`,
                            {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            },
                          );

                          if (!res.ok) {
                            failedCount += 1;
                          }
                        } catch {
                          failedCount += 1;
                        }
                      }

                      if (failedCount > 0) {
                        setBulkDeleteError(
                          "Някои версии не можаха да бъдат изтрити. Списъкът с версии ще бъде обновен.",
                        );
                      } else {
                        setBulkDeleteError(null);
                      }

                      setBulkDeleteStep2Open(false);
                      setSelectedVersionIdsForDelete([]);
                      setCompareSelectionIds([]);
                      setComparison(null);
                      setCompareError(null);
                      setVersionsReloadKey((value) => value + 1);
                    } catch {
                      setBulkDeleteError(
                        "Възникна грешка при изтриване на избраните версии.",
                      );
                    } finally {
                      setBulkDeleteSubmitting(false);
                    }
                  }}
                  disabled={bulkDeleteSubmitting}
                >
                  Да, изтрий избраните версии
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
  );
}
