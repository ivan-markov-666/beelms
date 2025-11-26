import Link from "next/link";
import { WikiMain } from "./_components/wiki-main";
import { WikiArticleMeta } from "./_components/wiki-article-meta";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const PAGE_SIZE = 20;

type WikiArticle = {
  id: string;
  slug: string;
  language: string;
  title: string;
  status: string;
  updatedAt: string;
};

type WikiSearchParams = {
  q?: string;
  lang?: string;
  page?: number;
  pageSize?: number;
};

async function fetchWikiArticles(
  params?: WikiSearchParams,
): Promise<WikiArticle[]> {
  const url = new URL(`${API_BASE_URL}/api/wiki/articles`);

  if (params?.q && params.q.trim()) {
    url.searchParams.set("q", params.q.trim());
  }

  if (params?.lang) {
    url.searchParams.set("lang", params.lang);
  }

  if (typeof params?.page === "number") {
    url.searchParams.set("page", String(params.page));
  }

  if (typeof params?.pageSize === "number") {
    url.searchParams.set("pageSize", String(params.pageSize));
  }

  const res = await fetch(url.toString(), {
    // For WS-1 we always want the latest data
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load Wiki articles");
  }

  return res.json();
}

function WikiFiltersForm({
  initialQ,
  initialLang,
}: {
  initialQ: string;
  initialLang: string;
}) {
  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-end sm:gap-4"
      action="/wiki"
      method="GET"
    >
      <div className="flex-1">
        <label
          htmlFor="q"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Търсене
        </label>
        <input
          type="search"
          id="q"
          name="q"
          defaultValue={initialQ}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-500"
        />
      </div>
      <div className="w-full sm:w-44">
        <label
          htmlFor="lang"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Език
        </label>
        <select
          id="lang"
          name="lang"
          defaultValue={initialLang}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-500"
        >
          <option value="">Всички езици</option>
          <option value="bg">BG</option>
          <option value="en">EN</option>
        </select>
      </div>
    </form>
  );
}

type WikiPageSearchParams = {
  q?: string;
  lang?: string;
  page?: string;
};

export default async function WikiPage({
  searchParams,
}: {
  searchParams?: WikiPageSearchParams | Promise<WikiPageSearchParams>;
} = {}) {
  const resolvedSearchParams =
    ((await searchParams) ?? {}) as WikiPageSearchParams;

  const rawQ = resolvedSearchParams.q ?? "";
  const rawLang = resolvedSearchParams.lang ?? "";
  const rawPage = resolvedSearchParams.page ?? "1";
  const trimmedQ = rawQ.trim();
  const lang = rawLang || undefined;
  const parsedPage = Number.parseInt(rawPage, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = PAGE_SIZE;
  const hasFilters = Boolean(trimmedQ || lang);

  let articles: WikiArticle[] = [];

  try {
    articles = await fetchWikiArticles({ q: trimmedQ, lang, page, pageSize });
  } catch (error) {
    void error;
    return (
      <WikiMain>
        <header className="space-y-2">
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
    const hasNextPage = articles.length === pageSize;
    const hasPrevPage = page > 1;

    const buildPageHref = (targetPage: number) => {
      const params = new URLSearchParams();

      if (trimmedQ) {
        params.set("q", trimmedQ);
      }

      if (rawLang) {
        params.set("lang", rawLang);
      }

      if (targetPage > 1) {
        params.set("page", String(targetPage));
      }

      const query = params.toString();
      return query ? `/wiki?${query}` : "/wiki";
    };

    const shouldShowPagination = hasPrevPage || hasNextPage || page > 1;

    return (
      <WikiMain>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {hasFilters
              ? "Няма намерени статии според зададените критерии."
              : "Все още няма публикувани статии."}
          </p>
          <WikiFiltersForm initialQ={rawQ} initialLang={rawLang} />
        </header>

        {shouldShowPagination && (
          <nav className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            {hasPrevPage ? (
              <Link
                href={buildPageHref(page - 1)}
                className="rounded px-3 py-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
              >
                Предишна страница
              </Link>
            ) : (
              <span className="rounded px-3 py-1 opacity-50">
                Предишна страница
              </span>
            )}

            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              Страница {page}
            </span>

            {hasNextPage ? (
              <Link
                href={buildPageHref(page + 1)}
                className="rounded px-3 py-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
              >
                Следваща страница
              </Link>
            ) : (
              <span className="rounded px-3 py-1 opacity-50">
                Следваща страница
              </span>
            )}
          </nav>
        )}
      </WikiMain>
    );
  }

  const hasNextPage = articles.length === pageSize;
  const hasPrevPage = page > 1;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();

    if (trimmedQ) {
      params.set("q", trimmedQ);
    }

    if (rawLang) {
      params.set("lang", rawLang);
    }

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const query = params.toString();
    return query ? `/wiki?${query}` : "/wiki";
  };

  const shouldShowPagination = hasPrevPage || hasNextPage || page > 1;

  return (
    <WikiMain>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Wiki
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Публичен списък с Wiki статии.
        </p>
        <WikiFiltersForm initialQ={rawQ} initialLang={rawLang} />
      </header>

      <section className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
        {articles.map((article) => (
          <article
            key={article.id}
            className="flex flex-col gap-2 px-4 py-4 first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 focus-within:bg-zinc-50 dark:focus-within:bg-zinc-900 transition-colors"
          >
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              <Link
                href={`/wiki/${article.slug}`}
                className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 rounded"
              >
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

      {shouldShowPagination && (
        <nav className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          {hasPrevPage ? (
            <Link
              href={buildPageHref(page - 1)}
              className="rounded px-3 py-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
            >
              Предишна страница
            </Link>
          ) : (
            <span className="rounded px-3 py-1 opacity-50">
              Предишна страница
            </span>
          )}

          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Страница {page}
          </span>

          {hasNextPage ? (
            <Link
              href={buildPageHref(page + 1)}
              className="rounded px-3 py-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
            >
              Следваща страница
            </Link>
          ) : (
            <span className="rounded px-3 py-1 opacity-50">
              Следваща страница
            </span>
          )}
        </nav>
      )}
    </WikiMain>
  );
}
