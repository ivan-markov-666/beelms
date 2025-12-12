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
      className="flex flex-col gap-3 md:flex-row md:items-center"
      action="/wiki"
      method="GET"
    >
      <div className="flex-1">
        <label htmlFor="q" className="sr-only">
          Търсене на статии
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            id="q"
            name="q"
            placeholder="Търсене на статии..."
            defaultValue={initialQ}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="w-full md:w-48">
        <label htmlFor="lang" className="sr-only">
          Език
        </label>
        <select
          id="lang"
          name="lang"
          defaultValue={initialLang}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Всички езици</option>
          <option value="bg">Български</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      <div className="w-full md:w-auto">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 md:w-auto"
        >
          Търси
        </button>
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
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Wiki</h1>
          <p className="mt-1 text-sm text-gray-600">
            Колекция от статии и ресурси за QA тестване
          </p>
        </header>

        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <WikiFiltersForm initialQ={rawQ} initialLang={rawLang} />
        </section>

        <section className="mb-8">
          <p className="text-sm text-gray-600">
            {hasFilters
              ? "Няма намерени статии според зададените критерии."
              : "Все още няма публикувани статии."}
          </p>
        </section>

        {shouldShowPagination && (
          <nav className="flex items-center justify-center gap-2 text-sm text-gray-700">
            {hasPrevPage ? (
              <Link
                href={buildPageHref(page - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Предишна
              </Link>
            ) : (
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-400">
                Предишна
              </span>
            )}

            {hasPrevPage && (
              <Link
                href={buildPageHref(page - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                {page - 1}
              </Link>
            )}

            <span className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
              {page}
            </span>

            {hasNextPage && (
              <Link
                href={buildPageHref(page + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                {page + 1}
              </Link>
            )}

            {hasNextPage ? (
              <Link
                href={buildPageHref(page + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Следваща
              </Link>
            ) : (
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-400">
                Следваща
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
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Wiki</h1>
        <p className="mt-1 text-sm text-gray-600">
          Колекция от статии и ресурси за QA тестване
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <WikiFiltersForm initialQ={rawQ} initialLang={rawLang} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/wiki/${article.slug}`}
            className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {article.title}
            </h2>
            <div className="mt-auto pt-2">
              <WikiArticleMeta
                language={article.language}
                updatedAt={article.updatedAt}
              />
            </div>
          </Link>
        ))}
      </section>

      {shouldShowPagination && (
        <nav className="flex items-center justify-center gap-2 text-sm text-gray-700">
          {hasPrevPage ? (
            <Link
              href={buildPageHref(page - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Предишна
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-400">
              Предишна
            </span>
          )}

          {hasPrevPage && (
            <Link
              href={buildPageHref(page - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {page - 1}
            </Link>
          )}

          <span className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">
            {page}
          </span>

          {hasNextPage && (
            <Link
              href={buildPageHref(page + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {page + 1}
            </Link>
          )}

          {hasNextPage ? (
            <Link
              href={buildPageHref(page + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Следваща
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-400">
              Следваща
            </span>
          )}
        </nav>
      )}
    </WikiMain>
  );
}
