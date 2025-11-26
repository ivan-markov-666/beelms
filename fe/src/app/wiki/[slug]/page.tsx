import { notFound } from "next/navigation";
import { WikiMain } from "../_components/wiki-main";
import { WikiBackLink } from "../_components/wiki-back-link";
import { WikiArticleMeta } from "../_components/wiki-article-meta";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type WikiArticleDetail = {
  id: string;
  slug: string;
  language: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
};

async function fetchWikiArticle(slug: string): Promise<WikiArticleDetail> {
  const res = await fetch(`${API_BASE_URL}/api/wiki/articles/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load Wiki article");
  }

  return res.json();
}

export default async function WikiArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await fetchWikiArticle(params.slug);

  return (
    <WikiMain>
      <header className="space-y-2">
        <WikiBackLink />
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {article.title}
        </h1>
        <WikiArticleMeta
          language={article.language}
          updatedAt={article.updatedAt}
        />
      </header>

      <article className="mt-6 max-w-prose whitespace-pre-line text-base text-zinc-800 dark:text-zinc-100 leading-relaxed">
        {article.content}
      </article>
    </WikiMain>
  );
}
