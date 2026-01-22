"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentLang } from "../../../i18n/useCurrentLang";
import { t } from "../../../i18n/t";
import type { SupportedLang } from "../../../i18n/config";
import { getAccessToken } from "../../auth-token";
import { getApiBaseUrl } from "../../api-url";
import { AdminBreadcrumbs } from "../_components/admin-breadcrumbs";
import Link from "next/link";
import { Pagination } from "../../_components/pagination";
import { InfoTooltip } from "../_components/info-tooltip";
import { ListboxSelect } from "../../_components/listbox-select";

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_PAGE_SIZE = 20;

type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

type AdminUsersStats = {
  totalUsers: number;
  activeUsers: number;
  deactivatedUsers: number;
  adminUsers: number;
};

type AdminWikiArticleForMetrics = {
  id: string;
  status: string;
};

type WikiStats = {
  totalArticles: number;
  activeArticles: number;
  draftArticles: number;
  inactiveArticles: number;
};

type UsersTrendPoint = {
  month: string;
  registered: number;
  deactivated: number;
};

type ActivityPeriodStats = {
  userRegistered: number;
  userDeactivated: number;
  articleCreated: number;
  articleUpdated: number;
};

type AdminWikiViewsMetrics = {
  totalViews: number;
  totalUniqueVisitors: number;
  topArticles: Array<{ slug: string; views: number }>;
  topArticlesByUniqueVisitors: Array<{ slug: string; uniqueVisitors: number }>;
  daily: Array<{ date: string; views: number }>;
  dailyUniqueVisitors: Array<{ date: string; uniqueVisitors: number }>;
};

type AdminWikiFeedbackMetrics = {
  totalHelpfulYes: number;
  totalHelpfulNo: number;
  total: number;
  helpfulRate: number;
  topArticlesByNotHelpful: Array<{
    slug: string;
    helpfulYes: number;
    helpfulNo: number;
    total: number;
    notHelpfulRate: number;
  }>;
  daily: Array<{
    date: string;
    helpfulYes: number;
    helpfulNo: number;
    total: number;
  }>;
};

type AdminWikiAttentionMetrics = {
  items: Array<{
    slug: string;
    views: number;
    helpfulYes: number;
    helpfulNo: number;
    totalFeedback: number;
    notHelpfulRate: number;
    score: number;
  }>;
};

type WikiAttentionSortKey =
  | "slug"
  | "score"
  | "views"
  | "notHelpfulRate"
  | "totalFeedback";

type WikiAttentionSortDir = "asc" | "desc";

type WikiInsightsView = "all" | "views" | "feedback" | "attention";

type AdminAdvancedMetricsSourcePoint = {
  source: string;
  sessions: number;
};

type AdminAdvancedMetricsPageSourcePoint = {
  source: string;
  views: number;
};

type AdminAdvancedMetricsTopPage = {
  path: string;
  views: number;
};

type AdminAdvancedMetricsDailyPoint = {
  date: string;
  value: number;
};

type AdminAdvancedMetrics = {
  totalSessions: number;
  avgSessionDurationSeconds: number;
  sessionSources: AdminAdvancedMetricsSourcePoint[];
  pageViewSources: AdminAdvancedMetricsPageSourcePoint[];
  topPages: AdminAdvancedMetricsTopPage[];
  dailySessions: AdminAdvancedMetricsDailyPoint[];
  dailyPageViews: AdminAdvancedMetricsDailyPoint[];
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
      return "en-US";
  }
}

export default function AdminMetricsPage() {
  const lang = useCurrentLang();
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<AdminUsersStats | null>(null);
  const [wikiStats, setWikiStats] = useState<WikiStats | null>(null);
  const [wikiViews, setWikiViews] = useState<AdminWikiViewsMetrics | null>(
    null,
  );
  const [wikiFeedback, setWikiFeedback] =
    useState<AdminWikiFeedbackMetrics | null>(null);
  const [wikiAttention, setWikiAttention] =
    useState<AdminWikiAttentionMetrics | null>(null);
  const [wikiInsightsView, setWikiInsightsView] =
    useState<WikiInsightsView>("all");

  const [wikiAttentionSearch, setWikiAttentionSearch] = useState("");
  const [wikiAttentionMinViews, setWikiAttentionMinViews] = useState("");
  const [wikiAttentionMinVotes, setWikiAttentionMinVotes] = useState("");
  const [wikiAttentionMinNotHelpfulRate, setWikiAttentionMinNotHelpfulRate] =
    useState("");
  const [wikiAttentionSortKey, setWikiAttentionSortKey] =
    useState<WikiAttentionSortKey>("score");
  const [wikiAttentionSortDir, setWikiAttentionSortDir] =
    useState<WikiAttentionSortDir>("desc");

  const [wikiAttentionPage, setWikiAttentionPage] = useState(1);
  const [wikiAttentionPageSize, setWikiAttentionPageSize] =
    useState(DEFAULT_PAGE_SIZE);
  const [userTrend, setUserTrend] = useState<UsersTrendPoint[]>([]);
  const [activityStats, setActivityStats] =
    useState<ActivityPeriodStats | null>(null);
  const [periodPreset, setPeriodPreset] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [advancedMetrics, setAdvancedMetrics] =
    useState<AdminAdvancedMetrics | null>(null);
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [exportingAdvanced, setExportingAdvanced] = useState(false);
  const [exportAdvancedError, setExportAdvancedError] = useState<string | null>(
    null,
  );
  const todayIso = new Date().toLocaleDateString("en-CA");

  const formatMonthLabel = (key: string): string => {
    const [yearStr, monthStr] = key.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return key;

    const date = new Date(year, month - 1, 1);
    if (Number.isNaN(date.getTime())) return key;

    return date.toLocaleDateString(langToLocale(lang), {
      year: "numeric",
      month: "short",
    });
  };

  const formatDuration = (seconds: number): string => {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const downloadAdvancedCsv = async () => {
    setExportAdvancedError(null);
    setExportingAdvanced(true);

    try {
      const token = getAccessToken();
      if (!token) {
        setExportAdvancedError(
          t(lang, "common", "adminAdvancedMetricsExportError"),
        );
        return;
      }

      const now = new Date();
      let fromDate: Date | null = null;
      let toDate: Date | null = null;

      if (periodPreset === "last_1d") {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (periodPreset === "last_7d") {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (periodPreset === "last_30d") {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (periodPreset === "last_365d") {
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else if (periodPreset === "custom") {
        if (periodFrom) {
          fromDate = new Date(`${periodFrom}T00:00:00`);
        }
        if (periodTo) {
          toDate = new Date(`${periodTo}T23:59:59.999`);
        }
      }

      const params = new URLSearchParams();
      if (fromDate) {
        params.set("from", fromDate.toISOString());
      }
      if (toDate) {
        params.set("to", toDate.toISOString());
      }

      const qs = params.toString();
      const exportUrl = qs
        ? `${API_BASE_URL}/admin/metrics/advanced/export?${qs}`
        : `${API_BASE_URL}/admin/metrics/advanced/export`;

      const res = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setExportAdvancedError(
          t(lang, "common", "adminAdvancedMetricsExportError"),
        );
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "advanced-metrics.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setExportAdvancedError(
        t(lang, "common", "adminAdvancedMetricsExportError"),
      );
    } finally {
      setExportingAdvanced(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setError(t(lang, "common", "adminDashboardMetricsError"));
            setLoading(false);
          }
          return;
        }

        const [overviewRes, userStatsRes, wikiRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/metrics/overview`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/admin/users/stats`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/admin/wiki/articles`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!overviewRes.ok || !userStatsRes.ok || !wikiRes.ok) {
          if (!cancelled) {
            setError(t(lang, "common", "adminDashboardMetricsError"));
            setLoading(false);
          }
          return;
        }

        const overviewData = (await overviewRes.json()) as MetricsOverview;
        const userStatsData = (await userStatsRes.json()) as AdminUsersStats;
        const wikiArticles =
          (await wikiRes.json()) as AdminWikiArticleForMetrics[];

        if (cancelled) return;

        const totalArticles = wikiArticles.length;
        const activeArticles = wikiArticles.filter(
          (article) => article.status.toLowerCase() === "active",
        ).length;
        const draftArticles = wikiArticles.filter(
          (article) => article.status.toLowerCase() === "draft",
        ).length;
        const inactiveArticles = wikiArticles.filter(
          (article) => article.status.toLowerCase() === "inactive",
        ).length;

        setMetrics(overviewData);
        setUserStats(userStatsData);
        setWikiStats({
          totalArticles,
          activeArticles,
          draftArticles,
          inactiveArticles,
        });
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadActivitySummary = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (!cancelled) {
            setActivityStats(null);
            setUserTrend([]);
            setWikiViews(null);
            setWikiFeedback(null);
            setWikiAttention(null);
            setAdvancedMetrics(null);
            setAdvancedError(null);
          }
          return;
        }

        const now = new Date();
        let fromDate: Date | null = null;
        let toDate: Date | null = null;

        if (periodPreset === "last_1d") {
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (periodPreset === "last_7d") {
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (periodPreset === "last_30d") {
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (periodPreset === "last_365d") {
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else if (periodPreset === "custom") {
          if (periodFrom) {
            fromDate = new Date(`${periodFrom}T00:00:00`);
          }
          if (periodTo) {
            toDate = new Date(`${periodTo}T23:59:59.999`);
          }
        }

        const params = new URLSearchParams();
        if (fromDate) {
          params.set("from", fromDate.toISOString());
        }
        if (toDate) {
          params.set("to", toDate.toISOString());
        }

        const paramsString = params.toString();
        const activityUrl = paramsString
          ? `${API_BASE_URL}/admin/metrics/activity-summary?${paramsString}`
          : `${API_BASE_URL}/admin/metrics/activity-summary`;

        const wikiViewsUrl = paramsString
          ? `${API_BASE_URL}/admin/metrics/wiki-views?${paramsString}`
          : `${API_BASE_URL}/admin/metrics/wiki-views`;

        const wikiFeedbackUrl = paramsString
          ? `${API_BASE_URL}/admin/metrics/wiki-feedback?${paramsString}`
          : `${API_BASE_URL}/admin/metrics/wiki-feedback`;

        const wikiAttentionUrl = paramsString
          ? `${API_BASE_URL}/admin/metrics/wiki-attention?${paramsString}`
          : `${API_BASE_URL}/admin/metrics/wiki-attention`;

        const advancedUrl = paramsString
          ? `${API_BASE_URL}/admin/metrics/advanced?${paramsString}`
          : `${API_BASE_URL}/admin/metrics/advanced`;

        type ActivitySummaryResponse = {
          userRegistered: number;
          userDeactivated: number;
          articleCreated: number;
          articleUpdated: number;
          userTrend: {
            month: string;
            userRegistered: number;
            userDeactivated: number;
          }[];
        };

        const [
          activityRes,
          wikiViewsRes,
          wikiFeedbackRes,
          wikiAttentionRes,
          advancedRes,
        ] = await Promise.all([
          fetch(activityUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(wikiViewsUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(wikiFeedbackUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(wikiAttentionUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(advancedUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!activityRes.ok) {
          if (!cancelled) {
            setActivityStats(null);
            setUserTrend([]);
          }
        }

        const summary = activityRes.ok
          ? ((await activityRes.json()) as ActivitySummaryResponse)
          : null;

        if (cancelled) return;

        const wikiViewsData = wikiViewsRes.ok
          ? ((await wikiViewsRes.json()) as AdminWikiViewsMetrics)
          : null;

        setWikiViews(wikiViewsData);

        const wikiFeedbackData = wikiFeedbackRes.ok
          ? ((await wikiFeedbackRes.json()) as AdminWikiFeedbackMetrics)
          : null;

        setWikiFeedback(wikiFeedbackData);

        const wikiAttentionData = wikiAttentionRes.ok
          ? ((await wikiAttentionRes.json()) as AdminWikiAttentionMetrics)
          : null;

        setWikiAttention(wikiAttentionData);

        const advancedData = advancedRes.ok
          ? ((await advancedRes.json()) as AdminAdvancedMetrics)
          : null;

        setAdvancedMetrics(advancedData);
        setAdvancedError(
          advancedRes.ok
            ? null
            : t(lang, "common", "adminAdvancedMetricsError"),
        );

        if (summary) {
          setActivityStats({
            userRegistered: summary.userRegistered,
            userDeactivated: summary.userDeactivated,
            articleCreated: summary.articleCreated,
            articleUpdated: summary.articleUpdated,
          });

          setUserTrend(
            (summary.userTrend ?? []).map((point) => ({
              month: point.month,
              registered: point.userRegistered,
              deactivated: point.userDeactivated,
            })),
          );
        } else {
          setActivityStats(null);
          setUserTrend([]);
        }
      } catch {
        if (!cancelled) {
          setActivityStats(null);
          setUserTrend([]);
          setWikiViews(null);
          setWikiFeedback(null);
          setWikiAttention(null);
          setAdvancedMetrics(null);
          setAdvancedError(t(lang, "common", "adminAdvancedMetricsError"));
        }
      }
    };

    void loadActivitySummary();

    return () => {
      cancelled = true;
    };
  }, [periodPreset, periodFrom, periodTo, lang]);

  const totalUsers = metrics?.totalUsers ?? userStats?.totalUsers ?? 0;
  const hasMetrics = !loading && !error && metrics !== null;

  const effectiveActivityStats: ActivityPeriodStats = activityStats ?? {
    userRegistered: 0,
    userDeactivated: 0,
    articleCreated: 0,
    articleUpdated: 0,
  };

  const netUserChange =
    effectiveActivityStats.userRegistered -
    effectiveActivityStats.userDeactivated;

  const usersChangePercent = metrics?.usersChangePercentSinceLastMonth ?? null;

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

  const totalPageViews =
    advancedMetrics?.dailyPageViews?.reduce((sum, p) => sum + p.value, 0) ?? 0;

  const showWikiViews =
    wikiInsightsView === "all" || wikiInsightsView === "views";
  const showWikiFeedback =
    wikiInsightsView === "all" || wikiInsightsView === "feedback";
  const showWikiAttention =
    wikiInsightsView === "all" || wikiInsightsView === "attention";

  const wikiAttentionRows = useMemo(() => {
    return wikiAttention?.items ?? [];
  }, [wikiAttention]);

  const filteredSortedWikiAttentionRows = useMemo(() => {
    const q = wikiAttentionSearch.trim().toLowerCase();

    const minViews = wikiAttentionMinViews.trim()
      ? Number(wikiAttentionMinViews)
      : null;
    const minVotes = wikiAttentionMinVotes.trim()
      ? Number(wikiAttentionMinVotes)
      : null;
    const minNotHelpfulRate = wikiAttentionMinNotHelpfulRate.trim()
      ? Number(wikiAttentionMinNotHelpfulRate)
      : null;

    const filtered = wikiAttentionRows.filter((row) => {
      if (q && !row.slug.toLowerCase().includes(q)) return false;

      if (
        minViews !== null &&
        Number.isFinite(minViews) &&
        row.views < minViews
      ) {
        return false;
      }

      if (
        minVotes !== null &&
        Number.isFinite(minVotes) &&
        row.totalFeedback < minVotes
      ) {
        return false;
      }

      if (
        minNotHelpfulRate !== null &&
        Number.isFinite(minNotHelpfulRate) &&
        row.notHelpfulRate < minNotHelpfulRate
      ) {
        return false;
      }

      return true;
    });

    const dirMultiplier = wikiAttentionSortDir === "asc" ? 1 : -1;

    const sorted = [...filtered].sort((a, b) => {
      const key = wikiAttentionSortKey;

      if (key === "slug") {
        return dirMultiplier * a.slug.localeCompare(b.slug);
      }

      const aValue = a[key];
      const bValue = b[key];
      return dirMultiplier * (aValue - bValue);
    });

    return sorted;
  }, [
    wikiAttentionRows,
    wikiAttentionSearch,
    wikiAttentionMinViews,
    wikiAttentionMinVotes,
    wikiAttentionMinNotHelpfulRate,
    wikiAttentionSortKey,
    wikiAttentionSortDir,
  ]);

  const wikiAttentionTotal = filteredSortedWikiAttentionRows.length;
  const wikiAttentionTotalPages =
    wikiAttentionTotal > 0
      ? Math.max(1, Math.ceil(wikiAttentionTotal / wikiAttentionPageSize))
      : 1;
  const wikiAttentionSafePage = Math.min(
    Math.max(wikiAttentionPage, 1),
    wikiAttentionTotalPages,
  );
  const wikiAttentionStart =
    (wikiAttentionSafePage - 1) * wikiAttentionPageSize;
  const wikiAttentionEnd = wikiAttentionStart + wikiAttentionPageSize;
  const wikiAttentionPageRows = filteredSortedWikiAttentionRows.slice(
    wikiAttentionStart,
    wikiAttentionEnd,
  );
  const wikiAttentionShowingFrom =
    wikiAttentionTotal === 0 ? 0 : wikiAttentionStart + 1;
  const wikiAttentionShowingTo = Math.min(wikiAttentionEnd, wikiAttentionTotal);

  useEffect(() => {
    setWikiAttentionPage(1);
  }, [
    wikiAttentionSearch,
    wikiAttentionMinViews,
    wikiAttentionMinVotes,
    wikiAttentionMinNotHelpfulRate,
    wikiAttentionSortKey,
    wikiAttentionSortDir,
  ]);

  const toggleWikiAttentionSort = (key: WikiAttentionSortKey) => {
    if (wikiAttentionSortKey === key) {
      setWikiAttentionSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setWikiAttentionSortKey(key);
    setWikiAttentionSortDir(key === "slug" ? "asc" : "desc");
  };

  const exportWikiAttentionCsv = () => {
    if (
      filteredSortedWikiAttentionRows.length === 0 ||
      typeof window === "undefined"
    ) {
      return;
    }

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = [
      t(lang, "common", "adminWikiAttentionArticle"),
      t(lang, "common", "adminWikiAttentionScore"),
      t(lang, "common", "adminWikiAttentionViews"),
      t(lang, "common", "adminWikiAttentionNotHelpfulRate"),
      t(lang, "common", "adminWikiAttentionVotes"),
      t(lang, "common", "adminWikiAttentionHelpfulYes"),
      t(lang, "common", "adminWikiAttentionHelpfulNo"),
    ];

    const rows = filteredSortedWikiAttentionRows.map((row) => [
      row.slug,
      row.score.toFixed(2),
      row.views,
      row.notHelpfulRate.toFixed(2),
      row.totalFeedback,
      row.helpfulYes,
      row.helpfulNo,
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wiki-attention.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <AdminBreadcrumbs
        items={[
          { label: t(lang, "common", "adminDashboardTitle"), href: "/admin" },
          { label: t(lang, "common", "adminMetricsTitle") },
        ]}
      />

      {/* Page header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-[color:var(--foreground)] md:text-4xl">
            {t(lang, "common", "adminMetricsTitle")}
          </h1>
          <InfoTooltip
            label={t(lang, "common", "adminMetricsInfoTooltipLabel")}
            title={t(lang, "common", "adminMetricsInfoTooltipTitle")}
            description={t(
              lang,
              "common",
              "adminMetricsInfoTooltipDescription",
            )}
          />
        </div>
        <p className="text-[color:var(--foreground)] opacity-80">
          {t(lang, "common", "adminMetricsSubtitle")}
        </p>
      </header>

      {/* Overview metrics card */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[color:var(--foreground)] opacity-70">
              {t(lang, "common", "adminDashboardCardUsersTitle")}
            </h2>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--primary) 15%, var(--card))",
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              {loading && (
                <p className="text-sm text-[color:var(--foreground)] opacity-60">
                  {t(lang, "common", "adminDashboardMetricsLoading")}
                </p>
              )}

              {!loading && error && (
                <p className="text-sm text-[color:var(--error)]" role="alert">
                  {error}
                </p>
              )}
              {!loading && !error && (
                <>
                  <p className="text-3xl font-bold text-[color:var(--foreground)]">
                    {hasMetrics
                      ? totalUsers.toLocaleString(langToLocale(lang))
                      : "—"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--primary)]">
                    {usersTrendText}
                  </p>
                  <p className="mt-0.5 text-xs text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminDashboardCardUsersTrendHelp")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* User statistics */}
      {userStats && !loading && !error && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
            {t(lang, "common", "adminDashboardCardUsersTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminUsersStatsTotal")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {userStats.totalUsers}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminUsersStatsActive")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                    {userStats.activeUsers}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminUsersStatsDeactivated")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--attention)]">
                    {userStats.deactivatedUsers}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--attention) 12%, var(--card))",
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
                      d="M18.364 5.636L5.636 18.364M5.636 5.636L18.364 18.364"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminUsersStatsAdmins")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--secondary)]">
                    {userStats.adminUsers}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--secondary) 12%, var(--card))",
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
                      d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4zm0 0v20"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Activity summary for selected period */}
      {!loading && !error && (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminMetricsUserActivityTitle")}
            </h2>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <ListboxSelect
                ariaLabel={t(
                  lang,
                  "common",
                  "adminMetricsWikiInsightsViewAria",
                )}
                value={wikiInsightsView}
                onChange={(next) =>
                  setWikiInsightsView(next as WikiInsightsView)
                }
                options={[
                  {
                    value: "all",
                    label: t(lang, "common", "adminWikiInsightsViewAll"),
                  },
                  {
                    value: "views",
                    label: t(lang, "common", "adminWikiInsightsViewViews"),
                  },
                  {
                    value: "feedback",
                    label: t(lang, "common", "adminWikiInsightsViewFeedback"),
                  },
                  {
                    value: "attention",
                    label: t(lang, "common", "adminWikiInsightsViewAttention"),
                  },
                ]}
              />

              <ListboxSelect
                ariaLabel={t(lang, "common", "adminMetricsPeriodAria")}
                value={periodPreset}
                onChange={(value) => {
                  setPeriodPreset(value);
                  if (value !== "custom") {
                    setPeriodFrom("");
                    setPeriodTo("");
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

              {periodPreset === "custom" && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <label className="flex flex-col text-xs text-[color:var(--foreground)] opacity-80 md:flex-row md:items-center md:gap-2">
                    <span>
                      {t(lang, "common", "adminActivityFilterRangeFrom")}
                    </span>
                    <input
                      type="date"
                      value={periodFrom}
                      onChange={(event) => setPeriodFrom(event.target.value)}
                      max={todayIso}
                      className="mt-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-xs text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] md:mt-0"
                    />
                  </label>
                  <label className="flex flex-col text-xs text-[color:var(--foreground)] opacity-80 md:flex-row md:items-center md:gap-2">
                    <span>
                      {t(lang, "common", "adminActivityFilterRangeTo")}
                    </span>
                    <input
                      type="date"
                      value={periodTo}
                      onChange={(event) => setPeriodTo(event.target.value)}
                      max={todayIso}
                      className="mt-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-xs text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] md:mt-0"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminActivityActionUserRegistered")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                    {effectiveActivityStats.userRegistered}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--foreground)] opacity-60">
                    <Link
                      href="/admin/users?status=active"
                      className="text-[color:var(--primary)] hover:opacity-90 hover:underline"
                    >
                      {t(
                        lang,
                        "common",
                        "adminMetricsUserActivityRegisteredLink",
                      )}
                    </Link>
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminActivityActionUserDeactivated")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--error)]">
                    {effectiveActivityStats.userDeactivated}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--foreground)] opacity-60">
                    <Link
                      href="/admin/users"
                      className="text-[color:var(--error)] hover:opacity-90 hover:underline"
                    >
                      {t(
                        lang,
                        "common",
                        "adminMetricsUserActivityDeactivatedLink",
                      )}
                    </Link>
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--error) 12%, var(--card))",
                  }}
                >
                  <svg
                    className="h-5 w-5"
                    style={{ color: "var(--error)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636L5.636 18.364M5.636 5.636L18.364 18.364"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminActivityActionArticleCreated")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                    {effectiveActivityStats.articleCreated}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--foreground)] opacity-60">
                    <Link
                      href="/admin/wiki?status=draft"
                      className="text-[color:var(--primary)] hover:opacity-90 hover:underline"
                    >
                      {t(
                        lang,
                        "common",
                        "adminMetricsUserActivityArticleCreatedLink",
                      )}
                    </Link>
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminActivityActionArticleUpdated")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--attention)]">
                    {effectiveActivityStats.articleUpdated}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--foreground)] opacity-60">
                    <Link
                      href="/admin/wiki"
                      className="text-[color:var(--attention)] hover:opacity-90 hover:underline"
                    >
                      {t(
                        lang,
                        "common",
                        "adminMetricsUserActivityArticleUpdatedLink",
                      )}
                    </Link>
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--attention) 12%, var(--card))",
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
                      d="M4 4h16v4H4zM4 10h9v4H4zM4 16h16v4H4z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Users monthly trend */}
      {userTrend.length > 0 && !loading && !error && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
            {t(lang, "common", "adminMetricsUsersTrendTitle")}
          </h2>
          <p className="text-xs text-[color:var(--foreground)] opacity-80">
            {netUserChange === 0 && (
              <>{t(lang, "common", "adminMetricsNetUsersChangeZero")}</>
            )}
            {netUserChange > 0 && (
              <span className="text-[color:var(--primary)]">
                +{netUserChange}{" "}
                {t(lang, "common", "adminMetricsNetUsersChangePositiveSuffix")}
              </span>
            )}
            {netUserChange < 0 && (
              <span className="text-[color:var(--error)]">
                {netUserChange}{" "}
                {t(lang, "common", "adminMetricsNetUsersChangeNegativeSuffix")}
              </span>
            )}
          </p>
          <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
            {(() => {
              const maxCount = userTrend.reduce((max, point) => {
                const localMax =
                  point.registered > point.deactivated
                    ? point.registered
                    : point.deactivated;
                return localMax > max ? localMax : max;
              }, 0);

              const safeMax = maxCount > 0 ? maxCount : 1;

              return userTrend.map((point) => {
                const widthRegistered = point.registered
                  ? Math.max(6, Math.round((point.registered / safeMax) * 100))
                  : 0;
                const widthDeactivated = point.deactivated
                  ? Math.max(6, Math.round((point.deactivated / safeMax) * 100))
                  : 0;

                return (
                  <div key={point.month} className="space-y-1">
                    <div className="text-xs font-medium text-[color:var(--foreground)] opacity-80">
                      {formatMonthLabel(point.month)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 text-[11px] text-[color:var(--primary)]">
                        {t(lang, "common", "adminActivityActionUserRegistered")}
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                        {widthRegistered > 0 && (
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: "var(--primary)",
                              width: `${widthRegistered}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="w-8 text-right text-xs text-[color:var(--foreground)] opacity-80">
                        {point.registered}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 text-[11px] text-[color:var(--error)]">
                        {t(
                          lang,
                          "common",
                          "adminActivityActionUserDeactivated",
                        )}
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                        {widthDeactivated > 0 && (
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: "var(--error)",
                              width: `${widthDeactivated}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="w-8 text-right text-xs text-[color:var(--foreground)] opacity-80">
                        {point.deactivated}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      )}

      {/* Wiki article statistics */}
      {wikiStats && !loading && !error && wikiStats.totalArticles > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
            {t(lang, "common", "adminDashboardCardArticlesTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminWikiStatsTotal")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {wikiStats.totalArticles}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
                      d="M4 4h16v4H4zM4 10h9v4H4zM4 16h16v4H4z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminWikiStatsActive")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--primary)]">
                    {wikiStats.activeArticles}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 12%, var(--card))",
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
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminWikiStatsDraft")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--attention)]">
                    {wikiStats.draftArticles}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--attention) 12%, var(--card))",
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
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminWikiStatsInactive")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)] opacity-80">
                    {wikiStats.inactiveArticles}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                  <svg
                    className="h-5 w-5 text-[color:var(--foreground)] opacity-70"
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
          </div>
        </section>
      )}

      {/* Wiki views metrics */}
      {wikiViews && !loading && !error && showWikiViews && (
        <section className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminWikiViewsTitle")}
            </h2>
            <p className="text-xs text-[color:var(--foreground)] opacity-80">
              {t(lang, "common", "adminWikiViewsSubtitle")}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiViewsTotal")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {wikiViews.totalViews}
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiViewsTotalUniqueVisitors")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {wikiViews.totalUniqueVisitors}
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiViewsTopArticles")}
              </p>
              {wikiViews.topArticles.length === 0 ? (
                <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                  -
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {wikiViews.topArticles.map((row) => (
                    <li
                      key={row.slug}
                      className="flex items-center justify-between"
                    >
                      <Link
                        href={`/wiki/${encodeURIComponent(row.slug)}`}
                        className="text-sm text-[color:var(--primary)] hover:opacity-90 hover:underline"
                      >
                        {row.slug}
                      </Link>
                      <span className="text-sm text-[color:var(--foreground)] opacity-80">
                        {row.views}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminWikiViewsTopArticlesUniqueVisitors")}
            </p>
            {wikiViews.topArticlesByUniqueVisitors.length === 0 ? (
              <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                -
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {wikiViews.topArticlesByUniqueVisitors.map((row) => (
                  <li
                    key={row.slug}
                    className="flex items-center justify-between"
                  >
                    <Link
                      href={`/wiki/${encodeURIComponent(row.slug)}`}
                      className="text-sm text-[color:var(--primary)] hover:opacity-90 hover:underline"
                    >
                      {row.slug}
                    </Link>
                    <span className="text-sm text-[color:var(--foreground)] opacity-80">
                      {row.uniqueVisitors}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiViewsDaily")}
              </p>
              {(() => {
                const points = wikiViews.daily ?? [];
                if (!points.length) {
                  return (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  );
                }

                const max = points.reduce(
                  (m, p) => (p.views > m ? p.views : m),
                  0,
                );
                const safeMax = max > 0 ? max : 1;

                return (
                  <div className="mt-3 space-y-2">
                    {points.map((p) => {
                      const width = Math.max(
                        2,
                        Math.round((p.views / safeMax) * 100),
                      );

                      return (
                        <div key={p.date} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                            {p.date}
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: "var(--primary)",
                                width: `${width}%`,
                              }}
                            />
                          </div>
                          <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                            {p.views}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiViewsDailyUniqueVisitors")}
              </p>
              {(() => {
                const points = wikiViews.dailyUniqueVisitors ?? [];
                if (!points.length) {
                  return (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  );
                }

                const max = points.reduce(
                  (m, p) => (p.uniqueVisitors > m ? p.uniqueVisitors : m),
                  0,
                );
                const safeMax = max > 0 ? max : 1;

                return (
                  <div className="mt-3 space-y-2">
                    {points.map((p) => {
                      const width = Math.max(
                        2,
                        Math.round((p.uniqueVisitors / safeMax) * 100),
                      );

                      return (
                        <div key={p.date} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                            {p.date}
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: "var(--secondary)",
                                width: `${width}%`,
                              }}
                            />
                          </div>
                          <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                            {p.uniqueVisitors}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {wikiFeedback && !loading && !error && showWikiFeedback && (
        <section className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminWikiFeedbackTitle")}
            </h2>
            <p className="text-xs text-[color:var(--foreground)] opacity-80">
              {t(lang, "common", "adminWikiFeedbackSubtitle")}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackTotal")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {wikiFeedback.total}
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackTotalYes")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {wikiFeedback.totalHelpfulYes}
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackTotalNo")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {wikiFeedback.totalHelpfulNo}
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackHelpfulRate")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                {Math.round(wikiFeedback.helpfulRate)}%
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminWikiFeedbackTopNotHelpful")}
            </p>
            {wikiFeedback.topArticlesByNotHelpful.length === 0 ? (
              <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                -
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {wikiFeedback.topArticlesByNotHelpful.map((row) => (
                  <li
                    key={row.slug}
                    className="flex flex-col gap-1 border-b border-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))] pb-2 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                  >
                    <Link
                      href={`/wiki/${encodeURIComponent(row.slug)}`}
                      className="text-sm text-[color:var(--primary)] hover:opacity-90 hover:underline"
                    >
                      {row.slug}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--foreground)] opacity-80">
                      <span>
                        {t(lang, "common", "adminWikiFeedbackNotHelpful")}:{" "}
                        {row.helpfulNo}
                      </span>
                      <span>
                        {t(lang, "common", "adminWikiFeedbackTotal")}:{" "}
                        {row.total}
                      </span>
                      <span>
                        {t(lang, "common", "adminWikiFeedbackNotHelpfulRate")}:{" "}
                        {Math.round(row.notHelpfulRate)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackDailyTotal")}
              </p>
              {(() => {
                const points = wikiFeedback.daily ?? [];
                if (!points.length) {
                  return (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  );
                }

                const max = points.reduce(
                  (m, p) => (p.total > m ? p.total : m),
                  0,
                );
                const safeMax = max > 0 ? max : 1;

                return (
                  <div className="mt-3 space-y-2">
                    {points.map((p) => {
                      const width = Math.max(
                        2,
                        Math.round((p.total / safeMax) * 100),
                      );

                      return (
                        <div key={p.date} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                            {p.date}
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--foreground) 55%, var(--card))",
                                width: `${width}%`,
                              }}
                            />
                          </div>
                          <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                            {p.total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminWikiFeedbackDailyNotHelpful")}
              </p>
              {(() => {
                const points = wikiFeedback.daily ?? [];
                if (!points.length) {
                  return (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  );
                }

                const max = points.reduce(
                  (m, p) => (p.helpfulNo > m ? p.helpfulNo : m),
                  0,
                );
                const safeMax = max > 0 ? max : 1;

                return (
                  <div className="mt-3 space-y-2">
                    {points.map((p) => {
                      const width = Math.max(
                        2,
                        Math.round((p.helpfulNo / safeMax) * 100),
                      );

                      return (
                        <div key={p.date} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                            {p.date}
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: "var(--error)",
                                width: `${width}%`,
                              }}
                            />
                          </div>
                          <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                            {p.helpfulNo}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {wikiAttention && !loading && !error && showWikiAttention && (
        <section className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
              {t(lang, "common", "adminWikiAttentionTitle")}
            </h2>
            <p className="text-xs text-[color:var(--foreground)] opacity-80">
              {t(lang, "common", "adminWikiAttentionSubtitle")}
            </p>
          </header>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminWikiAttentionFilterSearch")}
                </span>
                <input
                  value={wikiAttentionSearch}
                  onChange={(e) => setWikiAttentionSearch(e.target.value)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder={t(
                    lang,
                    "common",
                    "adminWikiAttentionFilterSearchPlaceholder",
                  )}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminWikiAttentionFilterMinViews")}
                </span>
                <input
                  type="number"
                  value={wikiAttentionMinViews}
                  onChange={(e) => setWikiAttentionMinViews(e.target.value)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  min={0}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(lang, "common", "adminWikiAttentionFilterMinVotes")}
                </span>
                <input
                  type="number"
                  value={wikiAttentionMinVotes}
                  onChange={(e) => setWikiAttentionMinVotes(e.target.value)}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  min={0}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-[color:var(--foreground)] opacity-80">
                <span>
                  {t(
                    lang,
                    "common",
                    "adminWikiAttentionFilterMinNotHelpfulRate",
                  )}
                </span>
                <input
                  type="number"
                  value={wikiAttentionMinNotHelpfulRate}
                  onChange={(e) =>
                    setWikiAttentionMinNotHelpfulRate(e.target.value)
                  }
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  min={0}
                  max={100}
                  step={1}
                />
              </label>
            </div>

            <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <p className="text-xs text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminWikiAttentionFilterShowingPrefix")}{" "}
                {filteredSortedWikiAttentionRows.length} /{" "}
                {wikiAttentionRows.length}
              </p>
              <button
                type="button"
                onClick={exportWikiAttentionCsv}
                className="inline-flex items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs font-medium text-[color:var(--foreground)] shadow-sm transition hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,var(--card))] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-1"
              >
                {t(lang, "common", "adminWikiAttentionExportCsv")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]">
            <table className="min-w-full divide-y divide-[color:var(--border)]">
              <thead className="bg-[color:color-mix(in_srgb,var(--foreground)_4%,var(--card))]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <button
                      type="button"
                      onClick={() => toggleWikiAttentionSort("slug")}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {t(lang, "common", "adminWikiAttentionArticle")}
                      {wikiAttentionSortKey === "slug" && (
                        <span aria-hidden="true">
                          {wikiAttentionSortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <button
                      type="button"
                      onClick={() => toggleWikiAttentionSort("score")}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {t(lang, "common", "adminWikiAttentionScore")}
                      {wikiAttentionSortKey === "score" && (
                        <span aria-hidden="true">
                          {wikiAttentionSortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <button
                      type="button"
                      onClick={() => toggleWikiAttentionSort("views")}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {t(lang, "common", "adminWikiAttentionViews")}
                      {wikiAttentionSortKey === "views" && (
                        <span aria-hidden="true">
                          {wikiAttentionSortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <button
                      type="button"
                      onClick={() => toggleWikiAttentionSort("notHelpfulRate")}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {t(lang, "common", "adminWikiAttentionNotHelpfulRate")}
                      {wikiAttentionSortKey === "notHelpfulRate" && (
                        <span aria-hidden="true">
                          {wikiAttentionSortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-70">
                    <button
                      type="button"
                      onClick={() => toggleWikiAttentionSort("totalFeedback")}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {t(lang, "common", "adminWikiAttentionVotes")}
                      {wikiAttentionSortKey === "totalFeedback" && (
                        <span aria-hidden="true">
                          {wikiAttentionSortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))] bg-[color:var(--card)]">
                {filteredSortedWikiAttentionRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-[color:var(--foreground)] opacity-60"
                    >
                      -
                    </td>
                  </tr>
                ) : (
                  wikiAttentionPageRows.map((row) => (
                    <tr
                      key={row.slug}
                      className="hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,var(--card))]"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/wiki/${encodeURIComponent(row.slug)}`}
                            className="text-[color:var(--primary)] hover:opacity-90 hover:underline"
                          >
                            {row.slug}
                          </Link>
                          <Link
                            href={`/admin/wiki/${encodeURIComponent(row.slug)}/edit`}
                            className="text-xs font-medium text-[color:var(--primary)] hover:opacity-90"
                          >
                            {t(lang, "common", "adminWikiAttentionEdit")}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[color:var(--foreground)] opacity-80">
                        {row.score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[color:var(--foreground)] opacity-80">
                        {row.views}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[color:var(--foreground)] opacity-80">
                        {Math.round(row.notHelpfulRate)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[color:var(--foreground)] opacity-80">
                        {row.totalFeedback}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[color:var(--border)] px-3 py-3 text-xs text-[color:var(--foreground)] opacity-80 md:text-sm">
            <p>
              Showing{" "}
              <span className="font-semibold">{wikiAttentionShowingFrom}</span>-
              <span className="font-semibold">{wikiAttentionShowingTo}</span> of{" "}
              <span className="font-semibold">{wikiAttentionTotal}</span>
            </p>
            <Pagination
              currentPage={wikiAttentionSafePage}
              totalPages={wikiAttentionTotalPages}
              onPageChange={(page) => setWikiAttentionPage(page)}
              pageSize={wikiAttentionPageSize}
              onPageSizeChange={(next) => {
                setWikiAttentionPage(1);
                setWikiAttentionPageSize(next);
              }}
            />
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="space-y-3">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                {t(lang, "common", "adminAdvancedMetricsTitle")}
              </h2>
              <p className="text-xs text-[color:var(--foreground)] opacity-80">
                {t(lang, "common", "adminAdvancedMetricsSubtitle")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,var(--card))] disabled:opacity-60"
                onClick={() => void downloadAdvancedCsv()}
                disabled={exportingAdvanced}
              >
                {exportingAdvanced
                  ? t(lang, "common", "adminAdvancedMetricsExportLoading")
                  : t(lang, "common", "adminAdvancedMetricsExportCsv")}
              </button>
            </div>
          </header>

          {advancedError && (
            <p className="text-sm text-[color:var(--error)]" role="alert">
              {advancedError}
            </p>
          )}
          {exportAdvancedError && (
            <p className="text-sm text-[color:var(--error)]" role="alert">
              {exportAdvancedError}
            </p>
          )}

          {advancedMetrics && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsTotalSessions")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {advancedMetrics.totalSessions}
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsAvgDuration")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {formatDuration(advancedMetrics.avgSessionDurationSeconds)}
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsTotalPageViews")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {totalPageViews}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsSessionSources")}
                  </p>
                  {advancedMetrics.sessionSources.length === 0 ? (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {advancedMetrics.sessionSources.map((row) => (
                        <li
                          key={row.source}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.source}
                          </span>
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.sessions}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsPageViewSources")}
                  </p>
                  {advancedMetrics.pageViewSources.length === 0 ? (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {advancedMetrics.pageViewSources.map((row) => (
                        <li
                          key={row.source}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.source}
                          </span>
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.views}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsTopPages")}
                  </p>
                  {advancedMetrics.topPages.length === 0 ? (
                    <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                      -
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {advancedMetrics.topPages.map((row) => (
                        <li
                          key={row.path}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.path}
                          </span>
                          <span className="text-sm text-[color:var(--foreground)] opacity-80">
                            {row.views}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsDailySessions")}
                  </p>
                  {(() => {
                    const points = advancedMetrics.dailySessions ?? [];
                    if (!points.length) {
                      return (
                        <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                          -
                        </p>
                      );
                    }

                    const max = points.reduce(
                      (m, p) => (p.value > m ? p.value : m),
                      0,
                    );
                    const safeMax = max > 0 ? max : 1;

                    return (
                      <div className="mt-3 space-y-2">
                        {points.map((p) => {
                          const width = Math.max(
                            2,
                            Math.round((p.value / safeMax) * 100),
                          );

                          return (
                            <div
                              key={p.date}
                              className="flex items-center gap-3"
                            >
                              <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                                {p.date}
                              </div>
                              <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    backgroundColor: "var(--secondary)",
                                    width: `${width}%`,
                                  }}
                                />
                              </div>
                              <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                                {p.value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)] opacity-60">
                    {t(lang, "common", "adminAdvancedMetricsDailyPageViews")}
                  </p>
                  {(() => {
                    const points = advancedMetrics.dailyPageViews ?? [];
                    if (!points.length) {
                      return (
                        <p className="mt-2 text-sm text-[color:var(--foreground)] opacity-60">
                          -
                        </p>
                      );
                    }

                    const max = points.reduce(
                      (m, p) => (p.value > m ? p.value : m),
                      0,
                    );
                    const safeMax = max > 0 ? max : 1;

                    return (
                      <div className="mt-3 space-y-2">
                        {points.map((p) => {
                          const width = Math.max(
                            2,
                            Math.round((p.value / safeMax) * 100),
                          );

                          return (
                            <div
                              key={p.date}
                              className="flex items-center gap-3"
                            >
                              <div className="w-24 text-xs text-[color:var(--foreground)] opacity-80">
                                {p.date}
                              </div>
                              <div className="flex-1 h-2 rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,var(--card))]">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    backgroundColor: "var(--primary)",
                                    width: `${width}%`,
                                  }}
                                />
                              </div>
                              <div className="w-10 text-right text-xs text-[color:var(--foreground)] opacity-80">
                                {p.value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
