"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { Pagination } from "../../_components/pagination";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { StyledCheckbox } from "../_components/styled-checkbox";
import { useAdminSupportedLanguages } from "../_hooks/use-admin-supported-languages";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 10;

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
        "border-[color:var(--primary)] bg-white text-[color:var(--primary)]",
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
  const [currentRole, setCurrentRole] = useState<
    "user" | "admin" | "monitoring" | "teacher" | "author" | null
  >(null);
  const isAdmin = currentRole === "admin";

  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const selectedSet = useMemo(
    () => new Set(selectedArticleIds),
    [selectedArticleIds],
  );

  const [bulkActionError, setBulkActionError] = useState<string | null>(null);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatusSubmitting, setBulkStatusSubmitting] = useState(false);

  const [purgeTotalCount, setPurgeTotalCount] = useState<number>(0);
  const [purgeAllOpen, setPurgeAllOpen] = useState(false);
  const [purgeAllSubmitting, setPurgeAllSubmitting] = useState(false);
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
  const { languages: supportedAdminLangs } = useAdminSupportedLanguages();
  const languageFilterOptions = useMemo(() => {
    const codes = new Set(supportedAdminLangs);
    if (languageFilter && !codes.has(languageFilter)) {
      codes.add(languageFilter);
    }
    return Array.from(codes);
  }, [supportedAdminLangs, languageFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadRole = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) setCurrentRole(null);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) setCurrentRole(null);
          return;
        }

        const data = (await res.json()) as { role?: string };
        const role = (data.role ?? "").trim();
        if (!cancelled) {
          setCurrentRole(
            role === "admin" ||
              role === "author" ||
              role === "teacher" ||
              role === "monitoring" ||
              role === "user"
              ? (role as "user" | "admin" | "monitoring" | "teacher" | "author")
              : null,
          );
        }
      } catch {
        if (!cancelled) setCurrentRole(null);
      }
    };

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadCount = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/admin/wiki/articles/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;

        const data = (await res.json()) as { total?: number };
        const total = typeof data.total === "number" ? data.total : 0;
        if (!cancelled) {
          setPurgeTotalCount(Number.isFinite(total) && total >= 0 ? total : 0);
        }
      } catch {
        // ignore
      }
    };

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
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
        const effectiveLang = (
          languageFilter ||
          headerLang ||
          ""
        ).toLowerCase();

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
            setError("Възникна грешка при зареждане на Admin Wiki списъка.");
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
  }, [languageFilter, headerLang, searchParams]);

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

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (trimmedSearch) {
        const inTitle = (article.title ?? "")
          .toLowerCase()
          .includes(trimmedSearch);
        const inSlug = (article.slug ?? "")
          .toLowerCase()
          .includes(trimmedSearch);
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
  }, [
    articles,
    languageFilter,
    languagesByArticleId,
    statusFilter,
    trimmedSearch,
  ]);

  const hasArticles = !loading && !error && filteredArticles.length > 0;
  const noArticles = !loading && !error && filteredArticles.length === 0;

  useEffect(() => {
    const allowed = new Set(filteredArticles.map((a) => a.id));
    setSelectedArticleIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      if (
        next.length === prev.length &&
        next.every((id, idx) => id === prev[idx])
      ) {
        return prev;
      }
      return next;
    });
  }, [filteredArticles]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalArticles = filteredArticles.length;
  const totalPages =
    totalArticles > 0 ? Math.ceil(totalArticles / pageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageArticles = filteredArticles.slice(startIndex, endIndex);
  const isAllVisibleSelected =
    pageArticles.length > 0 && pageArticles.every((a) => selectedSet.has(a.id));
  const hasAnySelected = selectedArticleIds.length > 0;

  const selectAllVisible = () => {
    const visibleIds = pageArticles.map((a) => a.id);
    setSelectedArticleIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return Array.from(next);
    });
  };

  const clearAllVisible = () => {
    const visible = new Set(pageArticles.map((a) => a.id));
    setSelectedArticleIds((prev) => prev.filter((id) => !visible.has(id)));
  };

  const toggleSelected = (id: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const reloadList = async () => {
    if (typeof window === "undefined") return;

    try {
      const token = getAccessToken();
      if (!token) return;

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
        return;
      }

      const data = (await res.json()) as AdminWikiArticle[];
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };
  const showingFrom = totalArticles === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalArticles);

  const handleExportCsv = () => {
    if (filteredArticles.length === 0 || typeof window === "undefined") {
      return;
    }

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = ["id", "slug", "title", "status", "languages", "updatedAt"];

    const rows = filteredArticles.map((article) => {
      const langs = (languagesByArticleId[article.id] ?? []).join("|");
      return [
        article.id,
        article.slug,
        article.title,
        article.status,
        langs,
        article.updatedAt,
      ];
    });

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-wiki-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

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
        <AdminBreadcrumbs
          items={[
            { label: "Админ табло", href: "/admin" },
            { label: "Wiki Management" },
          ]}
        />

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                Wiki Management
              </h1>
              <InfoTooltip
                label="Wiki management info"
                title="Wiki Management"
                description="Управление на wiki статии: търсене, филтри, статус (active/draft/inactive), версии и редакция на съдържанието."
              />
            </div>
            <p className="text-gray-600">
              Manage all wiki articles, versions, and content
            </p>
          </div>
          <Link
            href="/admin/wiki/create"
            className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
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
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--secondary) 12%, transparent)",
                }}
              >
                <svg
                  className="h-5 w-5"
                  style={{ color: "var(--secondary)" }}
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
                <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                  {metricsActiveArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsActiveHelper")}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--primary) 12%, transparent)",
                }}
              >
                <svg
                  className="h-5 w-5"
                  style={{ color: "var(--primary)" }}
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
                <p className="mt-1 text-2xl font-semibold text-[color:var(--attention)]">
                  {metricsDraftArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsDraftHelper")}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--attention) 12%, transparent)",
                }}
              >
                <svg
                  className="h-5 w-5"
                  style={{ color: "var(--attention)" }}
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
                <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                  {metricsInactiveArticles}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t(headerLang, "common", "adminWikiStatsInactiveHelper")}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--foreground) 6%, transparent)",
                }}
              >
                <svg
                  className="h-5 w-5"
                  style={{ color: "var(--foreground)" }}
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
                className="w-full rounded-lg border border-[color:var(--border)] py-2 pl-10 pr-4 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              />
            </div>
          </div>

          <div>
            <ListboxSelect
              ariaLabel="Wiki language"
              value={languageFilter}
              onChange={(next) => setLanguageFilter(next)}
              options={[
                { value: "", label: "All Languages" },
                ...languageFilterOptions.map((code) => ({
                  value: code,
                  label: code.toUpperCase(),
                })),
              ]}
            />
          </div>

          <div>
            <ListboxSelect
              ariaLabel="Wiki status"
              value={statusFilter}
              onChange={(next) => setStatusFilter(next)}
              options={[
                { value: "", label: "All Status" },
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExportCsv}
            disabled={filteredArticles.length === 0}
          >
            Export CSV
          </button>
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-700">
                Selected: {selectedArticleIds.length}
              </span>
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!hasAnySelected}
                onClick={() => {
                  setBulkActionError(null);
                  setBulkDeleteOpen(true);
                }}
              >
                Delete selected
              </button>
              <div className="flex items-center gap-2">
                <ListboxSelect
                  ariaLabel="Bulk status"
                  value={bulkStatus}
                  onChange={(next) => setBulkStatus(next)}
                  options={[
                    { value: "", label: "Bulk status..." },
                    { value: "draft", label: "draft" },
                    { value: "active", label: "active" },
                    { value: "inactive", label: "inactive" },
                  ]}
                />
                <button
                  type="button"
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasAnySelected || !bulkStatus}
                  onClick={() => {
                    setBulkActionError(null);
                    setBulkStatusOpen(true);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="rounded-md border border-[color:var(--field-error-border)] bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ color: "var(--error)" }}
                disabled={purgeTotalCount <= 0}
                onClick={() => {
                  setBulkActionError(null);
                  setPurgeAllOpen(true);
                }}
              >
                Delete all ({purgeTotalCount})
              </button>
            )}
          </div>

          {bulkActionError && (
            <div
              className="mx-6 mt-3 rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: "var(--field-error-bg)",
                borderColor: "var(--field-error-border)",
                color: "var(--error)",
              }}
              role="alert"
            >
              {bulkActionError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <StyledCheckbox
                      checked={isAllVisibleSelected}
                      onChange={(checked) => {
                        if (checked) {
                          selectAllVisible();
                        } else {
                          clearAllVisible();
                        }
                      }}
                      ariaLabel="Select all visible"
                    />
                  </th>
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
                    normalizedStatus === "active" ||
                    normalizedStatus === "inactive";

                  return (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-top">
                        <StyledCheckbox
                          checked={selectedSet.has(article.id)}
                          onChange={() => toggleSelected(article.id)}
                          ariaLabel={`Select ${article.title}`}
                        />
                      </td>
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
                                className="rounded border px-2 py-1 text-xs font-semibold"
                                style={{
                                  borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
                                  background:
                                    "color-mix(in srgb, var(--primary) 10%, transparent)",
                                  color: "var(--foreground)",
                                }}
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
                          className="mr-3 font-medium text-[color:var(--secondary)] hover:opacity-80"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/wiki/${article.slug}/edit#versions`}
                          className="mr-3 font-medium text-[color:var(--primary)] hover:opacity-80"
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
                                ? "text-[color:var(--primary)] hover:opacity-80"
                                : "text-[color:var(--attention)] hover:opacity-80"
                            } ${isUpdating ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            {isUpdating
                              ? "Updating..."
                              : isInactive
                                ? "Activate"
                                : "Deactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{showingFrom}</span>-
              <span className="font-semibold">{showingTo}</span> of{" "}
              <span className="font-semibold">{totalArticles}</span> articles
            </p>
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              pageSize={pageSize}
              onPageSizeChange={(next) => {
                setCurrentPage(1);
                setPageSize(next);
              }}
            />
          </div>
        </section>
      )}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Изтриване на избраните статии"
        description="Избраните статии ще бъдат физически изтрити (включително всички версии). Това действие е необратимо."
        details={
          <div>
            Брой избрани:{" "}
            <span className="font-semibold">{selectedArticleIds.length}</span>
          </div>
        }
        confirmLabel="Изтрий"
        cancelLabel="Отказ"
        danger
        submitting={bulkDeleteSubmitting}
        error={bulkActionError}
        onCancel={() => {
          if (bulkDeleteSubmitting) return;
          setBulkDeleteOpen(false);
          setBulkActionError(null);
        }}
        onConfirm={() => {
          if (bulkDeleteSubmitting) return;
          void (async () => {
            setBulkDeleteSubmitting(true);
            setBulkActionError(null);
            try {
              const token = getAccessToken();
              if (!token) throw new Error("missing-token");

              const res = await fetch(
                `${API_BASE_URL}/admin/wiki/articles/bulk`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ ids: selectedArticleIds }),
                },
              );

              if (!res.ok) {
                throw new Error(`failed-${res.status}`);
              }

              const data = (await res.json()) as { deleted?: number };
              const deleted =
                typeof data.deleted === "number" && data.deleted > 0
                  ? data.deleted
                  : 0;

              setBulkDeleteOpen(false);
              setSelectedArticleIds([]);
              await reloadList();
              if (isAdmin) {
                setPurgeTotalCount((p) => Math.max(0, p - deleted));
              }
            } catch {
              setBulkActionError("Възникна грешка при bulk изтриването.");
            } finally {
              setBulkDeleteSubmitting(false);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={bulkStatusOpen}
        title="Промяна на статуса"
        description="Ще промените статуса на всички избрани статии."
        details={
          <div>
            Нов статус: <span className="font-semibold">{bulkStatus}</span>
            <br />
            Брой избрани:{" "}
            <span className="font-semibold">{selectedArticleIds.length}</span>
          </div>
        }
        confirmLabel="OK"
        cancelLabel="Отказ"
        submitting={bulkStatusSubmitting}
        error={bulkActionError}
        onCancel={() => {
          if (bulkStatusSubmitting) return;
          setBulkStatusOpen(false);
          setBulkActionError(null);
        }}
        onConfirm={() => {
          if (bulkStatusSubmitting) return;
          void (async () => {
            setBulkStatusSubmitting(true);
            setBulkActionError(null);
            try {
              const token = getAccessToken();
              if (!token) throw new Error("missing-token");

              const res = await fetch(
                `${API_BASE_URL}/admin/wiki/articles/status/bulk`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    ids: selectedArticleIds,
                    status: bulkStatus,
                  }),
                },
              );

              if (!res.ok) {
                throw new Error(`failed-${res.status}`);
              }

              setBulkStatusOpen(false);
              await reloadList();
            } catch {
              setBulkActionError(
                "Възникна грешка при bulk промяна на статуса.",
              );
            } finally {
              setBulkStatusSubmitting(false);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={purgeAllOpen}
        title="Изтриване на всички статии"
        description={`Ще изтриете абсолютно всички wiki статии (${purgeTotalCount}). Това действие е необратимо.`}
        confirmLabel="Изтрий всички"
        cancelLabel="Отказ"
        danger
        submitting={purgeAllSubmitting}
        error={bulkActionError}
        onCancel={() => {
          if (purgeAllSubmitting) return;
          setPurgeAllOpen(false);
          setBulkActionError(null);
        }}
        onConfirm={() => {
          if (purgeAllSubmitting) return;
          void (async () => {
            setPurgeAllSubmitting(true);
            setBulkActionError(null);
            try {
              const token = getAccessToken();
              if (!token) throw new Error("missing-token");

              const res = await fetch(
                `${API_BASE_URL}/admin/wiki/articles/purge-all`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (!res.ok) {
                throw new Error(`failed-${res.status}`);
              }

              setPurgeAllOpen(false);
              setSelectedArticleIds([]);
              setArticles([]);
              setPurgeTotalCount(0);
            } catch {
              setBulkActionError(
                "Възникна грешка при изтриване на всички статии.",
              );
            } finally {
              setPurgeAllSubmitting(false);
            }
          })();
        }}
      />
    </div>
  );
}
