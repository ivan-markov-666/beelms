"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type LangCode = "bg" | "en" | "de";

type LangSelectionState = Record<LangCode, boolean>;

type LangContentState = Record<
  LangCode,
  {
    title: string;
    content: string;
  }
>;

export default function AdminWikiCreatePage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<LangSelectionState>({
    bg: true,
    en: false,
    de: false,
  });

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "inactive">(
    "draft",
  );
  const [contentByLang, setContentByLang] = useState<LangContentState>({
    bg: { title: "", content: "" },
    en: { title: "", content: "" },
    de: { title: "", content: "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [articleId, setArticleId] = useState<string | null>(null);

  const handleToggleLang = (lang: LangCode) => {
    setLanguages((current) => ({
      ...current,
      [lang]: !current[lang],
    }));
  };

  const handleChangeTitle = (lang: LangCode, value: string) => {
    setContentByLang((current) => ({
      ...current,
      [lang]: {
        ...current[lang],
        title: value,
      },
    }));
  };

  const handleChangeContent = (lang: LangCode, value: string) => {
    setContentByLang((current) => ({
      ...current,
      [lang]: {
        ...current[lang],
        content: value,
      },
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const activeLangs = (Object.keys(languages) as LangCode[]).filter(
      (lang) => languages[lang],
    );

    if (!slug.trim()) {
      setError("Моля, въведете slug за статията.");
      return;
    }

    if (activeLangs.length === 0) {
      setError("Моля, изберете поне един език за съдържанието.");
      return;
    }

    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("qa4free_access_token");
    if (!token) {
      setError(
        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
      );
      return;
    }

    const contents = activeLangs.map((lang) => ({
      language: lang,
      title: contentByLang[lang].title,
      content: contentByLang[lang].content,
    }));

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/wiki/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: slug.trim(), status, contents }),
      });

      if (res.status === 400) {
        setError("Невалидни данни или slug вече съществува.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setError("Възникна грешка при създаване на статията.");
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
      setSuccess("Статията беше създадена успешно.");

      if (newSlug) {
        router.push(`/admin/wiki/${encodeURIComponent(newSlug)}/edit`);
        return;
      }
    } catch {
      setError("Възникна грешка при създаване на статията.");
    } finally {
      setSaving(false);
    }
  };

  const selectedLanguages: LangCode[] = (Object.keys(
    languages,
  ) as LangCode[]).filter((lang) => languages[lang]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <section className="flex items-center text-sm text-gray-500">
        <Link href="/admin" className="hover:text-green-600">
          Admin
        </Link>
        <svg
          className="mx-2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <Link href="/admin/wiki" className="hover:text-green-600">
          Wiki Management
        </Link>
        <svg
          className="mx-2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-gray-900">Create New Article</span>
      </section>

      {/* Page header */}
      <section className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Create New Article
          </h1>
          <p className="text-gray-600">
            Define title, slug, languages, status and content for a new Wiki
            article
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
          Back to list
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
          {/* Languages */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Languages
            </h2>
            <p className="mb-3 text-sm text-gray-600">
              Select the languages for this article. For each selected language a
              separate content block will appear below.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1 text-sm text-gray-700">
                {(["bg", "en", "de"] as LangCode[]).map((lang) => (
                  <label key={lang} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={languages[lang]}
                      onChange={() => handleToggleLang(lang)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="uppercase">{lang}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label
                  htmlFor="wiki-slug"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Slug
                </label>
                <input
                  id="wiki-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="manual-testing-intro"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="wiki-status"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  id="wiki-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "draft" | "active" | "inactive")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3 md:max-w-xs">
                <label
                  htmlFor="wiki-id"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Article ID (read-only)
                </label>
                <input
                  id="wiki-id"
                  type="text"
                  disabled
                  placeholder="Auto-generated on save"
                  value={articleId ?? ""}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Content by language */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Content by language
            </h2>
            <p className="mb-3 text-sm text-gray-600">
              For each selected language, fill in a localized title and main
              body of the article.
            </p>

            <div className="space-y-6">
              {selectedLanguages.map((lang) => {
                const content = contentByLang[lang];

                const headerLabel =
                  lang === "bg" ? "BG content" : lang === "en" ? "EN content" : "DE content";

                const badgeClasses =
                  lang === "bg"
                    ? "bg-green-100 text-green-800"
                    : lang === "en"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800";

                const titleLabel =
                  lang === "bg" ? "Title (BG)" : lang === "en" ? "Title (EN)" : "Title (DE)";

                const contentLabel =
                  lang === "bg"
                    ? "Content (BG)"
                    : lang === "en"
                    ? "Content (EN)"
                    : "Content (DE)";

                return (
                  <div
                    key={lang}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-md font-semibold text-gray-900">
                        {headerLabel}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses}`}
                      >
                        {lang.toUpperCase()}
                      </span>
                    </div>
                    <div className="mb-3">
                      <label
                        htmlFor={`wiki-title-${lang}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {titleLabel}
                      </label>
                      <input
                        id={`wiki-title-${lang}`}
                        type="text"
                        value={content.title}
                        onChange={(event) =>
                          handleChangeTitle(lang, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`wiki-content-${lang}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {contentLabel}
                      </label>
                      <textarea
                        id={`wiki-content-${lang}`}
                        rows={8}
                        value={content.content}
                        onChange={(event) =>
                          handleChangeContent(lang, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="flex flex-col text-sm text-gray-500">
              <p>
                Articles created here are stored in the QA4Free database
                (development environment). Use this form for admin Wiki
                management and automation exercises.
              </p>
              <Link
                href="/admin/wiki"
                className="mt-2 w-max rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
            <div className="flex flex-col items-end space-y-2 text-right">
              <button
                type="submit"
                disabled={saving || articleId !== null}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? "Saving..."
                  : articleId
                    ? "Article saved"
                    : "Save Article"}
              </button>
              {articleId !== null && (
                <p className="text-xs text-gray-500">
                  Статията вече е създадена. За промени използвайте страницата
                  за редакция (Edit).
                </p>
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
