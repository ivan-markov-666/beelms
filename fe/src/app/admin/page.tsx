"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentLang } from "../../i18n/useCurrentLang";
import { t } from "../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

type RecentActivityItem = {
  id: string;
  dotClass: string;
  prefixKey: string;
  detailKey: string;
  timeKey: string;
};

const STATIC_RECENT_ACTIVITY: RecentActivityItem[] = [
  {
    id: "article-created",
    dotClass: "bg-green-500",
    prefixKey: "adminDashboardRecentItem1Prefix",
    detailKey: "adminDashboardRecentItem1Detail",
    timeKey: "adminDashboardRecentItem1Time",
  },
  {
    id: "user-registered",
    dotClass: "bg-blue-500",
    prefixKey: "adminDashboardRecentItem2Prefix",
    detailKey: "adminDashboardRecentItem2Detail",
    timeKey: "adminDashboardRecentItem2Time",
  },
  {
    id: "article-updated",
    dotClass: "bg-yellow-500",
    prefixKey: "adminDashboardRecentItem3Prefix",
    detailKey: "adminDashboardRecentItem3Detail",
    timeKey: "adminDashboardRecentItem3Time",
  },
  {
    id: "user-deactivated",
    dotClass: "bg-red-500",
    prefixKey: "adminDashboardRecentItem4Prefix",
    detailKey: "adminDashboardRecentItem4Detail",
    timeKey: "adminDashboardRecentItem4Time",
  },
];

export default function AdminHomePage() {
  const lang = useCurrentLang();
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = window.localStorage.getItem("qa4free_access_token");
        if (!token) {
          if (!cancelled) {
            setError(t(lang, "common", "adminDashboardMetricsError"));
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API_BASE_URL}/admin/metrics/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (!cancelled) {
            setError(t(lang, "common", "adminDashboardMetricsError"));
            setLoading(false);
          }
          return;
        }

        const data = (await res.json()) as MetricsOverview;

        if (cancelled) {
          return;
        }

        setMetrics(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(t(lang, "common", "adminDashboardMetricsError"));
          setLoading(false);
        }
      }
    };

    void loadMetrics();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const totalUsers = metrics?.totalUsers ?? 0;
  const totalArticles = metrics?.totalArticles ?? 0;
  const hasMetrics = !loading && !error && metrics !== null;

  const usersChangePercent =
    metrics?.usersChangePercentSinceLastMonth ?? null;

  const usersTrendText = (() => {
    if (usersChangePercent === null || !hasMetrics) {
      return t(lang, "common", "adminDashboardCardUsersTrendUnknown");
    }

    const rounded = Math.round(usersChangePercent);
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}% ${t(
      lang,
      "common",
      "adminDashboardCardUsersTrendSuffix",
    )}`;
  })();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <section className="mb-2">
        <div className="mb-2 flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-green-600">
            {t(lang, "common", "adminDashboardBreadcrumbHome")}
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
            {t(lang, "common", "adminDashboardTitle")}
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
          {t(lang, "common", "adminDashboardTitle")}
        </h1>
        <p className="text-gray-600">
          {t(lang, "common", "adminDashboardSubtitle")}
        </p>
      </section>

      {/* Admin navigation tabs (only on dashboard) */}
      <nav className="border-b border-gray-200">
        <ul className="flex space-x-6 text-sm">
          <li>
            <span className="inline-block border-b-2 border-green-600 pb-3 text-green-700 font-medium">
              {t(lang, "common", "adminDashboardTabDashboard")}
            </span>
          </li>
          <li>
            <Link
              href="/admin/wiki"
              className="inline-block border-b-2 border-transparent pb-3 text-gray-600 transition hover:border-green-400 hover:text-green-700"
            >
              {t(lang, "common", "adminDashboardTabWiki")}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className="inline-block border-b-2 border-transparent pb-3 text-gray-600 transition hover:border-green-400 hover:text-green-700"
            >
              {t(lang, "common", "adminDashboardTabUsers")}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/metrics"
              className="inline-block border-b-2 border-transparent pb-3 text-gray-600 transition hover:border-green-400 hover:text-green-700"
            >
              {t(lang, "common", "adminDashboardTabMetrics")}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Metrics state messages */}
      {loading && (
        <p className="text-sm text-gray-500">
          {t(lang, "common", "adminDashboardMetricsLoading")}
        </p>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <section
        id="metrics"
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {/* Registered Users card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              {t(lang, "common", "adminDashboardCardUsersTitle")}
            </h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {hasMetrics ? totalUsers.toLocaleString("bg-BG") : "—" }
              </p>
              <p className="mt-1 text-sm text-green-600">
                {usersTrendText}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {t(lang, "common", "adminDashboardCardUsersTrendHelp")}
              </p>
            </div>
          </div>
        </div>

        {/* Wiki Articles card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              {t(lang, "common", "adminDashboardCardArticlesTitle")}
            </h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {hasMetrics ? totalArticles.toLocaleString("bg-BG") : "—" }
              </p>
              <p className="mt-1 text-sm text-blue-600">
                {t(
                  lang,
                  "common",
                  "adminDashboardCardArticlesSubtitle",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {t(lang, "common", "adminDashboardQuickActionsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/admin/wiki"
            className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="h-6 w-6 text-gray-400 group-hover:text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-medium text-gray-900">
                {t(lang, "common", "adminDashboardQuickActionsManageWiki")}
              </span>
            </div>
            <svg
              className="h-5 w-5 text-gray-400 group-hover:text-green-600"
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
          </Link>

          <Link
            href="/admin/users"
            className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="h-6 w-6 text-gray-400 group-hover:text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="font-medium text-gray-900">
                {t(lang, "common", "adminDashboardQuickActionsManageUsers")}
              </span>
            </div>
            <svg
              className="h-5 w-5 text-gray-400 group-hover:text-green-600"
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
          </Link>

          <a
            href="#metrics"
            className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="h-6 w-6 text-gray-400 group-hover:text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="font-medium text-gray-900">
                {t(lang, "common", "adminDashboardQuickActionsViewMetrics")}
              </span>
            </div>
            <svg
              className="h-5 w-5 text-gray-400 group-hover:text-green-600"
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
          </a>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {t(lang, "common", "adminDashboardRecentActivityTitle")}
        </h2>
        <div className="space-y-4">
          {STATIC_RECENT_ACTIVITY.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 ${
                index !== STATIC_RECENT_ACTIVITY.length - 1
                  ? "border-b border-gray-100 pb-4"
                  : ""
              }`}
            >
              <div
                className={`mt-2 h-2 w-2 rounded-full ${item.dotClass}`}
              />
              <div className="flex-grow">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">
                    {t(lang, "common", item.prefixKey)}
                  </span>{" "}
                  {t(lang, "common", item.detailKey)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t(lang, "common", item.timeKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
