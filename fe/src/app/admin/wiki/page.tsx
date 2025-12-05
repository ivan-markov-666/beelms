"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

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
    return d.toLocaleString("bg-BG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (normalized === "archived") {
    return {
      label: "Archived",
      className: "border-zinc-200 bg-zinc-50 text-zinc-600",
    };
  }

  return {
    label: status,
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
  };
}

export default function AdminWikiPage() {
  const [articles, setArticles] = useState<AdminWikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = window.localStorage.getItem("qa4free_access_token");
        if (!token) {
          if (!cancelled) {
            setError(
              "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
            );
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API_BASE_URL}/admin/wiki/articles`, {
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
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-zinc-900">
            Admin Wiki
          </h2>
          <p className="text-sm text-zinc-600">
            Read-only списък с Wiki статии за администратори.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-zinc-600">Зареждане на списъка...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-sm text-zinc-600">
          Няма Wiki статии за показване.
        </p>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2 align-middle">Slug</th>
                <th className="px-3 py-2 align-middle">Title</th>
                <th className="px-3 py-2 align-middle">Status</th>
                <th className="px-3 py-2 align-middle">Updated</th>
                <th className="px-3 py-2 align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const badge = getStatusBadge(article.status);

                return (
                  <tr
                    key={article.id}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                  >
                    <td className="px-3 py-2 align-middle font-mono text-xs text-zinc-700">
                      <Link
                        href={`/wiki/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {article.slug}
                      </Link>
                    </td>
                    <td className="px-3 py-2 align-middle text-zinc-900">
                      {article.title}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle text-zinc-700">
                      {formatDateTime(article.updatedAt)}
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <Link
                        href={`/admin/wiki/${article.slug}/edit`}
                        className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
                      >
                        Редактирай
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
