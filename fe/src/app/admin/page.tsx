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
};

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

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold text-zinc-900">
          {t(lang, "common", "adminDashboardTitle")}
        </h2>
        <p className="mb-4 text-sm text-zinc-700">
          {t(lang, "common", "adminDashboardSubtitle")}
        </p>

        {loading && (
          <p className="text-sm text-zinc-600">
            {t(lang, "common", "adminDashboardMetricsLoading")}
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              {t(lang, "common", "adminDashboardMetricsTitle")}
            </p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {totalUsers}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          {t(lang, "common", "adminDashboardLinksTitle")}
        </h3>
        <div className="flex flex-col gap-2">
          <Link
            href="/admin/wiki"
            className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span>{t(lang, "common", "adminDashboardGoToWiki")}</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span>{t(lang, "common", "adminDashboardGoToUsers")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
