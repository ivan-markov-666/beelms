import Link from "next/link";
import { WikiMain } from "./_components/wiki-main";
import { WikiArticleMeta } from "./_components/wiki-article-meta";
import { buildApiUrl } from "../api-url";
import { getPublicSettings } from "../_data/public-settings";
import { SUPPORTED_LANGS } from "../../i18n/config";
import { Pagination } from "../_components/pagination";
import { WikiSearchFormClient } from "./_components/wiki-search-form-client";

export const dynamic = "force-dynamic";
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
): Promise<{ items: WikiArticle[]; total: number }> {
  const url = new URL(buildApiUrl("/wiki/articles"));

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

  const data = (await res.json()) as WikiArticle[];
  const rawTotal = res.headers.get("X-Total-Count") ?? "";
  const parsedTotal = Number(rawTotal);
  const total =
    Number.isFinite(parsedTotal) && parsedTotal >= 0
      ? parsedTotal
      : Array.isArray(data)
        ? data.length
        : 0;

  return { items: Array.isArray(data) ? data : [], total };
}

function WikiFiltersForm({
  supportedLangs,
  initialQ,
  initialLang,
}: {
  supportedLangs: string[];
  initialQ: string;
  initialLang: string;
}) {
  return (
    <WikiSearchFormClient
      supportedLangs={supportedLangs}
      initialQ={initialQ}
      initialLang={initialLang}
    />
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
  const publicSettings = await getPublicSettings();
  const normalizedSupported = Array.from(
    new Set(
      (publicSettings?.languages?.supported ?? [])
        .map((code) => (code ?? "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const supportedLangs =
    normalizedSupported.length > 0
      ? normalizedSupported
      : Array.from(SUPPORTED_LANGS);

  const resolvedSearchParams = ((await searchParams) ??
    {}) as WikiPageSearchParams;

  const rawQ = resolvedSearchParams.q ?? "";
  const rawLang = resolvedSearchParams.lang ?? "";
  const rawPage = resolvedSearchParams.page ?? "1";
  const trimmedQ = rawQ.trim();
  const normalizedLang = (() => {
    const trimmed = rawLang.trim().toLowerCase();
    if (!trimmed) return "";
    return supportedLangs.includes(trimmed) ? trimmed : "";
  })();
  const lang = normalizedLang || undefined;
  const parsedPage = Number.parseInt(rawPage, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = PAGE_SIZE;
  const hasFilters = Boolean(trimmedQ || lang);

  let items: WikiArticle[] = [];
  let totalCount = 0;
  let outOfRangeMessage: string | null = null;

  try {
    const first = await fetchWikiArticles({
      q: trimmedQ,
      lang,
      page,
      pageSize,
    });
    totalCount = first.total;

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    if (totalCount > 0 && safePage !== page) {
      outOfRangeMessage =
        "Тази страница не съществува. Показваме последната налична страница.";
      const retry = await fetchWikiArticles({
        q: trimmedQ,
        lang,
        page: safePage,
        pageSize,
      });
      totalCount = retry.total;
      items = retry.items;
    } else {
      items = first.items;
    }
  } catch (error) {
    void error;
    return (
      <WikiMain>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Wiki
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Възникна проблем при зареждане на статиите. Опитайте отново
            по-късно.
          </p>
        </header>
      </WikiMain>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(page, 1), totalPages);
  const shouldShowPagination = totalPages > 1;

  if (!items.length) {
    return (
      <WikiMain>
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Wiki</h1>
          <p className="mt-1 text-sm text-gray-600">
            Колекция от статии и ресурси за QA тестване
          </p>
        </header>

        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <WikiFiltersForm
            initialQ={rawQ}
            initialLang={normalizedLang}
            supportedLangs={supportedLangs}
          />
        </section>

        <section className="mb-8">
          {outOfRangeMessage && (
            <p className="mb-2 text-sm text-red-600" role="alert">
              {outOfRangeMessage}
            </p>
          )}
          <p className="text-sm text-gray-600">
            {hasFilters
              ? "Няма намерени статии според зададените критерии."
              : "Все още няма публикувани статии."}
          </p>
        </section>

        {shouldShowPagination && (
          <div className="flex items-center justify-center">
            <Pagination currentPage={safeCurrentPage} totalPages={totalPages} />
          </div>
        )}
      </WikiMain>
    );
  }

  return (
    <WikiMain>
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Wiki</h1>
        <p className="mt-1 text-sm text-gray-600">
          Колекция от статии и ресурси за QA тестване
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <WikiFiltersForm
          initialQ={rawQ}
          initialLang={normalizedLang}
          supportedLangs={supportedLangs}
        />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
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
        <div className="flex flex-col items-center justify-center gap-2">
          {outOfRangeMessage && (
            <p className="text-sm text-red-600" role="alert">
              {outOfRangeMessage}
            </p>
          )}
          <Pagination currentPage={safeCurrentPage} totalPages={totalPages} />
        </div>
      )}
    </WikiMain>
  );
}
