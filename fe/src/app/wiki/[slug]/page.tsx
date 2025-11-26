import Link from "next/link";
import { notFound } from "next/navigation";

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

  const updatedDate = new Date(article.updatedAt);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/wiki" className="hover:underline">
            ← Назад към Wiki
          </Link>
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="uppercase tracking-wide text-xs font-semibold">
            {article.language}
          </span>
          <span>
            Последна редакция: {updatedDate.toLocaleDateString("bg-BG")}
          </span>
        </div>
      </header>

      <article className="mt-4 whitespace-pre-line text-zinc-800 dark:text-zinc-100 leading-relaxed">
        {article.content}
      </article>
    </main>
  );
}
