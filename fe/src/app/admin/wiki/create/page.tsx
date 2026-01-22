"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLang } from "../../../../i18n/useCurrentLang";
import { t } from "../../../../i18n/t";
import { getAccessToken } from "../../../auth-token";
import { getApiBaseUrl } from "../../../api-url";
import { AdminBreadcrumbs } from "../../_components/admin-breadcrumbs";
import { InfoTooltip } from "../../_components/info-tooltip";
import Link from "next/link";

const API_BASE_URL = getApiBaseUrl();

const WIKI_SLUG_ALLOWED_REGEX = /^[a-z0-9-]+$/;

export default function AdminWikiCreatePage() {
  const router = useRouter();
  const lang = useCurrentLang();
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);

  const normalizeTags = (raw: string): string[] => {
    const parts = (raw ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const result: string[] = [];

    for (const tag of parts) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(tag);
    }

    return result;
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const trimmedSlug = slug.trim();

    if (trimmedSlug && !WIKI_SLUG_ALLOWED_REGEX.test(trimmedSlug)) {
      setError(t(lang, "common", "adminCoursesCategoriesSlugFormatInvalid"));
      return;
    }

    if (!trimmedSlug) {
      setError(t(lang, "common", "adminWikiCreateSlugRequired"));
      return;
    }

    if (typeof window === "undefined") return;

    const token = getAccessToken();
    if (!token) {
      setError(
        t(lang, "common", "adminErrorMissingApiAccess"),
      );
      return;
    }

    const contents = [
      {
        language: lang,
        title: trimmedSlug,
        content: `# ${trimmedSlug}`,
      },
    ];

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/wiki/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: trimmedSlug,
          status: "draft",
          tags: normalizeTags(tags),
          contents,
        }),
      });

      if (res.status === 400) {
        setError(t(lang, "common", "adminWikiCreateInvalidOrExists"));
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setError(t(lang, "common", "adminWikiCreateError"));
        setSaving(false);
        return;
      }

      const data = (await res.json()) as {
        id?: string;
        slug?: string;
      };
      const newId = data.id ?? null;
      const newSlug = (data.slug ?? slug).trim();

      setArticleId(newId);
      setSuccess(t(lang, "common", "adminWikiCreateSuccess"));

      if (newSlug) {
        router.push(`/admin/wiki/${encodeURIComponent(newSlug)}/edit`);
        return;
      }
    } catch {
      setError(t(lang, "common", "adminWikiCreateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
          {
            label: t(lang, "common", "adminWikiManagementTitle"),
            href: "/admin/wiki",
          },
          { label: t(lang, "common", "adminWikiCreateNewArticle") },
        ]}
      />

      {/* Page header */}
      <section className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            {t(lang, "common", "adminWikiCreateNewArticle")}
          </h1>
          <p className="text-gray-600">
            {t(lang, "common", "adminWikiCreateIntro")}
          </p>
        </div>
        <Link
          href="/admin/wiki"
          className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0 7-7M3 12h18"
            />
          </svg>
          {t(lang, "common", "adminWikiBackToList")}
        </Link>
      </section>

      {/* Form card */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 text-sm text-green-700" role="status">
            {success}
          </p>
        )}
        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t(lang, "common", "adminWikiCreateBasicInformation")}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label
                  htmlFor="wiki-slug"
                  className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <span>{t(lang, "common", "adminWikiCreateSlugLabel")}</span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiCreateSlugLabel")}
                    description={t(lang, "common", "adminWikiCreateSlugPlaceholder")}
                  />
                </label>
                <input
                  id="wiki-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => {
                    const raw = event.target.value ?? "";
                    const normalized = raw.toLowerCase();
                    const sanitized = normalized.replace(/[^a-z0-9-]/g, "");
                    setSlug(sanitized);
                  }}
                  placeholder={t(lang, "common", "adminWikiCreateSlugPlaceholder")}
                  inputMode="text"
                  pattern="[a-z0-9-]*"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label
                  htmlFor="wiki-tags"
                  className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <span>{t(lang, "common", "adminWikiCreateTagsLabel")}</span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiCreateTagsLabel")}
                    description={t(lang, "common", "adminWikiCreateTagsPlaceholder")}
                  />
                </label>
                <input
                  id="wiki-tags"
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder={t(lang, "common", "adminWikiCreateTagsPlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3 md:max-w-xs">
                <label
                  htmlFor="wiki-id"
                  className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <span>{t(lang, "common", "adminWikiCreateArticleIdLabel")}</span>
                  <InfoTooltip
                    label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
                    title={t(lang, "common", "adminWikiCreateArticleIdLabel")}
                    description={t(
                      lang,
                      "common",
                      "adminWikiCreateArticleIdPlaceholder",
                    )}
                  />
                </label>
                <input
                  id="wiki-id"
                  type="text"
                  disabled
                  placeholder={t(lang, "common", "adminWikiCreateArticleIdPlaceholder")}
                  value={articleId ?? ""}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="flex flex-col text-sm text-gray-500">
              <p>
                {t(lang, "common", "adminWikiCreateFooterNote")}
              </p>
              <Link
                href="/admin/wiki"
                className="mt-2 w-max rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t(lang, "common", "adminWikiCancel")}
              </Link>
            </div>
            <div className="flex flex-col items-end space-y-2 text-right">
              <button
                type="submit"
                disabled={saving || articleId !== null}
                className="rounded-lg border border-[color:var(--primary)] bg-[color:var(--primary)] px-6 py-2 text-sm font-semibold text-[color:var(--on-primary)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? t(lang, "common", "adminWikiCreateSaving")
                  : articleId
                    ? t(lang, "common", "adminWikiCreateArticleSaved")
                    : t(lang, "common", "adminWikiCreateSaveArticle")}
              </button>
              {articleId !== null && (
                <p className="text-xs text-gray-500">
                  {t(lang, "common", "adminWikiCreateAlreadyCreatedNote")}
                </p>
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
