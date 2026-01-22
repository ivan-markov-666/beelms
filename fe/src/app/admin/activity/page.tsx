"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import type { SupportedLang } from "../../../i18n/config";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import { Pagination } from "../../_components/pagination";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

type ActivityType = "wiki" | "user";
type ActivityAction =
  | "article_created"
  | "article_updated"
  | "user_registered"
  | "user_deactivated";

type AdminActivityItem = {
  occurredAt: string;
  type: ActivityType;
  action: ActivityAction;
  entityId: string;
  entityLabel: string;
  actorLabel: string | null;
};

function langToLocale(lang: SupportedLang): string {
  switch (lang) {
    case "bg":
      return "bg-BG";
    case "en":
      return "en-US";
    case "de":
      return "de-DE";
    case "es":
      return "es-ES";
    case "pt":
      return "pt-PT";
    case "pl":
      return "pl-PL";
    case "ua":
      return "uk-UA";
    case "ru":
      return "ru-RU";
    case "fr":
      return "fr-FR";
    case "tr":
      return "tr-TR";
    case "ro":
      return "ro-RO";
    case "hi":
      return "hi-IN";
    case "vi":
      return "vi-VN";
    case "id":
      return "id-ID";
    case "it":
      return "it-IT";
    case "ko":
      return "ko-KR";
    case "ja":
      return "ja-JP";
    case "nl":
      return "nl-NL";
    case "cs":
      return "cs-CZ";
    case "ar":
      return "ar";
    default:
      return lang;
  }
}

function formatDateTime(locale: string, value: string): string {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminActivityPage() {
  const lang = useCurrentLang();
  const locale = useMemo(() => langToLocale(lang), [lang]);
  const [items, setItems] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rangePreset, setRangePreset] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const todayIso = new Date().toLocaleDateString("en-CA");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleExportCsv = () => {
    if (filteredItems.length === 0 || typeof window === "undefined") {
      return;
    }

    const header = [
      t(lang, "common", "adminActivityColTime"),
      t(lang, "common", "adminActivityColType"),
      t(lang, "common", "adminActivityColAction"),
      t(lang, "common", "adminActivityColSubject"),
      t(lang, "common", "adminActivityColActor"),
    ];

    const rows = filteredItems.map((item) => {
      const typeLabel = t(
        lang,
        "common",
        item.type === "wiki"
          ? "adminActivityTypeWiki"
          : "adminActivityTypeUser",
      );

      const actionLabel = t(
        lang,
        "common",
        item.action === "article_created"
          ? "adminActivityActionArticleCreated"
          : item.action === "article_updated"
            ? "adminActivityActionArticleUpdated"
            : item.action === "user_registered"
              ? "adminActivityActionUserRegistered"
              : "adminActivityActionUserDeactivated",
      );

      const subject = `${item.entityLabel} (ID: ${item.entityId})`;

      return [
        formatDateTime(locale, item.occurredAt),
        typeLabel,
        actionLabel,
        subject,
        item.actorLabel ?? "",
      ];
    });

    const lines = [header, ...rows]
      .map((cols) =>
        cols
          .map((col) => {
            const value = String(col ?? "");
            if (/[",\n\r]/.test(value)) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob([lines], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-activity-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAccessToken();
        if (!token) {
          setError(t(lang, "common", "adminUsersNoToken"));
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/admin/activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) {
            setError(t(lang, "common", "adminActivityError"));
            setLoading(false);
          }
          return;
        }

        const data = (await res.json()) as AdminActivityItem[];

        if (cancelled) return;

        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(t(lang, "common", "adminActivityError"));
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const trimmedSearch = search.trim().toLowerCase();

  const filteredItems = (() => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (rangePreset === "last_1d") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (rangePreset === "last_7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (rangePreset === "last_30d") {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (rangePreset === "last_365d") {
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (rangePreset === "custom") {
      if (customFrom) {
        from = new Date(`${customFrom}T00:00:00`);
      }
      if (customTo) {
        to = new Date(`${customTo}T23:59:59.999`);
      }
    }

    return items.filter((item) => {
      if (typeFilter && item.type !== typeFilter) {
        return false;
      }

      if (actionFilter && item.action !== actionFilter) {
        return false;
      }

      if (from || to) {
        const occurred = new Date(item.occurredAt);
        if (!Number.isNaN(occurred.getTime())) {
          if (from && occurred < from) {
            return false;
          }
          if (to && occurred > to) {
            return false;
          }
        }
      }

      if (trimmedSearch) {
        const haystack = [
          item.entityLabel ?? "",
          item.entityId ?? "",
          item.actorLabel ?? "",
          t(
            lang,
            "common",
            item.type === "wiki"
              ? "adminActivityTypeWiki"
              : "adminActivityTypeUser",
          ),
          t(
            lang,
            "common",
            item.action === "article_created"
              ? "adminActivityActionArticleCreated"
              : item.action === "article_updated"
                ? "adminActivityActionArticleUpdated"
                : item.action === "user_registered"
                  ? "adminActivityActionUserRegistered"
                  : "adminActivityActionUserDeactivated",
          ),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(trimmedSearch)) {
          return false;
        }
      }

      return true;
    });
  })();

  const totalCount = filteredItems.length;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredItems.slice(startIndex, endIndex);

  const showingFrom = totalCount === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalCount);

  const hasItems = !loading && !error && pageItems.length > 0;
  const noItems = !loading && !error && pageItems.length === 0;

  return (
    <div className="space-y-6 pb-16 lg:pb-24">
      <section className="space-y-4">
        <AdminBreadcrumbs
          items={[
            { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
            { label: t(lang, "common", "adminActivityTitle") },
          ]}
        />

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              {t(lang, "common", "adminActivityTitle")}
            </h1>
            <InfoTooltip
              label={t(lang, "common", "adminActivityInfoTooltipLabel")}
              title={t(lang, "common", "adminActivityInfoTooltipTitle")}
              description={t(
                lang,
                "common",
                "adminActivityInfoTooltipDescription",
              )}
            />
          </div>
          <p className="text-gray-600">
            {t(lang, "common", "adminActivitySubtitle")}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            {t(lang, "common", "adminActivityFiltersTitle")}
          </h2>
          <InfoTooltip
            label={t(lang, "common", "adminActivityFiltersTooltipLabel")}
            title={t(lang, "common", "adminActivityFiltersTooltipTitle")}
            description={t(
              lang,
              "common",
              "adminActivityFiltersTooltipDescription",
            )}
          />
        </div>
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
                placeholder={t(
                  lang,
                  "common",
                  "adminActivitySearchPlaceholder",
                )}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mt-2">
              <ListboxSelect
                ariaLabel={t(lang, "common", "adminActivityRangeAria")}
                value={rangePreset}
                onChange={(value) => {
                  setRangePreset(value);
                  if (value !== "custom") {
                    setCustomFrom("");
                    setCustomTo("");
                  }
                }}
                options={[
                  {
                    value: "",
                    label: t(lang, "common", "adminActivityFilterRangeAll"),
                  },
                  {
                    value: "last_1d",
                    label: t(lang, "common", "adminActivityFilterRangeLastDay"),
                  },
                  {
                    value: "last_7d",
                    label: t(
                      lang,
                      "common",
                      "adminActivityFilterRangeLastWeek",
                    ),
                  },
                  {
                    value: "last_30d",
                    label: t(
                      lang,
                      "common",
                      "adminActivityFilterRangeLastMonth",
                    ),
                  },
                  {
                    value: "last_365d",
                    label: t(
                      lang,
                      "common",
                      "adminActivityFilterRangeLastYear",
                    ),
                  },
                  {
                    value: "custom",
                    label: t(lang, "common", "adminActivityFilterRangeCustom"),
                  },
                ]}
              />
            </div>
          </div>

          <div>
            <ListboxSelect
              ariaLabel={t(lang, "common", "adminActivityTypeAria")}
              value={typeFilter}
              onChange={(next) => setTypeFilter(next)}
              options={[
                {
                  value: "",
                  label: t(lang, "common", "adminActivityFilterTypeAll"),
                },
                {
                  value: "wiki",
                  label: t(lang, "common", "adminActivityFilterTypeWiki"),
                },
                {
                  value: "user",
                  label: t(lang, "common", "adminActivityFilterTypeUser"),
                },
              ]}
            />
          </div>

          <div className="flex flex-col">
            <ListboxSelect
              ariaLabel={t(lang, "common", "adminActivityActionAria")}
              value={actionFilter}
              onChange={(next) => setActionFilter(next)}
              options={[
                {
                  value: "",
                  label: t(lang, "common", "adminActivityFilterActionAll"),
                },
                {
                  value: "article_created",
                  label: t(
                    lang,
                    "common",
                    "adminActivityFilterActionArticleCreated",
                  ),
                },
                {
                  value: "article_updated",
                  label: t(
                    lang,
                    "common",
                    "adminActivityFilterActionArticleUpdated",
                  ),
                },
                {
                  value: "user_registered",
                  label: t(
                    lang,
                    "common",
                    "adminActivityFilterActionUserRegistered",
                  ),
                },
                {
                  value: "user_deactivated",
                  label: t(
                    lang,
                    "common",
                    "adminActivityFilterActionUserDeactivated",
                  ),
                },
              ]}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                {t(lang, "common", "adminActivityExportButton")}
              </button>
              <InfoTooltip
                label={t(lang, "common", "adminActivityExportTooltipLabel")}
                title={t(lang, "common", "adminActivityExportTooltipTitle")}
                description={t(
                  lang,
                  "common",
                  "adminActivityExportTooltipDescription",
                )}
              />
            </div>
          </div>
        </div>

        {rangePreset === "custom" && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex flex-col text-xs text-gray-600 md:flex-row md:items-center md:gap-2">
              <span>{t(lang, "common", "adminActivityFilterRangeFrom")}</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                max={todayIso}
                className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 md:mt-0"
              />
            </label>
            <label className="flex flex-col text-xs text-gray-600 md:flex-row md:items-center md:gap-2">
              <span>{t(lang, "common", "adminActivityFilterRangeTo")}</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                max={todayIso}
                className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 md:mt-0"
              />
            </label>
          </div>
        )}
      </section>

      {loading && (
        <p className="text-sm text-gray-600">
          {t(lang, "common", "adminActivityLoading")}
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {noItems && !error && (
        <p className="text-sm text-gray-600">
          {t(lang, "common", "adminActivityEmpty")}
        </p>
      )}

      {hasItems && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {t(lang, "common", "adminActivityColTime")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {t(lang, "common", "adminActivityColType")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {t(lang, "common", "adminActivityColAction")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {t(lang, "common", "adminActivityColSubject")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {t(lang, "common", "adminActivityColActor")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((item, index) => (
                  <tr
                    key={`${item.occurredAt}-${item.type}-${item.action}-${item.entityId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 align-middle text-gray-700">
                      {formatDateTime(locale, item.occurredAt)}
                    </td>
                    <td className="px-6 py-3 align-middle">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {t(
                          lang,
                          "common",
                          item.type === "wiki"
                            ? "adminActivityTypeWiki"
                            : "adminActivityTypeUser",
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-3 align-middle text-gray-700">
                      {t(
                        lang,
                        "common",
                        item.action === "article_created"
                          ? "adminActivityActionArticleCreated"
                          : item.action === "article_updated"
                            ? "adminActivityActionArticleUpdated"
                            : item.action === "user_registered"
                              ? "adminActivityActionUserRegistered"
                              : "adminActivityActionUserDeactivated",
                      )}
                    </td>
                    <td className="px-6 py-3 align-middle text-gray-900">
                      <div className="font-medium">{item.entityLabel}</div>
                      <div className="text-xs text-gray-500">
                        ID: {item.entityId}
                      </div>
                    </td>
                    <td className="px-6 py-3 align-middle text-gray-700">
                      {item.actorLabel ? (
                        item.actorLabel
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-600 md:flex-row md:items-center md:justify-between">
            <span>
              {t(lang, "common", "adminActivityFooterCountPrefix")}{" "}
              <span className="font-semibold">{showingFrom}</span>-
              <span className="font-semibold">{showingTo}</span>{" "}
              {t(lang, "common", "adminActivityFooterCountOf")}{" "}
              <span className="font-semibold">{totalCount}</span>{" "}
              {t(lang, "common", "adminActivityFooterCountSuffix")}
            </span>
            <div className="flex items-center gap-2">
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
          </div>
        </section>
      )}
    </div>
  );
}
