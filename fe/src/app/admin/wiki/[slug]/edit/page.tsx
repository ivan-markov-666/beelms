"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type CSSProperties,
} from "react";
import { diffWords, type Change } from "diff";
import type { Editor as TipTapEditor } from "@tiptap/core";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCurrentLang } from "../../../../../i18n/useCurrentLang";
import { t } from "../../../../../i18n/t";
import { DEFAULT_LANGUAGE_FLAG_BY_LANG } from "../../../../../i18n/config";
import { WikiMarkdown } from "../../../../wiki/_components/wiki-markdown";
import { getAccessToken } from "../../../../auth-token";
import { getApiBaseUrl } from "../../../../api-url";
import { AdminBreadcrumbs } from "../../../_components/admin-breadcrumbs";
import { InfoTooltip } from "../../../_components/info-tooltip";
import { Pagination } from "../../../../_components/pagination";
import { ListboxSelect } from "../../../../_components/listbox-select";
import { useAdminSupportedLanguages } from "../../../_hooks/use-admin-supported-languages";

function RichEditorLoading() {
  const lang = useCurrentLang();

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
      {t(lang, "common", "adminWikiEditRichEditorLoading")}
    </div>
  );
}

const WikiRichEditor = dynamic(
  () =>
    import("../../_components/wiki-rich-editor").then((m) => m.WikiRichEditor),
  {
    ssr: false,
    loading: () => <RichEditorLoading />,
  },
);

const ADMIN_API_BASE_URL = getApiBaseUrl();

type WikiArticleDetail = {
  id: string;
  slug: string;
  tags?: string[];
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
  tags: string;
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

type TranslationImportResult = {
  filename: string;
  language: string | null;
  status: "created" | "skipped" | "error";
  versionNumber?: number;
  error?: string;
};

function deriveAltFromFilename(filename: string): string {
  const withoutQuery = filename.split("?")[0] ?? filename;
  const lastSegment = withoutQuery.split("/").pop() ?? withoutQuery;
  const withoutExt = lastSegment.replace(/\.[a-zA-Z0-9]+$/, "");
  return withoutExt || "image";
}

const DEFAULT_VERSIONS_PAGE_SIZE = 10;

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

function normalizeTagsInput(raw: string): string[] {
  const parts = (raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of parts) {
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(tag);
  }

  return result;
}

function formatTagsForInput(tags: string[] | undefined): string {
  const cleaned = (tags ?? []).map((t) => (t ?? "").trim()).filter(Boolean);
  return cleaned.join(", ");
}

function renderDiff(oldText: string, newText: string) {
  const parts: Change[] = diffWords(oldText ?? "", newText ?? "");

  return (
    <>
      {parts.map((part: Change, index: number) => {
        const key = `${index}-${part.added ? "a" : part.removed ? "r" : "u"}`;

        if (part.added) {
          return (
            <span key={key} className="bg-green-100 text-green-800">
              {part.value}
            </span>
          );
        }

        if (part.removed) {
          return (
            <span key={key} className="bg-red-100 text-red-800 line-through">
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
  const lang = useCurrentLang();
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const richEditorRef = useRef<TipTapEditor | null>(null);
  const publicLinkTooltipId = useId();

  const [contentEditorMode, setContentEditorMode] = useState<
    "markdown" | "rich"
  >("markdown");

  const [articleId, setArticleId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [lastSavedForm, setLastSavedForm] = useState<FormState | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const { languages: supportedAdminLangs } = useAdminSupportedLanguages();
  const [versionsSectionHighlight, setVersionsSectionHighlight] =
    useState(false);
  const languageOptions = useMemo(() => {
    const codes = new Set(supportedAdminLangs);
    if (form?.language && !codes.has(form.language)) {
      codes.add(form.language);
    }
    return Array.from(codes);
  }, [supportedAdminLangs, form?.language]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [versions, setVersions] = useState<AdminWikiArticleVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionsPage, setVersionsPage] = useState(1);
  const [versionsPageSize, setVersionsPageSize] = useState(
    DEFAULT_VERSIONS_PAGE_SIZE,
  );
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(
    null,
  );
  const [versionsReloadKey, setVersionsReloadKey] = useState(0);

  const [compareSelectionIds, setCompareSelectionIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<{
    left: AdminWikiArticleVersion;
    right: AdminWikiArticleVersion;
  } | null>(null);

  const [deleteVersionStep1Id, setDeleteVersionStep1Id] = useState<
    string | null
  >(null);
  const [deleteVersionStep2Id, setDeleteVersionStep2Id] = useState<
    string | null
  >(null);
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
  const [saveHintVisible, setSaveHintVisible] = useState(false);

  const [importingTranslations, setImportingTranslations] = useState(false);
  const [importTranslationsError, setImportTranslationsError] = useState<
    string | null
  >(null);
  const [importTranslationsResults, setImportTranslationsResults] = useState<
    TranslationImportResult[]
  >([]);
  const [articleReloadKey, setArticleReloadKey] = useState(0);

  const successBannerStyle: CSSProperties = {
    backgroundColor: "var(--field-ok-bg, #dcfce7)",
    borderColor: "var(--field-ok-border, #bbf7d0)",
    color: "#ffffff",
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const translationFilesInputRef = useRef<HTMLInputElement | null>(null);

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

        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setError(
              t(lang, "common", "adminErrorMissingApiAccess"),
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
              tags: "",
              content: "",
              status: "draft",
            };
            setForm(emptyForm);
            setLastSavedForm(null);
            setLoading(false);
            return;
          }

          setError(t(lang, "common", "adminWikiEditArticleNotFound"));
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(t(lang, "common", "adminWikiEditLoadError"));
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
          tags: formatTagsForInput(data.tags),
          content: data.content ?? "",
          status: effectiveStatus,
        };
        setForm(loadedForm);
        setLastSavedForm(loadedForm);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(t(lang, "common", "adminWikiEditLoadError"));
          setLoading(false);
        }
      }
    };

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [slug, currentLanguage, lang, articleReloadKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (loading) {
      return;
    }

    if (window.location.hash !== "#versions") {
      return;
    }

    const timer = window.setTimeout(() => {
      const el = window.document.getElementById("versions");
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setVersionsSectionHighlight(true);
    }, 0);

    const clearTimer = window.setTimeout(() => {
      setVersionsSectionHighlight(false);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [loading]);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = getAccessToken();
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
            setMediaError(t(lang, "common", "adminWikiEditMediaLoadError"));
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
          setMediaError(t(lang, "common", "adminWikiEditMediaLoadError"));
          setMediaLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [articleId, lang]);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let cancelled = false;

    const loadVersions = async () => {
      setVersionsLoading(true);
      setVersionsError(null);

      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setVersionsError(
              t(lang, "common", "adminErrorMissingApiAccess"),
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
            setVersionsError(t(lang, "common", "adminWikiEditVersionsLoadError"));
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
          setVersionsError(t(lang, "common", "adminWikiEditVersionsLoadError"));
          setVersionsLoading(false);
        }
      }
    };

    void loadVersions();

    return () => {
      cancelled = true;
    };
  }, [articleId, versionsReloadKey, versionsPage, versionsPageSize, lang]);

  const handleChangeLanguage = (newLang: string) => {
    setForm((current) =>
      current
        ? { ...current, language: newLang }
        : {
            language: newLang,
            title: "",
            subtitle: "",
            tags: "",
            content: "",
            status: "draft",
          },
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
      form.tags !== lastSavedForm.tags ||
      form.content !== lastSavedForm.content ||
      form.status !== lastSavedForm.status);

  const isContentDirty =
    !!form && (!lastSavedForm || form.content !== lastSavedForm.content);

  const requiredFieldsState = useMemo(() => {
    if (!form) {
      return {
        missingFields: [] as string[],
        titleMissing: false,
        contentMissing: false,
      };
    }

    const missingFields: string[] = [];
    const titleMissing = !form.title.trim();
    const contentMissing = !form.content.trim();

    if (titleMissing) {
      missingFields.push(t(lang, "common", "adminWikiEditRequiredFieldTitle"));
    }

    if (contentMissing) {
      missingFields.push(t(lang, "common", "adminWikiEditRequiredFieldContent"));
    }

    return { missingFields, titleMissing, contentMissing };
  }, [form, lang]);

  const { missingFields, titleMissing, contentMissing } = requiredFieldsState;

  const saveDisabledReason = useMemo(() => {
    if (!isDirty) {
      return t(lang, "common", "adminWikiEditSaveDisabledNoChanges");
    }

    if (missingFields.length > 0) {
      return t(lang, "common", "adminWikiEditSaveDisabledMissingFields");
    }

    return null;
  }, [isDirty, missingFields, lang]);

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

    const token = getAccessToken();
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

        // Autosave keeps remote draft in sync, but we intentionally do NOT
        // reset lastSavedForm so the UI continues to show that there are
        // unsaved changes until the author clicks "Запази".
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
      const token = getAccessToken();
      if (!token) {
        setError(
          t(lang, "common", "adminErrorMissingApiAccess"),
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
            tags: normalizeTagsInput(form.tags),
            content: form.content,
            status: form.status,
          }),
        },
      );

      if (res.status === 404) {
        setError(t(lang, "common", "adminWikiEditArticleNotFound"));
        setSaving(false);
        return;
      }

      if (res.status === 400) {
        setError(t(lang, "common", "adminWikiEditInvalidData"));
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setError(t(lang, "common", "adminWikiEditSaveError"));
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
        tags: formatTagsForInput(updated.tags) || form.tags,
        content: updated.content ?? form.content,
        status: effectiveStatus,
      };

      setForm(savedForm);
      setLastSavedForm(savedForm);
      setSuccess(t(lang, "common", "adminWikiEditSaveSuccess"));
      setVersionsReloadKey((value) => value + 1);
      setSaving(false);
    } catch {
      setError(t(lang, "common", "adminWikiEditSaveError"));
      setSaving(false);
    }
  };

  const handleImportTranslationsClick = () => {
    if (!articleId) {
      setError(t(lang, "common", "adminWikiEditMissingArticleId"));
      return;
    }

    setImportTranslationsError(null);

    if (translationFilesInputRef.current) {
      translationFilesInputRef.current.value = "";
      translationFilesInputRef.current.click();
    }
  };

  const handleTranslationFilesSelected: React.ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    if (!articleId) {
      setError(t(lang, "common", "adminWikiEditMissingArticleId"));
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setImportTranslationsError(t(lang, "common", "adminErrorMissingApiAccess"));
      return;
    }

    setImportingTranslations(true);
    setImportTranslationsError(null);
    setImportTranslationsResults([]);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(
        `${ADMIN_API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          articleId,
        )}/translations/import-markdown`,
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

          setImportTranslationsError(
            backendMessage ??
              t(lang, "common", "adminWikiEditImportMarkdownError"),
          );
        } catch {
          setImportTranslationsError(
            t(lang, "common", "adminWikiEditImportMarkdownError"),
          );
        }
        setImportingTranslations(false);
        return;
      }

      const data = (await res.json()) as {
        results?: TranslationImportResult[];
      };
      const results = Array.isArray(data.results) ? data.results : [];
      setImportTranslationsResults(results);

      setVersionsReloadKey((v) => v + 1);
      setArticleReloadKey((v) => v + 1);
      setImportingTranslations(false);
    } catch {
      setImportTranslationsError(t(lang, "common", "adminWikiEditImportMarkdownError"));
      setImportingTranslations(false);
    }
  };

  const handleInsertImage = (item: MediaItem) => {
    const alt = deriveAltFromFilename(item.filename);
    const markdownSnippet = `![${alt}](${item.url})`;

    if (contentEditorMode === "rich" && richEditorRef.current) {
      richEditorRef.current
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src: item.url, alt },
        })
        .run();
      return;
    }

    setForm((current) => {
      if (!current) return current;

      const separator = current.content.trim().length > 0 ? "\n\n" : "";
      return {
        ...current,
        content: `${current.content}${separator}${markdownSnippet}`,
      };
    });
  };

  const handleUploadClick = () => {
    if (!articleId) {
      setError(t(lang, "common", "adminWikiEditMissingArticleId"));
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
      setError(t(lang, "common", "adminWikiEditMissingArticleId"));
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError(
        t(lang, "common", "adminErrorMissingApiAccess"),
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
              t(lang, "common", "adminWikiEditUploadImageError"),
          );
        } catch {
          setMediaError(t(lang, "common", "adminWikiEditUploadImageError"));
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
      setMediaError(t(lang, "common", "adminWikiEditUploadImageError"));
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
      t(lang, "common", "adminWikiEditDeleteMediaConfirm"),
    );

    if (!confirmed) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError(
        t(lang, "common", "adminErrorMissingApiAccess"),
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
        setMediaError(t(lang, "common", "adminWikiEditDeleteMediaError"));
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
      setMediaError(t(lang, "common", "adminWikiEditDeleteMediaError"));
    }
  };

  const handleCopyMarkdown = async (item: MediaItem) => {
    const alt = deriveAltFromFilename(item.filename);
    const markdownSnippet = `![${alt}](${item.url})`;

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        setCopyMessage(t(lang, "common", "adminWikiEditClipboardUnavailable"));
        return;
      }

      await navigator.clipboard.writeText(markdownSnippet);
      setCopyMessage(t(lang, "common", "adminWikiEditMarkdownCopied"));
    } catch {
      setCopyMessage(t(lang, "common", "adminWikiEditMarkdownCopyFailed"));
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!articleId) {
      return;
    }

    const confirmed = window.confirm(
      t(lang, "common", "adminWikiEditRollbackConfirm"),
    );
    if (!confirmed) {
      return;
    }

    setRollbackVersionId(versionId);
    setError(null);
    setSuccess(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setError(
          t(lang, "common", "adminErrorMissingApiAccess"),
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
        setError(t(lang, "common", "adminWikiEditRollbackNotFound"));
        setRollbackVersionId(null);
        return;
      }

      if (res.status === 400) {
        setError(
          t(lang, "common", "adminWikiEditRollbackInvalidRequest"),
        );
        setRollbackVersionId(null);
        return;
      }

      if (!res.ok) {
        setError(t(lang, "common", "adminWikiEditRollbackError"));
        setRollbackVersionId(null);
        return;
      }

      const updated = (await res.json()) as WikiArticleDetail;

      setForm((current) => {
        const effectiveStatus =
          updated.languageStatus ??
          updated.status ??
          current?.status ??
          "draft";

        const restoredForm: FormState = {
          language: updated.language ?? current?.language ?? "bg",
          title: updated.title ?? current?.title ?? "",
          subtitle: updated.subtitle ?? current?.subtitle ?? "",
          tags: formatTagsForInput(updated.tags) || current?.tags || "",
          content: updated.content ?? current?.content ?? "",
          status: effectiveStatus,
        };
        setLastSavedForm(restoredForm);
        return restoredForm;
      });
      setSuccess(t(lang, "common", "adminWikiEditRollbackSuccess"));
      setRollbackVersionId(null);
      setVersionsReloadKey((value) => value + 1);
    } catch {
      setError(t(lang, "common", "adminWikiEditRollbackError"));
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
        setCompareError(t(lang, "common", "adminWikiEditCompareSameLangError"));
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
      : Math.ceil(totalVisibleVersions / versionsPageSize);

  const currentVersionsPage =
    versionsPage < 1
      ? 1
      : versionsPage > totalVersionsPages
        ? totalVersionsPages
        : versionsPage;

  const paginatedVersions = visibleVersions.slice(
    (currentVersionsPage - 1) * versionsPageSize,
    currentVersionsPage * versionsPageSize,
  );

  const exportVisibleVersionsCsv = () => {
    if (visibleVersions.length === 0 || typeof window === "undefined") {
      return;
    }

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = [
      "id",
      "language",
      "version",
      "title",
      "status",
      "createdAt",
      "createdBy",
    ];

    const rows = visibleVersions.map((v) => [
      v.id,
      v.language,
      v.version,
      v.title,
      v.status,
      v.createdAt,
      v.createdBy ?? "",
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-wiki-versions-${slug ?? "article"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const deleteVersionTarget =
    deleteVersionStep2Id == null
      ? null
      : (versions.find((v) => v.id === deleteVersionStep2Id) ?? null);

  const viewVersionTarget =
    viewVersionId == null
      ? null
      : (versions.find((v) => v.id === viewVersionId) ?? null);

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
          form?.language ? `?lang=${encodeURIComponent(form.language)}` : ""
        }`
      : null;

  const breadcrumbItems = useMemo(
    () => [
      { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
      {
        label: t(lang, "common", "adminWikiManagementTitle"),
        href: "/admin/wiki",
      },
      {
        label:
          form?.title?.trim() ||
          slug ||
          t(lang, "common", "adminWikiEditBreadcrumbFallback"),
      },
    ],
    [form?.title, slug, lang],
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={breadcrumbItems} />
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="mb-1 text-xl font-semibold text-zinc-900">
              {t(lang, "common", "adminWikiEditTitle")}
            </h2>
            <p className="text-sm text-zinc-600">
              {t(lang, "common", "adminWikiEditSubtitle")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {publicWikiHref && (
              <div className="group relative inline-flex flex-col items-end">
                <Link
                  href={publicWikiHref}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--secondary)]"
                  target="_blank"
                  rel="noreferrer"
                  aria-describedby={publicLinkTooltipId}
                >
                  {t(lang, "common", "adminWikiEditOpenPublicPage")}
                </Link>
                <div
                  id={publicLinkTooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800 shadow-2xl opacity-0 translate-y-1 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
                >
                  <p className="leading-relaxed text-zinc-700">
                    {t(lang, "common", "adminWikiEditPublicVisibleHintPrefix")}
                    <span className="font-semibold text-green-700">
                      &quot;active&quot;
                    </span>
                    {t(lang, "common", "adminWikiEditPublicVisibleHintSuffix")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminWikiEditLoading")}
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && success && (
          <div
            className="mb-4 rounded-md border px-4 py-3 text-sm"
            style={successBannerStyle}
          >
            {success}
          </div>
        )}

        {!loading && !error && form && (
          <div className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <span>{t(lang, "common", "adminWikiEditLanguageLabel")}</span>
                    <InfoTooltip
                      label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                      title={t(lang, "common", "adminWikiEditLanguageLabel")}
                      description={t(lang, "common", "adminWikiEditLanguageHelp")}
                    />
                  </label>
                  <ListboxSelect
                    ariaLabel={t(lang, "common", "adminWikiEditLanguageAria")}
                    value={form.language}
                    onChange={(next) => handleChangeLanguage(next)}
                    buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    options={languageOptions.map((code) => ({
                      value: code,
                      label: code.toUpperCase(),
                      leftAdornment: DEFAULT_LANGUAGE_FLAG_BY_LANG[code] ? (
                        <span
                          aria-hidden="true"
                          className={`fi fi-${DEFAULT_LANGUAGE_FLAG_BY_LANG[code]} h-4 w-4 shrink-0 rounded-sm`}
                        />
                      ) : null,
                    }))}
                  />
                  <p className="text-xs text-zinc-500">
                    {t(lang, "common", "adminWikiEditLanguageHelp")}
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="status"
                    className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                  >
                    <span>{t(lang, "common", "adminWikiEditStatusLabel")}</span>
                    <InfoTooltip
                      label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                      title={t(lang, "common", "adminWikiEditStatusLabel")}
                      description={t(lang, "common", "adminWikiEditStatusLabel")}
                    />
                  </label>
                  <ListboxSelect
                    id="status"
                    ariaLabel={t(lang, "common", "adminWikiEditStatusAria")}
                    value={form.status}
                    onChange={(next) =>
                      setForm((prev) =>
                        prev ? { ...prev, status: next } : prev,
                      )
                    }
                    buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    options={[
                      {
                        value: "draft",
                        label: t(lang, "common", "adminWikiStatsDraft"),
                      },
                      {
                        value: "active",
                        label: t(lang, "common", "adminWikiStatsActive"),
                      },
                      {
                        value: "inactive",
                        label: t(lang, "common", "adminWikiStatsInactive"),
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="title"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                >
                  <span className="flex items-center">
                    <span>{t(lang, "common", "adminWikiEditTitleLabel")}</span>
                    <span className="ml-1 text-red-600" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiEditTitleLabel")}
                    description={t(lang, "common", "adminWikiEditTitleLabel")}
                  />
                  <span className="sr-only">
                    {t(lang, "common", "adminWikiEditRequiredFieldSrOnly")}
                  </span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={form.title}
                  onChange={handleChange("title")}
                />
                {titleMissing && (
                  <p className="text-sm text-red-600">
                    {t(lang, "common", "adminWikiEditTitleRequiredError")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="subtitle"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                >
                  <span>{t(lang, "common", "adminWikiEditSubtitleLabel")}</span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiEditSubtitleLabel")}
                    description={t(lang, "common", "adminWikiEditSubtitleLabel")}
                  />
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
                  htmlFor="tags"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                >
                  <span>{t(lang, "common", "adminWikiEditTagsLabel")}</span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiEditTagsLabel")}
                    description={t(lang, "common", "adminWikiEditTagsLabel")}
                  />
                </label>
                <input
                  id="tags"
                  type="text"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={form.tags}
                  onChange={handleChange("tags")}
                />
                <p className="text-xs text-zinc-500">
                  {t(lang, "common", "adminWikiEditTagsExamplePrefix")}: {" "}
                  <code>intro, basics, setup</code>
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="content"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                >
                  <span className="flex items-center">
                    <span>{t(lang, "common", "adminWikiEditContentLabel")}</span>
                    <span className="ml-1 text-red-600" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiEditContentLabel")}
                    description={t(lang, "common", "adminWikiEditContentLabel")}
                  />
                  <span className="sr-only">
                    {t(lang, "common", "adminWikiEditRequiredFieldSrOnly")}
                  </span>
                </label>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">
                    {t(lang, "common", "adminWikiEditEditorModeLabel")}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContentEditorMode("markdown")}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                        contentEditorMode === "markdown"
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--on-primary)] shadow-sm"
                          : "border-[color:var(--border)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                      }`}
                    >
                      {t(lang, "common", "adminWikiEditEditorModeMarkdown")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentEditorMode("rich")}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                        contentEditorMode === "rich"
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--on-primary)] shadow-sm"
                          : "border-[color:var(--border)] bg-white text-[color:var(--foreground)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                      }`}
                    >
                      {t(lang, "common", "adminWikiEditEditorModeRichText")}
                    </button>
                  </div>
                </div>

                {contentEditorMode === "markdown" ? (
                  <textarea
                    id="content"
                    className="block min-h-[60vh] w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={form.content}
                    onChange={handleChange("content")}
                  />
                ) : (
                  <WikiRichEditor
                    markdown={form.content}
                    disabled={saving}
                    exportFileName={`${slug || "wiki-article"}-${form.language}.md`}
                    onEditorReady={(editor) => {
                      richEditorRef.current = editor;
                    }}
                    onChangeMarkdown={(markdown) =>
                      setForm((current) =>
                        current ? { ...current, content: markdown } : current,
                      )
                    }
                  />
                )}
                {contentMissing && (
                  <p className="text-sm text-red-600">
                    {t(lang, "common", "adminWikiEditContentRequiredError")}
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  {t(lang, "common", "adminWikiEditMermaidHelp")}
                </p>
                <p className="text-xs text-zinc-500">
                  {t(lang, "common", "adminWikiEditCaptionHelp")}
                </p>
              </div>

              <section
                aria-label={t(lang, "common", "adminWikiEditPreviewAria")}
                className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3"
              >
                <button
                  type="button"
                  className="mb-2 flex w-full items-center justify-between gap-2 text-left"
                  onClick={() => setPreviewExpanded((value) => !value)}
                >
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditPreviewTitle")}
                  </h3>
                  <span className="text-xs font-medium text-zinc-700 hover:text-zinc-900">
                    {previewExpanded
                      ? t(lang, "common", "adminWikiEditPreviewHide")
                      : t(lang, "common", "adminWikiEditPreviewShow")}
                  </span>
                </button>
                {previewExpanded && (
                  <div className="rounded-md bg-zinc-50 px-4 py-3">
                    <header className="space-y-1 border-b border-zinc-100 pb-3">
                      <h1 className="text-2xl font-bold">
                        {form.title.trim() ||
                          t(lang, "common", "adminWikiEditPreviewUntitled")}
                      </h1>
                      {form.subtitle.trim().length > 0 && (
                        <p className="text-sm">{form.subtitle}</p>
                      )}
                    </header>
                    <article className="wiki-markdown mt-3 text-sm leading-relaxed">
                      <WikiMarkdown
                        content={normalizeMarkdownContent(form.content)}
                      />
                    </article>
                  </div>
                )}
              </section>

              <div className="flex flex-col items-end gap-2 pt-2">
                <div className="flex flex-col items-end gap-1 text-right">
                  {missingFields.length > 0 && (
                    <p
                      className="max-w-md text-sm text-red-600"
                      role="alert"
                      aria-live="polite"
                    >
                      {t(lang, "common", "adminWikiEditMissingFieldsPrefix")} {" "}
                      {missingFields.join(", ")}. {t(
                        lang,
                        "common",
                        "adminWikiEditMissingFieldsSuffix",
                      )}
                    </p>
                  )}
                  {isDirty && (
                    <p className="text-sm font-semibold text-orange-600">
                      {t(lang, "common", "adminWikiEditUnsavedChangesWarning")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Link
                    href="/admin/wiki"
                    className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--attention)] px-4 py-2 text-sm font-medium text-[color:var(--on-attention)] shadow-sm transition hover:opacity-90"
                    onClick={(event) => {
                      if (!isDirty) {
                        return;
                      }

                      const confirmed = window.confirm(
                        t(lang, "common", "adminWikiEditUnsavedChangesConfirm"),
                      );
                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    {t(lang, "common", "adminWikiCancel")}
                  </Link>
                  <div
                    className="relative inline-flex"
                    onMouseEnter={() => {
                      if (saveDisabledReason) {
                        setSaveHintVisible(true);
                      }
                    }}
                    onMouseLeave={() => setSaveHintVisible(false)}
                    onFocus={() => {
                      if (saveDisabledReason) {
                        setSaveHintVisible(true);
                      }
                    }}
                    onBlur={() => setSaveHintVisible(false)}
                  >
                    <button
                      type="submit"
                      disabled={saving || !isDirty || missingFields.length > 0}
                      aria-describedby={
                        saveDisabledReason ? "save-disabled-hint" : undefined
                      }
                      className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving
                        ? t(lang, "common", "adminWikiEditSaving")
                        : t(lang, "common", "adminWikiEditSave")}
                    </button>

                    {saveHintVisible && saveDisabledReason && (
                      <div
                        id="save-disabled-hint"
                        role="status"
                        className="pointer-events-none absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-800 shadow-xl"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-green-600">ℹ️</span>
                          <p>{saveDisabledReason}</p>
                        </div>
                        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <section
              aria-label={t(lang, "common", "adminWikiEditImportMarkdownAria")}
              className="border-t border-zinc-200 pt-4"
            >
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                {t(lang, "common", "adminWikiEditImportMarkdownTitle")}
              </h3>
              <p className="mb-3 text-xs text-zinc-600">
                {t(lang, "common", "adminWikiEditImportMarkdownDescription")}
              </p>

              <p className="mb-2 text-xs text-zinc-600">
                {t(
                  lang,
                  "common",
                  "adminWikiEditImportMarkdownSupportedLangSuffixes",
                )}{" "}
                <span className="font-mono">
                  {supportedAdminLangs.length > 0
                    ? supportedAdminLangs.join(", ")
                    : "bg"}
                </span>
              </p>
              <p className="mb-3 text-xs text-zinc-600">
                {t(lang, "common", "adminWikiEditImportMarkdownFilenameSuffixHint")}{" "}
                <span className="font-mono">article-&lt;lang&gt;.md</span>
              </p>

              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleImportTranslationsClick}
                  disabled={importingTranslations || !articleId}
                  className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {importingTranslations
                    ? t(lang, "common", "adminWikiEditImportMarkdownUploading")
                    : t(lang, "common", "adminWikiEditImportMarkdownButton")}
                </button>
                <input
                  ref={translationFilesInputRef}
                  type="file"
                  multiple
                  accept=".md,text/markdown"
                  className="hidden"
                  onChange={handleTranslationFilesSelected}
                />
                <span className="text-xs text-zinc-500">
                  {t(lang, "common", "adminWikiEditNeedArticleIdHint")}
                </span>
              </div>

              {importTranslationsError && (
                <p className="text-xs text-red-600" role="alert">
                  {importTranslationsError}
                </p>
              )}

              {importTranslationsResults.length > 0 && (
                <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 text-xs font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditImportMarkdownResultsTitle")}
                  </div>
                  <ul className="space-y-1 text-[11px] font-mono text-zinc-700">
                    {importTranslationsResults.map((r, idx) => (
                      <li
                        key={`${r.filename}-${r.language ?? "unknown"}-${idx}`}
                        className="flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="break-all">
                            {r.filename} ({r.language ?? "?"})
                          </span>
                          <span
                            className={
                              r.status === "error"
                                ? "text-red-700"
                                : r.status === "created"
                                  ? "text-green-700"
                                  : "text-zinc-600"
                            }
                          >
                            {r.status}
                            {typeof r.versionNumber === "number"
                              ? ` v${r.versionNumber}`
                              : ""}
                          </span>
                        </div>
                        {r.error && (
                          <div className="text-red-700">{r.error}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section
              aria-label={t(lang, "common", "adminWikiEditMediaSectionAria")}
              className="border-t border-zinc-200 pt-4"
            >
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                {t(lang, "common", "adminWikiEditMediaSectionTitle")}
              </h3>
              <p className="mb-3 text-xs text-zinc-600">
                {t(lang, "common", "adminWikiEditMediaSectionDescription")}
              </p>

              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading || !articleId}
                  className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--primary)] px-3 py-1.5 text-xs font-medium text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploading
                    ? t(lang, "common", "adminWikiEditUploading")
                    : t(lang, "common", "adminWikiEditUploadImage")}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <span className="text-xs text-zinc-500">
                  {t(lang, "common", "adminWikiEditNeedArticleIdHint")}
                </span>
              </div>

              {mediaLoading && (
                <p className="text-xs text-zinc-600">
                  {t(lang, "common", "adminWikiEditMediaLoading")}
                </p>
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
                    {t(lang, "common", "adminWikiEditUploadedImagesTitle")}
                  </span>
                </div>
                {articleId == null ? (
                  <p className="text-xs text-zinc-500">
                    {t(lang, "common", "adminWikiEditUploadedImagesNoArticleId")}
                  </p>
                ) : mediaItems.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    {t(lang, "common", "adminWikiEditUploadedImagesEmpty")}
                  </p>
                ) : (
                  <ul className="space-y-1 text-[11px] font-mono text-zinc-700">
                    {mediaItems.map((item) => (
                      <li
                        key={item.filename}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={item.url}
                            alt={item.filename}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded border border-zinc-200 bg-white object-cover"
                            loader={({ src }) => src}
                            unoptimized
                          />
                          <span className="break-all">{item.url}</span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInsertImage(item)}
                            className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-900"
                          >
                            {t(lang, "common", "adminWikiEditMediaInsert")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyMarkdown(item)}
                            className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-900"
                          >
                            {t(lang, "common", "adminWikiEditMediaCopyMarkdown")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(item.filename)}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                          >
                            {t(lang, "common", "adminWikiEditMediaDelete")}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section
              id="versions"
              tabIndex={-1}
              aria-label={t(lang, "common", "adminWikiEditVersionsAria")}
              className="border-t border-zinc-200 pt-4"
              style={
                versionsSectionHighlight
                  ? {
                      outline: "2px solid var(--primary)",
                      outlineOffset: "6px",
                      borderRadius: 10,
                      background:
                        "color-mix(in srgb, var(--primary) 6%, transparent)",
                    }
                  : undefined
              }
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditVersionsTitle")}
                  </h3>
                  {versionsSectionHighlight && (
                    <span
                      className="rounded border px-2 py-0.5 text-xs font-semibold"
                      style={{
                        color: "var(--primary)",
                        borderColor: "var(--primary)",
                      }}
                    >
                      {t(lang, "common", "adminWikiEditVersionsHighlight")}
                    </span>
                  )}
                </div>
              </div>

              {versionsLoading && (
                <p className="text-sm text-zinc-600">
                  {t(lang, "common", "adminWikiEditVersionsLoading")}
                </p>
              )}

              {!versionsLoading && versionsError && (
                <p className="text-sm text-red-600" role="alert">
                  {versionsError}
                </p>
              )}

              {!versionsLoading &&
                !versionsError &&
                totalVisibleVersions === 0 && (
                  <p className="text-sm text-zinc-600">
                    {t(lang, "common", "adminWikiEditVersionsEmpty")}
                  </p>
                )}

              {!versionsLoading &&
                !versionsError &&
                totalVisibleVersions > 0 && (
                  <div className="overflow-x-auto">
                    <table className="mt-2 min-w-full table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                          <th className="px-3 py-2 align-middle text-center">
                            {t(lang, "common", "adminWikiEditVersionsCompareHeader")}
                          </th>
                          <th className="px-3 py-2 align-middle text-center">
                            <div className="relative flex items-center justify-center">
                              <input
                                id="versions-delete-all"
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
                                          !paginatedVersions.some(
                                            (v) => v.id === id,
                                          ),
                                      ),
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor="versions-delete-all"
                                className="pointer-events-auto absolute left-full ml-2 cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500"
                              >
                                {t(lang, "common", "adminWikiEditVersionsSelectLabel")}
                              </label>
                            </div>
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColVersion")}
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColLanguage")}
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColTitle")}
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColSubtitle")}
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColCreatedAt")}
                          </th>
                          <th className="px-3 py-2 align-middle">
                            {t(lang, "common", "adminWikiEditVersionsColCreatedBy")}
                          </th>
                          <th className="px-3 py-2 align-middle text-right">
                            {t(lang, "common", "adminWikiEditVersionsColActions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedVersions.map((version) => {
                          const isLatestForLanguage =
                            latestVersionIdsByLang[version.language] ===
                            version.id;

                          return (
                            <tr
                              key={version.id}
                              className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                            >
                              <td className="px-3 py-2 align-middle text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                                  checked={compareSelectionIds.includes(
                                    version.id,
                                  )}
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
                                    setSelectedVersionIdsForDelete(
                                      (current) => {
                                        if (checked) {
                                          if (current.includes(version.id)) {
                                            return current;
                                          }
                                          return [...current, version.id];
                                        }

                                        return current.filter(
                                          (id) => id !== version.id,
                                        );
                                      },
                                    );
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
                                {version.subtitle &&
                                version.subtitle.trim().length > 0
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
                                    {t(lang, "common", "adminWikiEditVersionsActionPreview")}
                                  </button>
                                  {latestVersionIdsByLang[version.language] ===
                                  version.id ? (
                                    <span className="text-xs font-semibold text-zinc-500">
                                      {t(lang, "common", "adminWikiEditVersionsCurrent")}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRollback(version.id)}
                                      disabled={
                                        rollbackVersionId === version.id
                                      }
                                      className="text-sm font-medium text-green-700 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {rollbackVersionId === version.id
                                        ? t(
                                            lang,
                                            "common",
                                            "adminWikiEditVersionsRollbacking",
                                          )
                                        : t(
                                            lang,
                                            "common",
                                            "adminWikiEditVersionsRollback",
                                          )}
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
                                    {t(lang, "common", "adminWikiEditVersionsDelete")}
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
                          {t(lang, "common", "adminWikiEditVersionsCompareHelp")}
                        </span>
                        {compareError && (
                          <span className="text-red-600">{compareError}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-zinc-500">
                          {t(lang, "common", "adminWikiEditPageLabel")} {currentVersionsPage}{" "}
                          {t(lang, "common", "adminWikiEditOfLabel")} {totalVersionsPages} ({totalVisibleVersions}{" "}
                          {t(lang, "common", "adminWikiEditVersionsCountLabel")})
                        </span>
                        <button
                          type="button"
                          onClick={exportVisibleVersionsCsv}
                          disabled={visibleVersions.length === 0}
                          className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--primary)] px-3 py-1 text-xs font-medium text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {t(lang, "common", "adminWikiExportCsv")}
                        </button>
                        <Pagination
                          currentPage={currentVersionsPage}
                          totalPages={totalVersionsPages}
                          onPageChange={(page) => setVersionsPage(page)}
                          pageSize={versionsPageSize}
                          onPageSizeChange={(next) => {
                            setVersionsPage(1);
                            setVersionsPageSize(next);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCompareSelected}
                          disabled={compareSelectionIds.length !== 2}
                          className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--primary)] px-4 py-1.5 text-xs font-medium text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {t(lang, "common", "adminWikiEditVersionsCompareSelected")}
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
                          className="inline-flex items-center rounded-md border border-transparent bg-[color:var(--error)] px-4 py-1.5 text-xs font-medium text-[color:var(--on-error)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {t(lang, "common", "adminWikiEditVersionsDeleteSelected")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </section>
            {comparison && (
              <section
                aria-label={t(lang, "common", "adminWikiEditCompareAria")}
                className="mt-4 border-t border-zinc-200 pt-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {t(lang, "common", "adminWikiEditCompareTitle")}
                    </h3>
                    <p className="text-xs text-zinc-600">
                      {t(lang, "common", "adminWikiEditCompareSubtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    onClick={() => setComparison(null)}
                  >
                    {t(lang, "common", "adminWikiEditCompareClear")}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-zinc-900">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-red-700">
                          {t(lang, "common", "adminWikiEditCompareVersionLabel")} v{comparison.left.version}
                        </p>
                        <p className="text-[11px] text-red-700">
                          {formatDateTime(comparison.left.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        {t(lang, "common", "adminWikiEditCompareOlder")}
                      </span>
                    </div>
                    <div className="mb-1 text-[11px]">
                      <span className="font-semibold text-red-700">
                        {t(lang, "common", "adminWikiEditCompareFieldTitle")}
                      </span>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {comparison.left.title}
                      </span>
                    </div>
                    <div className="mb-1 text-[11px]">
                      <span className="font-semibold text-red-700">
                        {t(lang, "common", "adminWikiEditCompareFieldSubtitle")}
                      </span>{" "}
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
                          {t(lang, "common", "adminWikiEditCompareVersionLabel")} v{comparison.right.version}
                        </p>
                        <p className="text-[11px] text-green-700">
                          {formatDateTime(comparison.right.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        {t(lang, "common", "adminWikiEditCompareNewer")}
                      </span>
                    </div>
                    <div className="mb-1 text-[11px]">
                      <span className="font-semibold text-green-700">
                        {t(lang, "common", "adminWikiEditCompareFieldTitle")}
                      </span>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {renderDiff(
                          comparison.left.title,
                          comparison.right.title,
                        )}
                      </span>
                    </div>
                    <div className="mb-1 text-[11px]">
                      <span className="font-semibold text-green-700">
                        {t(lang, "common", "adminWikiEditCompareFieldSubtitle")}
                      </span>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {renderDiff(
                          comparison.left.subtitle ?? "",
                          comparison.right.subtitle ?? "",
                        )}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                      {renderDiff(
                        comparison.left.content,
                        comparison.right.content,
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-zinc-500">
                  <span className="rounded-sm bg-red-100 px-1 text-red-800 line-through">
                    {t(lang, "common", "adminWikiEditCompareLegendToken")}
                  </span>{" "}
                  {t(lang, "common", "adminWikiEditCompareLegendRemoved")}
                  <span className="rounded-sm bg-green-100 px-1 text-green-800">
                    {t(lang, "common", "adminWikiEditCompareLegendToken")}
                  </span>{" "}
                  {t(lang, "common", "adminWikiEditCompareLegendAdded")}
                </p>
              </section>
            )}
            {viewVersionTarget && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-zinc-900">
                        {t(lang, "common", "adminWikiEditViewVersionTitlePrefix")} v{viewVersionTarget.version} (
                        {viewVersionTarget.language})
                      </h3>
                      <p className="text-xs text-zinc-600">
                        {t(lang, "common", "adminWikiEditViewVersionCreatedAt")} {formatDateTime(viewVersionTarget.createdAt)}
                        {viewVersionTarget.createdBy
                          ? ` ${t(lang, "common", "adminWikiEditViewVersionBy")} ${viewVersionTarget.createdBy}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewVersionId(null)}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      {t(lang, "common", "adminWikiClose")}
                    </button>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <header className="space-y-1 border-b border-zinc-100 pb-3">
                      <h1 className="text-xl font-bold text-zinc-900">
                        {viewVersionTarget.title.trim().length > 0
                          ? viewVersionTarget.title
                          : t(lang, "common", "adminWikiEditPreviewUntitled")}
                      </h1>
                      {viewVersionTarget.subtitle &&
                        viewVersionTarget.subtitle.trim().length > 0 && (
                          <p className="text-sm text-zinc-600">
                            {viewVersionTarget.subtitle}
                          </p>
                        )}
                    </header>
                    <article className="wiki-markdown mt-3 text-sm leading-relaxed">
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
                    {t(lang, "common", "adminWikiEditDeleteVersionTitle")}
                  </h3>
                  <p className="mb-4 text-sm text-zinc-700">
                    {t(lang, "common", "adminWikiEditDeleteVersionDescription")}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={() => setDeleteVersionStep1Id(null)}
                    >
                      {t(lang, "common", "adminWikiClose")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      onClick={() => {
                        setDeleteVersionStep2Id(deleteVersionStep1Id);
                        setDeleteVersionStep1Id(null);
                      }}
                    >
                      {t(lang, "common", "adminWikiOk")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {deleteVersionStep2Id && deleteVersionTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <h3 className="mb-2 text-base font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditDeleteVersionConfirmTitle")}
                  </h3>
                  <p className="mb-3 text-sm text-zinc-700">
                    {t(lang, "common", "adminWikiEditDeleteVersionConfirmDescription")}
                  </p>
                  <p className="mb-3 text-xs text-zinc-600">
                    {t(lang, "common", "adminWikiEditDeleteVersionConfirmMetaPrefix")} v{deleteVersionTarget.version} ({deleteVersionTarget.language}), {t(lang, "common", "adminWikiEditDeleteVersionConfirmMetaCreatedAt")} {formatDateTime(deleteVersionTarget.createdAt)}.
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
                      {t(lang, "common", "adminWikiCancel")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                      onClick={async () => {
                        if (
                          !articleId ||
                          !deleteVersionStep2Id ||
                          !deleteVersionTarget
                        ) {
                          return;
                        }

                        if (
                          latestVersionIdsByLang[
                            deleteVersionTarget.language
                          ] === deleteVersionTarget.id
                        ) {
                          setDeleteVersionError(
                            t(lang, "common", "adminWikiEditDeleteVersionCurrentActiveError"),
                          );
                          return;
                        }

                        if (typeof window === "undefined") {
                          return;
                        }

                        setDeleteVersionError(null);
                        setDeleteVersionSubmitting(true);

                        try {
                          const token = getAccessToken();
                          if (!token) {
                            setDeleteVersionError(
                              t(lang, "common", "adminErrorMissingApiAccess"),
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
                              let errorMessage: unknown = undefined;
                              try {
                                const body = (await res.json()) as unknown;
                                errorMessage = (body as { message?: unknown })
                                  ?.message;
                              } catch {
                                // ignore
                              }

                              const messageText =
                                typeof errorMessage === "string"
                                  ? errorMessage
                                  : "";

                              if (
                                messageText.includes("current active version")
                              ) {
                                setDeleteVersionError(
                                  t(lang, "common", "adminWikiEditDeleteVersionCurrentActiveError"),
                                );
                              } else {
                                setDeleteVersionError(
                                  t(lang, "common", "adminWikiEditDeleteVersionLastVersionError"),
                                );
                              }
                            } else if (res.status === 404) {
                              setDeleteVersionError(
                                t(lang, "common", "adminWikiEditDeleteVersionNotFound"),
                              );
                            } else {
                              setDeleteVersionError(
                                t(lang, "common", "adminWikiEditDeleteVersionError"),
                              );
                            }
                            setDeleteVersionSubmitting(false);
                            return;
                          }

                          setVersions((current) =>
                            current.filter(
                              (v) => v.id !== deleteVersionStep2Id,
                            ),
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
                            t(lang, "common", "adminWikiEditDeleteVersionError"),
                          );
                        } finally {
                          setDeleteVersionSubmitting(false);
                        }
                      }}
                      disabled={deleteVersionSubmitting}
                    >
                      {t(lang, "common", "adminWikiEditDeleteVersionConfirmButton")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {bulkDeleteStep1Open && hasAnySelectedForDelete && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <h3 className="mb-2 text-base font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditBulkDeleteTitle")}
                  </h3>
                  <p className="mb-4 text-sm text-zinc-700">
                    {t(lang, "common", "adminWikiEditBulkDeleteDescriptionPrefix")} {selectedVersionIdsForDelete.length} {t(lang, "common", "adminWikiEditBulkDeleteDescriptionSuffix")}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={() => setBulkDeleteStep1Open(false)}
                    >
                      {t(lang, "common", "adminWikiClose")}
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
                      {t(lang, "common", "adminWikiOk")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {bulkDeleteStep2Open && hasAnySelectedForDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <h3 className="mb-2 text-base font-semibold text-zinc-900">
                    {t(lang, "common", "adminWikiEditBulkDeleteConfirmTitle")}
                  </h3>
                  <p className="mb-3 text-sm text-zinc-700">
                    {t(lang, "common", "adminWikiEditBulkDeleteConfirmDescription")}
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
                      {t(lang, "common", "adminWikiCancel")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                      onClick={async () => {
                        if (
                          !articleId ||
                          selectedVersionIdsForDelete.length === 0
                        ) {
                          return;
                        }

                        if (typeof window === "undefined") {
                          return;
                        }

                        setBulkDeleteError(null);
                        setBulkDeleteSubmitting(true);

                        try {
                          const token = getAccessToken();
                          if (!token) {
                            setBulkDeleteError(
                              t(lang, "common", "adminErrorMissingApiAccess"),
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
                              t(lang, "common", "adminWikiEditBulkDeletePartialError"),
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
                            t(lang, "common", "adminWikiEditBulkDeleteError"),
                          );
                        } finally {
                          setBulkDeleteSubmitting(false);
                        }
                      }}
                      disabled={bulkDeleteSubmitting}
                    >
                      {t(lang, "common", "adminWikiEditBulkDeleteConfirmButton")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
