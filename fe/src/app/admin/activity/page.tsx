"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import { getAccessToken } from "../../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const MAX_VISIBLE_ITEMS = 100;

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

function formatDateTime(value: string): string {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("bg-BG", {
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
        item.type === "wiki" ? "adminActivityTypeWiki" : "adminActivityTypeUser",
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
        formatDateTime(item.occurredAt),
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

  const limitedItems = filteredItems.slice(0, MAX_VISIBLE_ITEMS);

  const hasItems = !loading && !error && limitedItems.length > 0;
  const noItems = !loading && !error && limitedItems.length === 0;

  return (
    <div className="space-y-6">
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
          <span className="text-gray-900">
            {t(lang, "common", "adminActivityTitle")}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {t(lang, "common", "adminActivityTitle")}
          </h1>
          <p className="text-gray-600">
            {t(lang, "common", "adminActivitySubtitle")}
          </p>
        </div>
      </section>

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
              <select
                value={rangePreset}
                onChange={(event) => {
                  const value = event.target.value;
                  setRangePreset(value);
                  if (value !== "custom") {
                    setCustomFrom("");
                    setCustomTo("");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  {t(lang, "common", "adminActivityFilterRangeAll")}
                </option>
                <option value="last_1d">
                  {t(lang, "common", "adminActivityFilterRangeLastDay")}
                </option>
                <option value="last_7d">
                  {t(lang, "common", "adminActivityFilterRangeLastWeek")}
                </option>
                <option value="last_30d">
                  {t(lang, "common", "adminActivityFilterRangeLastMonth")}
                </option>
                <option value="last_365d">
                  {t(lang, "common", "adminActivityFilterRangeLastYear")}
                </option>
                <option value="custom">
                  {t(lang, "common", "adminActivityFilterRangeCustom")}
                </option>
              </select>
            </div>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                {t(lang, "common", "adminActivityFilterTypeAll")}
              </option>
              <option value="wiki">
                {t(lang, "common", "adminActivityFilterTypeWiki")}
              </option>
              <option value="user">
                {t(lang, "common", "adminActivityFilterTypeUser")}
              </option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                {t(lang, "common", "adminActivityFilterActionAll")}
              </option>
              <option value="article_created">
                {t(
                  lang,
                  "common",
                  "adminActivityFilterActionArticleCreated",
                )}
              </option>
              <option value="article_updated">
                {t(
                  lang,
                  "common",
                  "adminActivityFilterActionArticleUpdated",
                )}
              </option>
              <option value="user_registered">
                {t(
                  lang,
                  "common",
                  "adminActivityFilterActionUserRegistered",
                )}
              </option>
              <option value="user_deactivated">
                {t(
                  lang,
                  "common",
                  "adminActivityFilterActionUserDeactivated",
                )}
              </option>
            </select>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                {t(lang, "common", "adminActivityExportButton")}
              </button>
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
                {limitedItems.map((item, index) => (
                  <tr
                    key={`${item.occurredAt}-${item.type}-${item.action}-${item.entityId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 align-middle text-gray-700">
                      {formatDateTime(item.occurredAt)}
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
                      <div className="text-xs text-gray-500">ID: {item.entityId}</div>
                    </td>
                    <td className="px-6 py-3 align-middle text-gray-700">
                      {item.actorLabel ? item.actorLabel : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-2 text-xs text-gray-600">
            {t(lang, "common", "adminActivityFooterCountPrefix")} {" "}
            {limitedItems.length} {" "}
            {t(lang, "common", "adminActivityFooterCountOf")} {" "}
            {filteredItems.length} {" "}
            {t(lang, "common", "adminActivityFooterCountSuffix")}
          </div>
        </section>
      )}
    </div>
  );
}
