import { notFound } from "next/navigation";
import { WikiMain } from "../_components/wiki-main";
import { WikiBackLink } from "../_components/wiki-back-link";
import { WikiArticleMeta } from "../_components/wiki-article-meta";
import { WikiArticleActions } from "../_components/wiki-article-actions";
import { normalizeLang, type SupportedLang } from "../../../i18n/config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type WikiArticleDetail = {
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

  // Опитваме се да match-нем цялото съдържание като един fenced блок:
  // ```md\n...\n```
  const match = trimmed.match(/^```[a-zA-Z0-9]*\s+([\s\S]*?)\s*```$/);

  if (!match || match.length < 2) {
    return raw;
  }

  return match[1];
}

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

  const markdownContent = normalizeMarkdownContent(article.content);

  return (
    <WikiMain>
      <header className="space-y-2">
        <WikiBackLink />
        <h1 className="text-4xl font-bold text-zinc-900">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-lg text-zinc-600">{article.subtitle}</p>
        )}
        <WikiArticleMeta
          language={article.language}
          updatedAt={article.updatedAt}
        />
        <WikiArticleActions title={article.title} lang={uiLang} />
      </header>

      <article
        className="wiki-markdown mt-6 max-w-prose text-base leading-relaxed"
        style={{ color: "#111827" }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {markdownContent}
        </ReactMarkdown>
      </article>
    </WikiMain>
  );
}
