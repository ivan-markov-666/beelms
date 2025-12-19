"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WikiArticleActions } from "../../../../wiki/_components/wiki-article-actions";
import { WikiMarkdown } from "../../../../wiki/_components/wiki-markdown";
import { MarkAsReadButton } from "../../../_components/mark-as-read-button";
import { getAccessToken } from "../../../../auth-token";
import { normalizeLang, type SupportedLang } from "../../../../../i18n/config";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type CourseWikiArticleDetail = {
  id: string;
  slug: string;
  language: string;
  title: string;
  subtitle?: string;
  content: string;
  status: string;
  updatedAt: string;
};

function normalizeMarkdownContent(raw: string): string {
  if (!raw) {
    return raw;
  }

  const trimmed = raw.trim();

  if (!trimmed.startsWith("```")) {
    return raw;
  }

  const match = trimmed.match(/^```([a-zA-Z0-9]*)\s+([\s\S]*?)\s*```$/);

  if (!match || match.length < 3) {
    return raw;
  }

  const fenceLang = match[1];
  const inner = match[2];

  if (fenceLang === "mermaid") {
    return raw;
  }

  return inner;
}

function ArticleMeta({
  language,
  updatedAt,
}: {
  language: string;
  updatedAt: string;
}) {
  const formatted = useMemo(() => {
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return updatedAt;
    return d.toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [updatedAt]);

  return (
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span className="uppercase">{language}</span>
      <span>Обновена: {formatted}</span>
    </div>
  );
}

export default function CourseWikiArticlePage() {
  const params = useParams<{ courseId: string; slug: string }>();
  const searchParams = useSearchParams();

  const courseId = params?.courseId;
  const slug = params?.slug;

  const rawLang = searchParams?.get("lang") ?? null;
  const uiLang: SupportedLang = normalizeLang(rawLang);
  const apiLang = rawLang || undefined;

  const [article, setArticle] = useState<CourseWikiArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!courseId || !slug) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    const token = getAccessToken();
    if (!token) {
      window.clearTimeout(timer);
      window.setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Трябва да си логнат, за да отвориш този материал.");
        }
      }, 0);
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      try {
        const url = new URL(
          `${API_BASE_URL}/api/courses/${encodeURIComponent(
            courseId,
          )}/wiki/${encodeURIComponent(slug)}`,
        );

        if (apiLang) {
          url.searchParams.set("lang", apiLang);
        }

        const res = await fetch(url.toString(), {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (res.status === 401) {
          setError("Трябва да си логнат, за да отвориш този материал.");
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          setError(
            "Трябва да се запишеш в курса, за да отвориш този материал.",
          );
          setLoading(false);
          return;
        }

        if (res.status === 404) {
          setError("Материалът не е намерен.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Неуспешно зареждане на материала.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as CourseWikiArticleDetail;
        setArticle(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Неуспешно зареждане на материала.");
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiLang, courseId, slug]);

  const markdownContent = normalizeMarkdownContent(article?.content ?? "");

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">
          <Link
            href={
              courseId ? `/courses/${encodeURIComponent(courseId)}` : "/courses"
            }
            className="hover:underline"
          >
            ← Назад към курса
          </Link>
        </p>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}

        {!loading && error && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && article && (
          <>
            <h1 className="text-4xl font-bold text-zinc-900">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-lg text-zinc-600">{article.subtitle}</p>
            )}
            <ArticleMeta
              language={article.language}
              updatedAt={article.updatedAt}
            />
            <WikiArticleActions title={article.title} lang={uiLang} />
          </>
        )}
      </header>

      {!loading && !error && article && (
        <>
          <article
            className="wiki-markdown mt-2 w-full max-w-4xl text-base leading-relaxed"
            style={{ color: "#111827" }}
          >
            <WikiMarkdown content={markdownContent} />
          </article>

          <div className="mt-8 border-t border-gray-200 pt-6">
            {courseId && slug && (
              <MarkAsReadButton courseId={courseId} wikiSlug={slug} />
            )}
          </div>
        </>
      )}
    </main>
  );
}
