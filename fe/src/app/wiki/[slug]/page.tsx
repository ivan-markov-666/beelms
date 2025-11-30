import { notFound } from "next/navigation";
import { WikiMain } from "../_components/wiki-main";
import { WikiBackLink } from "../_components/wiki-back-link";
import { WikiArticleMeta } from "../_components/wiki-article-meta";
import { WikiArticleActions } from "../_components/wiki-article-actions";
import { normalizeLang, type SupportedLang } from "../../../i18n/config";

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

type WikiArticlePageSearchParams = {
  lang?: string;
};

async function fetchWikiArticle(
  slug: string,
  lang?: string,
): Promise<WikiArticleDetail> {
  const url = new URL(`${API_BASE_URL}/api/wiki/articles/${slug}`);

  if (lang) {
    url.searchParams.set("lang", lang);
  }

  const res = await fetch(url.toString(), {
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

export default async function WikiArticlePage(
  props: {
    params: { slug: string } | Promise<{ slug: string }>;
    searchParams?:
      | WikiArticlePageSearchParams
      | Promise<WikiArticlePageSearchParams>;
  },
) {
  // Next 15 can provide params/searchParams as Promises, so we need to unwrap them.
  const resolvedParams = await props.params;
  const resolvedSearchParams =
    ((await props.searchParams) ?? {}) as WikiArticlePageSearchParams;

  const rawLang = resolvedSearchParams.lang ?? null;
  const uiLang: SupportedLang = normalizeLang(rawLang);
  const apiLang = rawLang || undefined;

  const article = await fetchWikiArticle(resolvedParams.slug, apiLang);

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
        <WikiArticleActions title={article.title} lang={uiLang} />
      </header>

      <article className="mt-6 max-w-prose whitespace-pre-line text-base text-zinc-800 dark:text-zinc-100 leading-relaxed">
        {article.content}
      </article>
    </WikiMain>
  );
}
