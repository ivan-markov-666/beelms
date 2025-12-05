"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

export default function AdminMetricsPage() {
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

        if (cancelled) return;

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
  const hasMetrics = !loading && !error && metrics !== null;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/admin" className="hover:text-green-600">
              Admin
            </Link>
          </li>
          <li>
            <svg
              className="h-4 w-4 text-gray-400"
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
          </li>
          <li className="text-gray-900">
            {t(lang, "common", "adminMetricsTitle")}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          {t(lang, "common", "adminMetricsTitle")}
        </h1>
        <p className="text-gray-600">
          {t(lang, "common", "adminMetricsSubtitle")}
        </p>
      </header>

      {/* Metrics card */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-600">
              {t(lang, "common", "adminDashboardCardUsersTitle")}
            </h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              {loading && (
                <p className="text-sm text-gray-500">
                  {t(lang, "common", "adminDashboardMetricsLoading")}
                </p>
              )}
              {!loading && error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              {!loading && !error && (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {hasMetrics
                      ? totalUsers.toLocaleString("bg-BG")
                      : "—"}
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    {t(lang, "common", "adminMetricsUsersCardHelper")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
