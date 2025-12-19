"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const PAGE_SIZE = 10;

type AdminWikiArticle = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
};

function formatDateTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateIso;
  }
}

function getStatusBadge(status: string): { label: string; className: string } {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return {
      label: "Active",
      className:
        "border-green-200 bg-green-50 text-green-700",
    };
  }

  if (normalized === "draft") {
    return {
      label: "Draft",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (normalized === "inactive") {
    return {
      label: "Inactive",
      className: "border-zinc-200 bg-zinc-50 text-zinc-600",
    };
  }

  return {
    label: status,
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
  };
}

export default function AdminWikiPage() {
  const headerLang = useCurrentLang();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<AdminWikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [languagesByArticleId, setLanguagesByArticleId] = useState<
    Record<string, string[]>
  >({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [deleteArticleStep1Id, setDeleteArticleStep1Id] =
    useState<string | null>(null);
  const [deleteArticleStep2Id, setDeleteArticleStep2Id] =
    useState<string | null>(null);
  const [deleteArticleError, setDeleteArticleError] = useState<string | null>(
    null,
  );
  const [deleteArticleSubmitting, setDeleteArticleSubmitting] =
    useState(false);
  const [didInitFromQuery, setDidInitFromQuery] = useState(false);

  const deleteArticleTarget =
    deleteArticleStep2Id == null
      ? null
      : articles.find((article) => article.id === deleteArticleStep2Id) ?? null;

  useEffect(() => {
    if (!didInitFromQuery) {
      const statusParam = (searchParams.get("status") ?? "").toLowerCase();
      if (
        statusParam === "draft" ||
        statusParam === "active" ||
        statusParam === "inactive"
      ) {
        setStatusFilter(statusParam);
      }
      setDidInitFromQuery(true);
    }

    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setError(
              "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
            );
            setLoading(false);
          }
          return;
        }
        const effectiveLang = (languageFilter || headerLang || "").toLowerCase();

        let url = `${API_BASE_URL}/admin/wiki/articles`;
        if (effectiveLang) {
          url += `?lang=${encodeURIComponent(effectiveLang)}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) {
            setError(
              "Възникна грешка при зареждане на Admin Wiki списъка.",
            );
            setLoading(false);
          }
          return;
        }

        const data = (await res.json()) as AdminWikiArticle[];

        if (cancelled) return;

        setArticles(data ?? []);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Възникна грешка при зареждане на Admin Wiki списъка.");
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [languageFilter, headerLang, didInitFromQuery, searchParams]);

  useEffect(() => {
    if (!articles.length) {
      setLanguagesByArticleId({});
      return;
    }

    if (typeof window === "undefined") return;

    let cancelled = false;

    type AdminWikiArticleVersion = {
      id: string;
      version: number;
      language: string;
      title: string;
      createdAt: string;
      createdBy: string | null;
    };

    const loadLanguages = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }

        const entries = await Promise.all(
          articles.map(async (article) => {
            try {
              const res = await fetch(
                `${API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
                  article.id,
                )}/versions`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (!res.ok) {
                return [article.id, [] as string[]] as const;
              }

              const data = (await res.json()) as AdminWikiArticleVersion[];
              const uniqueLangs = Array.from(
                new Set(
                  (data ?? [])
                    .map((version) => version.language)
                    .filter((lng): lng is string => !!lng),
                ),
              );

              return [article.id, uniqueLangs] as const;
            } catch {
              return [article.id, [] as string[]] as const;
            }
          }),
        );

        if (cancelled) return;

        const next: Record<string, string[]> = {};
        for (const [id, langs] of entries) {
          next[id] = langs;
        }
        setLanguagesByArticleId(next);
      } catch {
        if (!cancelled) {
          setLanguagesByArticleId({});
        }
      }
    };

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, [articles]);

  const trimmedSearch = search.trim().toLowerCase();

  const filteredArticles = articles.filter((article) => {
    if (trimmedSearch) {
      const inTitle = (article.title ?? "").toLowerCase().includes(trimmedSearch);
      const inSlug = (article.slug ?? "").toLowerCase().includes(trimmedSearch);
      if (!inTitle && !inSlug) {
        return false;
      }
    }

    if (statusFilter) {
      if (article.status.toLowerCase() !== statusFilter) {
        return false;
      }
    }

    if (languageFilter) {
      const langs = languagesByArticleId[article.id] ?? [];
      if (!langs.some((lng) => lng.toLowerCase() === languageFilter)) {
        return false;
      }
    }

    return true;
  });

  const hasArticles = !loading && !error && filteredArticles.length > 0;
  const noArticles = !loading && !error && filteredArticles.length === 0;

  const [currentPage, setCurrentPage] = useState(1);

  const totalArticles = filteredArticles.length;
  const totalPages = totalArticles > 0 ? Math.ceil(totalArticles / PAGE_SIZE) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageArticles = filteredArticles.slice(startIndex, endIndex);
  const showingFrom = totalArticles === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalArticles);

  const handleToggleStatus = async (article: AdminWikiArticle) => {
    if (typeof window === "undefined") return;

    setStatusUpdateError(null);
    setStatusUpdatingId(article.id);

    const current = article.status.toLowerCase();
    if (current !== "active" && current !== "inactive") {
      setStatusUpdatingId(null);
      return;
    }
    const nextStatus = current === "inactive" ? "active" : "inactive";

    const previousArticles = articles;
    const optimistic = articles.map((item) =>
      item.id === article.id ? { ...item, status: nextStatus } : item,
    );
    setArticles(optimistic);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("missing-token");
      }

      const res = await fetch(
        `${API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
          article.id,
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!res.ok) {
        throw new Error(`failed-${res.status}`);
      }
    } catch {
      setArticles(previousArticles);
      setStatusUpdateError(
        "Възникна грешка при промяна на статуса на статията.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const metricsTotalArticles = articles.length;
  const metricsActiveArticles = articles.filter(
    (article) => article.status.toLowerCase() === "active",
  ).length;
  const metricsDraftArticles = articles.filter(
    (article) => article.status.toLowerCase() === "draft",
  ).length;
  const metricsInactiveArticles = articles.filter(
    (article) => article.status.toLowerCase() === "inactive",
  ).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs and page header */}
      <section className="space-y-4">
        <div className="flex items-center text-sm text-gray-500">
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
          <span className="text-gray-900">Wiki Management</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              Wiki Management
            </h1>
            <p className="text-gray-600">
              Manage all wiki articles, versions, and content
            </p>
          </div>
          <Link
            href="/admin/wiki/create"
            className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Article
          </Link>
        </div>
      </section>

      {/* Stats cards */}
      {!loading && !error && metricsTotalArticles > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsTotal")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {metricsTotalArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsTotalHelper")}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h16v4H4zM4 10h9v4H4zM4 16h16v4H4z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsActive")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-700">
                  {metricsActiveArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsActiveHelper")}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsDraft")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-700">
                  {metricsDraftArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsDraftHelper")}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M4 13.5V19h5.5L19 9.5l-5.5-5.5L4 13.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsInactive")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-700">
                  {metricsInactiveArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsInactiveHelper")}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m5-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by title or slug..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Languages</option>
              <option value="bg">Bulgarian</option>
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Content state messages */}
      {loading && (
        <p className="text-sm text-gray-600">Зареждане на списъка...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {statusUpdateError && (
        <p className="text-sm text-red-600" role="alert">
          {statusUpdateError}
        </p>
      )}

      {noArticles && !error && (
        <p className="text-sm text-gray-600">Няма Wiki статии за показване.</p>
      )}

      {hasArticles && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Languages
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageArticles.map((article) => {
                  const badge = getStatusBadge(article.status);
                  const langs = languagesByArticleId[article.id] ?? [];
                  const isUpdating = statusUpdatingId === article.id;
                  const normalizedStatus = article.status.toLowerCase();
                  const isInactive = normalizedStatus === "inactive";
                  const canToggleStatus =
                    normalizedStatus === "active" || normalizedStatus === "inactive";
                  const isActive = normalizedStatus === "active";

                  return (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-gray-900">
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {article.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-600">
                        {article.slug}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {langs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {langs.map((lng) => (
                              <span
                                key={lng}
                                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                              >
                                {lng.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-600">
                        {formatDateTime(article.updatedAt)}
                      </td>
                      <td className="px-6 py-4 align-middle text-right text-sm">
                        <Link
                          href={`/admin/wiki/${article.slug}/edit`}
                          className="mr-3 font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/wiki/${article.slug}/edit#versions`}
                          className="mr-3 font-medium text-purple-600 hover:text-purple-700"
                        >
                          Versions
                        </Link>
                        {canToggleStatus && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void handleToggleStatus(article)}
                            className={`font-medium ${
                              isInactive
                                ? "text-green-600 hover:text-green-700"
                                : "text-orange-600 hover:text-orange-700"
                            } ${isUpdating ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            {isUpdating
                              ? "Updating..."
                              : isInactive
                              ? "Activate"
                              : "Deactivate"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isActive}
                          className={`ml-3 font-medium ${
                            isActive
                              ? "cursor-not-allowed text-gray-400"
                              : "text-red-600 hover:text-red-700"
                          }`}
                          onClick={() => setDeleteArticleStep1Id(article.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{showingFrom}</span>
              -
              <span className="font-semibold">{showingTo}</span> of{" "}
              <span className="font-semibold">{totalArticles}</span> articles
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={safeCurrentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === safeCurrentPage;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={
                      isActive
                        ? "rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        : "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    }
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
      {deleteArticleStep1Id && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Изтриване на статия
            </h3>
            <p className="mb-4 text-sm text-gray-700">
              Тази статия ще бъде завинаги премахната заедно с всички нейни
              версии. Това действие е необратимо и може да повлияе на
              проследимостта на промените.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => setDeleteArticleStep1Id(null)}
              >
                Затвори
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                onClick={() => {
                  setDeleteArticleStep2Id(deleteArticleStep1Id);
                  setDeleteArticleStep1Id(null);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteArticleStep2Id && deleteArticleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Потвърдете изтриването на статията
            </h3>
            <p className="mb-3 text-sm text-gray-700">
              Наистина ли искате да изтриете тази статия? Това действие е
              окончателно и не може да бъде отменено.
            </p>
            <p className="mb-3 text-xs text-gray-600">
              Заглавие: <span className="font-semibold">{deleteArticleTarget.title}</span>
              <br />
              Slug: <span className="font-mono">{deleteArticleTarget.slug}</span>
              <br />
              Последно обновена на {formatDateTime(deleteArticleTarget.updatedAt)}.
            </p>
            {deleteArticleError && (
              <p className="mb-3 text-xs text-red-600" role="alert">
                {deleteArticleError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-70"
                onClick={() => setDeleteArticleStep2Id(null)}
                disabled={deleteArticleSubmitting}
              >
                Отказ
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                onClick={async () => {
                  if (typeof window === "undefined") return;
                  if (!deleteArticleStep2Id) return;

                  setDeleteArticleError(null);
                  setDeleteArticleSubmitting(true);

                  try {
                    const token = getAccessToken();
                    if (!token) {
                      setDeleteArticleError(
                        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
                      );
                      setDeleteArticleSubmitting(false);
                      return;
                    }

                    const res = await fetch(
                      `${API_BASE_URL}/admin/wiki/articles/${encodeURIComponent(
                        deleteArticleStep2Id,
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
                        setDeleteArticleError(
                          "Статията не може да бъде изтрита, защото е активна. Първо я деактивирайте.",
                        );
                      } else if (res.status === 404) {
                        setDeleteArticleError(
                          "Статията не беше намерена.",
                        );
                      } else {
                        setDeleteArticleError(
                          "Възникна грешка при изтриване на статията.",
                        );
                      }
                      setDeleteArticleSubmitting(false);
                      return;
                    }

                    setArticles((current) =>
                      current.filter(
                        (article) => article.id !== deleteArticleStep2Id,
                      ),
                    );
                    setLanguagesByArticleId((current) => {
                      const next = { ...current };
                      delete next[deleteArticleStep2Id];
                      return next;
                    });
                    setDeleteArticleStep2Id(null);
                  } catch {
                    setDeleteArticleError(
                      "Възникна грешка при изтриване на статията.",
                    );
                  } finally {
                    setDeleteArticleSubmitting(false);
                  }
                }}
                disabled={deleteArticleSubmitting}
              >
                Да, изтрий статията
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
