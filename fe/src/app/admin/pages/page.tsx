"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { WikiMarkdown } from "../../wiki/_components/wiki-markdown";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

const WikiRichEditor = dynamic(
  () =>
    import("../wiki/_components/wiki-rich-editor").then(
      (m) => m.WikiRichEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        Зареждане на rich editor...
      </div>
    ),
  },
);

type LegalPage = {
  slug: string;
  title: string;
  contentMarkdown: string;
  titleByLang?: Record<string, string> | null;
  contentMarkdownByLang?: Record<string, string> | null;
  updatedAt: string;
};

type CustomPage = {
  id: string;
  slug: string;
  title: string;
  contentMarkdown: string;
  titleByLang?: Record<string, string> | null;
  contentMarkdownByLang?: Record<string, string> | null;
  isPublished: boolean;
  updatedAt: string;
};

type StringDictionary = Record<string, string>;

const NOT_FOUND_PAGE_KEY = "__not_found_page__" as const;

const CUSTOM_PAGE_PREFIX = "custom:" as const;
const CUSTOM_NEW_PAGE_KEY = "__custom_new_page__" as const;

const sanitizeStringDictionary = (
  incoming: Record<string, string | null> | null | undefined,
): StringDictionary => {
  const out: StringDictionary = {};
  const obj = incoming ?? {};
  for (const [rawKey, rawValue] of Object.entries(obj)) {
    const key = (rawKey ?? "").trim().toLowerCase();
    if (!key) continue;
    const value = (rawValue ?? "").trim();
    if (!value) continue;
    out[key] = value;
  }
  return out;
};

const upsertStringDictionary = (
  dict: StringDictionary,
  key: string,
  value: string,
): StringDictionary => {
  const normalizedKey = (key ?? "").trim().toLowerCase();
  if (!normalizedKey) return dict;
  const next: StringDictionary = { ...dict };
  const v = (value ?? "").trim();
  if (v) {
    next[normalizedKey] = v;
  } else {
    delete next[normalizedKey];
  }
  return next;
};

type AdminSettingsDto = {
  branding?: {
    notFoundTitle?: string | null;
    notFoundMarkdown?: string | null;
    notFoundTitleByLang?: Record<string, string | null> | null;
    notFoundMarkdownByLang?: Record<string, string | null> | null;
    pageLinks?: {
      enabled?: boolean;
      bySlug?: Record<
        string,
        {
          url?: boolean;
          header?: boolean;
          footer?: boolean;
        }
      > | null;
    } | null;
  };
  languages?: {
    supported?: string[];
    default?: string;
  };
};

const LEGAL_PAGE_SLUGS = new Set([
  "about",
  "terms",
  "privacy",
  "cookie-policy",
  "imprint",
  "accessibility",
]);

const OTHER_PAGE_SLUGS = new Set(["contact", "faq", "support"]);

type PageLinksBySlug = Record<
  string,
  { url: boolean; header: boolean; footer: boolean }
>;

const sanitizePageLinksBySlug = (
  incoming:
    | Record<
        string,
        { url?: boolean; header?: boolean; footer?: boolean } | null
      >
    | null
    | undefined,
): PageLinksBySlug => {
  const obj = incoming ?? {};
  const out: PageLinksBySlug = {};
  for (const [rawSlug, rawValue] of Object.entries(obj)) {
    const slug = (rawSlug ?? "").trim().toLowerCase();
    if (!slug) continue;
    const rec = rawValue ?? {};
    out[slug] = {
      url: (rec as { url?: boolean }).url !== false,
      header: rec.header === true,
      footer: rec.footer === true,
    };
  }
  return out;
};

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        backgroundColor: checked ? "var(--primary)" : "#e5e7eb",
        borderColor: checked ? "var(--primary)" : "#d1d5db",
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AdminPagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pages, setPages] = useState<LegalPage[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [defaultLang, setDefaultLang] = useState<string>("bg");
  const [editingLang, setEditingLang] = useState<string>("__global");

  const [pageLinksBySlug, setPageLinksBySlug] = useState<PageLinksBySlug>({});

  const isNotFoundSelected = selectedKey === NOT_FOUND_PAGE_KEY;
  const isCustomNewSelected = selectedKey === CUSTOM_NEW_PAGE_KEY;
  const isCustomSelected =
    isCustomNewSelected || selectedKey.startsWith(CUSTOM_PAGE_PREFIX);
  const selectedCustomId = selectedKey.startsWith(CUSTOM_PAGE_PREFIX)
    ? selectedKey.slice(CUSTOM_PAGE_PREFIX.length)
    : null;

  const selectedCustom = useMemo(() => {
    if (!selectedCustomId) return null;
    return customPages.find((p) => p.id === selectedCustomId) ?? null;
  }, [customPages, selectedCustomId]);

  const selectedLegal = useMemo(() => {
    if (isNotFoundSelected || isCustomSelected) return null;
    return pages.find((p) => p.slug === selectedKey) ?? null;
  }, [isCustomSelected, isNotFoundSelected, pages, selectedKey]);

  const selected = selectedCustom ?? selectedLegal;

  const selectedLabel = useMemo(() => {
    if (!selected) return null;
    const title = (selected.title ?? "").trim();
    return title.length > 0 ? title : selected.slug;
  }, [selected]);

  const [customSlug, setCustomSlug] = useState<string>("");
  const [customIsPublished, setCustomIsPublished] = useState<boolean>(true);

  const [title, setTitle] = useState<string>("");
  const [contentMarkdown, setContentMarkdown] = useState<string>("");
  const [titleByLang, setTitleByLang] = useState<StringDictionary>({});
  const [contentMarkdownByLang, setContentMarkdownByLang] =
    useState<StringDictionary>({});

  const [notFoundTitle, setNotFoundTitle] = useState<string>("");
  const [notFoundMarkdown, setNotFoundMarkdown] = useState<string>("");
  const [notFoundTitleByLang, setNotFoundTitleByLang] =
    useState<StringDictionary>({});
  const [notFoundMarkdownByLang, setNotFoundMarkdownByLang] =
    useState<StringDictionary>({});
  const [notFoundEditingLang, setNotFoundEditingLang] =
    useState<string>("__global");

  const navItemBaseClass =
    "w-full rounded-md border px-3 py-2 text-sm transition";
  const navItemActiveClass =
    "border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_12%,var(--card))] text-[color:var(--foreground)] shadow-sm";
  const navItemDefaultClass =
    "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))]";
  const navItemUnpublishedClass =
    "border-[color:var(--error)] bg-[color:color-mix(in_srgb,var(--error)_18%,var(--card))] text-[color:var(--error)]";

  const legalMarkdownValue =
    editingLang === "__global"
      ? contentMarkdown
      : (contentMarkdownByLang[editingLang] ?? "");

  const handleLegalMarkdownChange = (next: string) => {
    if (editingLang === "__global") {
      setContentMarkdown(next);
      return;
    }
    setContentMarkdownByLang((prev) =>
      upsertStringDictionary(prev, editingLang, next),
    );
  };

  const notFoundMarkdownValue =
    notFoundEditingLang === "__global"
      ? notFoundMarkdown
      : (notFoundMarkdownByLang[notFoundEditingLang] ?? "");

  const handleNotFoundMarkdownChange = (next: string) => {
    if (notFoundEditingLang === "__global") {
      setNotFoundMarkdown(next);
      return;
    }
    setNotFoundMarkdownByLang((prev) =>
      upsertStringDictionary(prev, notFoundEditingLang, next),
    );
  };

  useEffect(() => {
    if (isNotFoundSelected) return;

    if (isCustomNewSelected) {
      setEditingLang("__global");
      setCustomSlug("");
      setCustomIsPublished(true);
      setTitle("");
      setContentMarkdown("");
      setTitleByLang({});
      setContentMarkdownByLang({});
      return;
    }

    if (selectedCustom) {
      setEditingLang("__global");
      setCustomSlug(selectedCustom.slug ?? "");
      setCustomIsPublished(selectedCustom.isPublished === true);
      setTitle(selectedCustom.title ?? "");
      setContentMarkdown(selectedCustom.contentMarkdown ?? "");
      setTitleByLang(sanitizeStringDictionary(selectedCustom.titleByLang));
      setContentMarkdownByLang(
        sanitizeStringDictionary(selectedCustom.contentMarkdownByLang),
      );
      return;
    }

    if (selectedLegal) {
      setEditingLang("__global");
      setTitle(selectedLegal.title ?? "");
      setContentMarkdown(selectedLegal.contentMarkdown ?? "");
      setTitleByLang(sanitizeStringDictionary(selectedLegal.titleByLang));
      setContentMarkdownByLang(
        sanitizeStringDictionary(selectedLegal.contentMarkdownByLang),
      );
    }
  }, [isCustomNewSelected, isNotFoundSelected, selectedCustom, selectedLegal]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const [pagesRes, settingsRes, customRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/legal/pages`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/admin/settings`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/admin/custom-pages`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (
          pagesRes.status === 401 ||
          settingsRes.status === 401 ||
          customRes.status === 401
        ) {
          router.replace("/auth/login");
          return;
        }

        if (!pagesRes.ok) {
          if (!cancelled) {
            setError("Неуспешно зареждане на legal pages.");
          }
          return;
        }

        const data = (await pagesRes.json()) as LegalPage[];

        if (cancelled) return;

        const safe = Array.isArray(data) ? data : [];
        setPages(safe);

        if (customRes.ok) {
          const customData = (await customRes.json()) as CustomPage[];
          const safeCustom = Array.isArray(customData) ? customData : [];
          setCustomPages(safeCustom);
        } else {
          setCustomPages([]);
        }

        const defaultSlug = safe[0]?.slug ?? "";
        setSelectedKey(defaultSlug);

        if (settingsRes.ok) {
          const settings = (await settingsRes.json()) as AdminSettingsDto;
          const langs = Array.isArray(settings.languages?.supported)
            ? settings.languages?.supported
                .map((l) => (l ?? "").trim().toLowerCase())
                .filter(Boolean)
            : [];
          setSupportedLangs(langs.length > 0 ? langs : ["bg"]);
          setDefaultLang(
            (settings.languages?.default ?? "").trim().toLowerCase() ||
              (langs[0] ?? "bg"),
          );

          const pl = settings.branding?.pageLinks ?? null;
          setPageLinksBySlug(sanitizePageLinksBySlug(pl?.bySlug ?? null));
          setNotFoundTitle(settings.branding?.notFoundTitle ?? "");
          setNotFoundMarkdown(settings.branding?.notFoundMarkdown ?? "");
          setNotFoundTitleByLang(
            sanitizeStringDictionary(settings.branding?.notFoundTitleByLang),
          );
          setNotFoundMarkdownByLang(
            sanitizeStringDictionary(settings.branding?.notFoundMarkdownByLang),
          );
        }
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при връзката със сървъра.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const getPublicPathForSlug = (slug: string): string | null => {
    if (!slug) return null;
    if (slug === "about") return "/about";
    if (slug === "terms") return "/legal/terms";
    if (slug === "privacy") return "/legal/privacy";
    if (
      slug === "cookie-policy" ||
      slug === "imprint" ||
      slug === "accessibility"
    ) {
      return `/legal/${slug}`;
    }
    if (slug === "contact") return "/contact";
    if (slug === "faq") return "/faq";
    if (slug === "support") return "/support";
    return `/p/${slug}`;
  };

  const getAbsoluteUrl = (path: string): string => {
    if (typeof window === "undefined") return path;
    const origin = window.location.origin;
    return `${origin}${path}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {
      // ignore
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      // ignore
    }
  };

  const persistBrandingPageLinks = async (patch: {
    enabled?: boolean;
    bySlug?: Record<
      string,
      { url?: boolean; header?: boolean; footer?: boolean }
    >;
  }) => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            pageLinks: patch,
          },
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на page links.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsDto;
      const pl = updated.branding?.pageLinks ?? null;
      setPageLinksBySlug(sanitizePageLinksBySlug(pl?.bySlug ?? null));
      setSuccess("Запазено.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  const setPageUrlEnabledForSlug = async (slug: string, value: boolean) => {
    const normalizedSlug = (slug ?? "").trim().toLowerCase();
    if (!normalizedSlug) return;

    const current = pageLinksBySlug[normalizedSlug] ?? {
      url: true,
      header: false,
      footer: false,
    };

    const next = {
      ...current,
      url: value,
    };

    setPageLinksBySlug((prev) => ({
      ...prev,
      [normalizedSlug]: next,
    }));

    await persistBrandingPageLinks({
      bySlug: {
        [normalizedSlug]: next,
      },
    });
  };

  const setPageLinkToggle = async (
    slug: string,
    key: "header" | "footer",
    value: boolean,
  ) => {
    const normalizedSlug = (slug ?? "").trim().toLowerCase();
    if (!normalizedSlug) return;

    const existing = pageLinksBySlug[normalizedSlug] ?? {
      url: true,
      header: false,
      footer: false,
    };

    const next = {
      ...existing,
      [key]: value,
    } as const;

    setPageLinksBySlug((prev) => ({
      ...prev,
      [normalizedSlug]: {
        url: prev[normalizedSlug]?.url !== false,
        header: prev[normalizedSlug]?.header === true,
        footer: prev[normalizedSlug]?.footer === true,
        [key]: value,
      },
    }));

    await persistBrandingPageLinks({
      bySlug: {
        [normalizedSlug]: next,
      },
    });
  };

  const legalPages = useMemo(
    () => pages.filter((p) => LEGAL_PAGE_SLUGS.has(p.slug)),
    [pages],
  );

  const otherPages = useMemo(
    () => pages.filter((p) => OTHER_PAGE_SLUGS.has(p.slug)),
    [pages],
  );

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    if (isNotFoundSelected) {
      setError("Избери legal страница за редакция.");
      return;
    }

    if (isCustomSelected) {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const nextSlug = (customSlug ?? "").trim().toLowerCase();
      const nextTitle = (title ?? "").trim();
      const nextContent = contentMarkdown ?? "";
      const nextTitleByLang =
        Object.keys(titleByLang).length > 0 ? titleByLang : null;
      const nextContentByLang =
        Object.keys(contentMarkdownByLang).length > 0
          ? contentMarkdownByLang
          : null;

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nextSlug)) {
        setError("Slug трябва да е малки букви/цифри и тирета.");
        return;
      }

      if (nextContent.trim().length < 1) {
        setError("Content (markdown) не може да е празно.");
        return;
      }

      setSaving(true);

      try {
        const url = isCustomNewSelected
          ? `${API_BASE_URL}/admin/custom-pages`
          : selectedCustom
            ? `${API_BASE_URL}/admin/custom-pages/${selectedCustom.id}`
            : null;

        if (!url) {
          setError("Избери custom страница.");
          return;
        }

        const method = isCustomNewSelected ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: nextSlug,
            title: nextTitle.length > 0 ? nextTitle : nextSlug,
            contentMarkdown: nextContent,
            titleByLang: nextTitleByLang,
            contentMarkdownByLang: nextContentByLang,
            isPublished: customIsPublished,
          }),
        });

        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!res.ok) {
          setError("Неуспешно запазване на custom страницата.");
          return;
        }

        const updated = (await res.json()) as CustomPage;

        setCustomPages((prev) => {
          const without = prev.filter((p) => p.id !== updated.id);
          const next = [...without, updated];
          next.sort((a, b) => (a.slug || "").localeCompare(b.slug || ""));
          return next;
        });

        setSelectedKey(`${CUSTOM_PAGE_PREFIX}${updated.id}`);
        setSuccess("Запазено.");
      } catch {
        setError("Възникна грешка при връзката със сървъра.");
      } finally {
        setSaving(false);
      }

      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const nextTitle = (title ?? "").trim();
    const nextContent = contentMarkdown ?? "";
    const nextTitleByLang =
      Object.keys(titleByLang).length > 0 ? titleByLang : null;
    const nextContentByLang =
      Object.keys(contentMarkdownByLang).length > 0
        ? contentMarkdownByLang
        : null;

    if (nextContent.trim().length < 1) {
      setError("Content (markdown) не може да е празно.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/legal/pages/${selectedKey}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: nextTitle.length > 0 ? nextTitle : undefined,
            contentMarkdown: nextContent,
            titleByLang: nextTitleByLang,
            contentMarkdownByLang: nextContentByLang,
          }),
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на legal съдържанието.");
        return;
      }

      const updated = (await res.json()) as LegalPage;

      setPages((prev) =>
        prev.map((p) => (p.slug === updated.slug ? updated : p)),
      );

      setSuccess("Запазено.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveNotFound = async () => {
    setError(null);
    setSuccess(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            notFoundTitle: (notFoundTitle ?? "").trim() || null,
            notFoundMarkdown: (notFoundMarkdown ?? "").trim() || null,
            notFoundTitleByLang:
              Object.keys(notFoundTitleByLang).length > 0
                ? notFoundTitleByLang
                : null,
            notFoundMarkdownByLang:
              Object.keys(notFoundMarkdownByLang).length > 0
                ? notFoundMarkdownByLang
                : null,
          },
        }),
      });

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно запазване на 404 страницата.");
        return;
      }

      const updated = (await res.json()) as AdminSettingsDto;
      setNotFoundTitle(updated.branding?.notFoundTitle ?? "");
      setNotFoundMarkdown(updated.branding?.notFoundMarkdown ?? "");
      setNotFoundTitleByLang(
        sanitizeStringDictionary(updated.branding?.notFoundTitleByLang),
      );
      setNotFoundMarkdownByLang(
        sanitizeStringDictionary(updated.branding?.notFoundMarkdownByLang),
      );

      setSuccess("Запазено.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteCustom = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCustom) {
      setError("Избери custom страница за изтриване.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/custom-pages/${selectedCustom.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!res.ok) {
        setError("Неуспешно изтриване на custom страницата.");
        return;
      }

      setCustomPages((prev) => prev.filter((p) => p.id !== selectedCustom.id));
      setSelectedKey(pages[0]?.slug ?? "");
      setSuccess("Изтрито.");
    } catch {
      setError("Възникна грешка при връзката със сървъра.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <AdminBreadcrumbs
          items={[{ label: "Админ табло", href: "/admin" }, { label: "Pages" }]}
        />
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold text-zinc-900">Pages</h1>
          <InfoTooltip
            label="Pages info"
            title="Pages"
            description="Редактираш Legal страници, custom съдържание (markdown) и 404 страницата. Включва контрол кои страници са публично достъпни."
          />
        </div>
        <p className="text-sm text-zinc-600">Edit + preview (markdown).</p>
      </header>

      {loading && <p className="text-sm text-zinc-600">Зареждане...</p>}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Pages</h2>
            <div className="mt-3 space-y-2">
              <div className="pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Legal
              </div>
              {pages.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Няма налични legal страници.
                </p>
              ) : (
                legalPages.map((p) => {
                  const active = p.slug === selectedKey;
                  return (
                    <div
                      key={p.slug}
                      className={`${navItemBaseClass} ${active ? navItemActiveClass : navItemDefaultClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedKey(p.slug)}
                        className="min-w-0 w-full text-left"
                      >
                        <div className="font-medium">{p.slug}</div>
                        <div className="text-xs text-gray-500">{p.title}</div>
                      </button>
                    </div>
                  );
                })
              )}

              <div className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Other Pages
              </div>
              {otherPages.map((p) => {
                const active = p.slug === selectedKey;
                return (
                  <div
                    key={p.slug}
                    className={`${navItemBaseClass} ${active ? navItemActiveClass : navItemDefaultClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedKey(p.slug)}
                      className="min-w-0 w-full text-left"
                    >
                      <div className="font-medium">{p.slug}</div>
                      <div className="text-xs text-gray-500">{p.title}</div>
                    </button>
                  </div>
                );
              })}

              <div className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Custom Pages
              </div>

              <button
                type="button"
                onClick={() => setSelectedKey(CUSTOM_NEW_PAGE_KEY)}
                disabled={saving}
                className={`${navItemBaseClass} ${navItemDefaultClass} text-left disabled:opacity-70`}
              >
                <div className="font-medium">+ New custom page</div>
                <div className="text-xs text-gray-500">
                  Create a new page under /p/&lt;slug&gt;
                </div>
              </button>

              {customPages.length === 0 ? (
                <p className="text-sm text-gray-600">Няма custom страници.</p>
              ) : (
                customPages.map((p) => {
                  const key = `${CUSTOM_PAGE_PREFIX}${p.id}`;
                  const active = key === selectedKey;
                  const statusClass = active
                    ? navItemActiveClass
                    : p.isPublished
                      ? navItemDefaultClass
                      : navItemUnpublishedClass;
                  return (
                    <div
                      key={p.id}
                      className={`${navItemBaseClass} ${statusClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedKey(key)}
                        className="min-w-0 w-full text-left"
                      >
                        <div className="font-medium">{p.slug}</div>
                        <div className="text-xs text-gray-500">{p.title}</div>
                      </button>
                    </div>
                  );
                })
              )}

              <div
                className={`${navItemBaseClass} ${isNotFoundSelected ? navItemActiveClass : navItemDefaultClass}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedKey(NOT_FOUND_PAGE_KEY)}
                  className="min-w-0 w-full text-left"
                >
                  <div className="font-medium">404</div>
                  <div className="text-xs text-gray-500">Not found page</div>
                </button>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-4">
            {!isNotFoundSelected ? (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedLabel ?? "Edit page"}
                  </h2>

                  {selected ? (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col gap-3">
                        {(() => {
                          const slugRaw = isCustomSelected
                            ? customSlug
                            : selected.slug;
                          const slug = (slugRaw ?? "").trim().toLowerCase();
                          const rec = pageLinksBySlug[slug] ?? {
                            url: true,
                            header: false,
                            footer: false,
                          };

                          const urlEnabled = rec.url !== false;
                          const path = slug ? getPublicPathForSlug(slug) : null;
                          const defaultUrl = path ? getAbsoluteUrl(path) : null;
                          const langParam =
                            editingLang === "__global"
                              ? defaultLang
                              : editingLang;
                          const langUrl =
                            path && langParam
                              ? getAbsoluteUrl(
                                  `${path}?lang=${encodeURIComponent(langParam)}`,
                                )
                              : null;

                          return (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900">
                                    URL
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    URL toggle контролира дали страницата е
                                    достъпна (404). Header/Footer toggle-ите
                                    контролират само линковете.
                                  </div>
                                </div>
                                <ToggleSwitch
                                  checked={urlEnabled}
                                  disabled={saving || !slug}
                                  label="URL"
                                  onChange={(next) =>
                                    void setPageUrlEnabledForSlug(slug, next)
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-gray-700">
                                      Header link
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Show this page in header
                                    </div>
                                  </div>
                                  <ToggleSwitch
                                    checked={rec.header === true}
                                    disabled={saving || !urlEnabled}
                                    label="Header link"
                                    onChange={(next) =>
                                      void setPageLinkToggle(
                                        slug,
                                        "header",
                                        next,
                                      )
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-gray-700">
                                      Footer link
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Show this page in footer
                                    </div>
                                  </div>
                                  <ToggleSwitch
                                    checked={rec.footer === true}
                                    disabled={saving || !urlEnabled}
                                    label="Footer link"
                                    onChange={(next) =>
                                      void setPageLinkToggle(
                                        slug,
                                        "footer",
                                        next,
                                      )
                                    }
                                  />
                                </div>

                                <div className="md:col-span-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                                  <div className="text-xs font-semibold text-gray-700">
                                    Page URL
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                      <div className="min-w-0">
                                        <div className="text-[11px] text-gray-500">
                                          Default
                                        </div>
                                        <div className="truncate text-xs text-gray-900">
                                          {defaultUrl ?? "(no public route)"}
                                        </div>
                                      </div>
                                      {defaultUrl ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            onClick={() =>
                                              void copyToClipboard(defaultUrl)
                                            }
                                          >
                                            Copy
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            onClick={() =>
                                              window.open(defaultUrl, "_blank")
                                            }
                                          >
                                            Open
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                      <div className="min-w-0">
                                        <div className="text-[11px] text-gray-500">
                                          With lang ({langParam})
                                        </div>
                                        <div className="truncate text-xs text-gray-900">
                                          {langUrl ?? "(no public route)"}
                                        </div>
                                      </div>
                                      {langUrl ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            onClick={() =>
                                              void copyToClipboard(langUrl)
                                            }
                                          >
                                            Copy
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            onClick={() =>
                                              window.open(langUrl, "_blank")
                                            }
                                          >
                                            Open
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : null}

                  {isCustomSelected ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Slug
                        </label>
                        <input
                          value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value)}
                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                          placeholder="my-page"
                          disabled={saving}
                        />
                      </div>
                      <div className="flex items-end justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-700">
                            Published
                          </div>
                          <div className="text-xs text-gray-500">
                            Show this page publicly
                          </div>
                        </div>
                        <ToggleSwitch
                          checked={customIsPublished}
                          disabled={saving}
                          label="Published"
                          onChange={(next) => setCustomIsPublished(next)}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Language override
                      </label>
                      <div className="mt-2">
                        <ListboxSelect
                          ariaLabel="Language override"
                          value={editingLang}
                          onChange={(next) => setEditingLang(next)}
                          disabled={saving}
                          buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-60"
                          options={[
                            { value: "__global", label: "Global (default)" },
                            ...supportedLangs.map((lang) => ({
                              value: lang,
                              label: lang,
                            })),
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        value={
                          editingLang === "__global"
                            ? title
                            : (titleByLang[editingLang] ?? "")
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (editingLang === "__global") {
                            setTitle(v);
                            return;
                          }
                          setTitleByLang((prev) =>
                            upsertStringDictionary(prev, editingLang, v),
                          );
                        }}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="Terms and Conditions"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <div className="mt-2">
                        <WikiRichEditor
                          markdown={legalMarkdownValue}
                          onChangeMarkdown={handleLegalMarkdownChange}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {saving ? "Запазване..." : "Запази"}
                      </button>
                      {isCustomSelected && selectedCustom ? (
                        <button
                          type="button"
                          onClick={onDeleteCustom}
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                          style={{
                            backgroundColor: "var(--error)",
                            borderColor: "var(--error)",
                            color: "var(--on-error)",
                          }}
                        >
                          Изтрий
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Preview
                  </h2>
                  <article className="wiki-markdown mt-4 w-full text-base leading-relaxed">
                    <WikiMarkdown
                      content={
                        (editingLang === "__global"
                          ? contentMarkdown
                          : (contentMarkdownByLang[editingLang] ?? "") ||
                            contentMarkdown) || ""
                      }
                    />
                  </article>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    404 page
                  </h2>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Language override
                      </label>
                      <div className="mt-2">
                        <ListboxSelect
                          ariaLabel="Language override (404 page)"
                          value={notFoundEditingLang}
                          onChange={(next) => setNotFoundEditingLang(next)}
                          disabled={saving}
                          buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-60"
                          options={[
                            { value: "__global", label: "Global (default)" },
                            ...supportedLangs.map((lang) => ({
                              value: lang,
                              label: lang,
                            })),
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        value={
                          notFoundEditingLang === "__global"
                            ? notFoundTitle
                            : (notFoundTitleByLang[notFoundEditingLang] ?? "")
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (notFoundEditingLang === "__global") {
                            setNotFoundTitle(v);
                            return;
                          }
                          setNotFoundTitleByLang((prev) =>
                            upsertStringDictionary(
                              prev,
                              notFoundEditingLang,
                              v,
                            ),
                          );
                        }}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder="Страницата не е намерена"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <div className="mt-2">
                        <WikiRichEditor
                          markdown={notFoundMarkdownValue}
                          onChangeMarkdown={handleNotFoundMarkdownChange}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onSaveNotFound}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-70"
                        style={{
                          backgroundColor: "var(--primary)",
                          borderColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {saving ? "Запазване..." : "Запази"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Preview
                  </h2>
                  <article className="wiki-markdown mt-4 w-full text-base leading-relaxed">
                    {(() => {
                      const effectiveMarkdown =
                        notFoundEditingLang === "__global"
                          ? notFoundMarkdown
                          : (notFoundMarkdownByLang[notFoundEditingLang] ??
                              "") ||
                            notFoundMarkdown;
                      if ((effectiveMarkdown ?? "").trim().length < 1) {
                        return (
                          <p className="text-sm text-gray-500 italic">
                            (Няма зададен Markdown.)
                          </p>
                        );
                      }
                      return <WikiMarkdown content={effectiveMarkdown} />;
                    })()}
                  </article>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
