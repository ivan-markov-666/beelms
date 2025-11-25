import Link from "next/link";

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
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Възникна проблем при зареждане на статиите. Опитайте отново по-късно.
          </p>
        </header>
      </main>
    );
  }

  if (!articles.length) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Все още няма публикувани статии.
          </p>
        </header>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Wiki
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Публичен списък с Wiki статии.
        </p>
      </header>

      <section className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
        {articles.map((article) => {
          const updatedDate = new Date(article.updatedAt);

          return (
            <article
              key={article.id}
              className="flex flex-col gap-1 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                <Link
                  href={`/wiki/${article.slug}`}
                  className="hover:underline"
                >
                  {article.title}
                </Link>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="uppercase tracking-wide text-xs font-semibold">
                  {article.language}
                </span>
                <span>
                  Последна редакция: {updatedDate.toLocaleDateString("bg-BG")}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
