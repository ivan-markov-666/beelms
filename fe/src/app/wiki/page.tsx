import Link from "next/link";
import { WikiMain } from "./_components/wiki-main";
import { WikiArticleMeta } from "./_components/wiki-article-meta";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type WikiArticle = {
  id: string;
  slug: string;
  language: string;
  title: string;
  status: string;
  updatedAt: string;
};

async function fetchWikiArticles(): Promise<WikiArticle[]> {
  const res = await fetch(`${API_BASE_URL}/api/wiki/articles`, {
    // For WS-1 we always want the latest data
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load Wiki articles");
  }

  return res.json();
}

export default async function WikiPage() {
  let articles: WikiArticle[] = [];

  try {
    articles = await fetchWikiArticles();
  } catch (error) {
    void error;
    return (
      <WikiMain>
        <header>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Възникна проблем при зареждане на статиите. Опитайте отново по-късно.
          </p>
        </header>
      </WikiMain>
    );
  }

  if (!articles.length) {
    return (
      <WikiMain>
        <header>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Все още няма публикувани статии.
          </p>
        </header>
      </WikiMain>
    );
  }

  return (
    <WikiMain>
      <header>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Wiki
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Публичен списък с Wiki статии.
        </p>
      </header>

      <section className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
        {articles.map((article) => (
          <article
            key={article.id}
            className="flex flex-col gap-1 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              <Link href={`/wiki/${article.slug}`} className="hover:underline">
                {article.title}
              </Link>
            </h2>
            <WikiArticleMeta
              language={article.language}
              updatedAt={article.updatedAt}
            />
          </article>
        ))}
      </section>
    </WikiMain>
  );
}
