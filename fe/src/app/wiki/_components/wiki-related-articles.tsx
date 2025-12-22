import Link from "next/link";

import type { SupportedLang } from "../../../i18n/config";
import { t } from "../../../i18n/t";

export type WikiRelatedArticle = {
  slug: string;
  language: string;
  title: string;
  updatedAt: string;
};

type WikiRelatedArticlesProps = {
  lang: SupportedLang;
  items: WikiRelatedArticle[];
};

export function WikiRelatedArticles({ lang, items }: WikiRelatedArticlesProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="mt-10 w-full max-w-4xl rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">
        {t(lang, "wiki", "relatedArticlesTitle")}
      </h2>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={`${item.slug}-${item.language}`}>
            <Link
              href={`/wiki/${encodeURIComponent(item.slug)}?lang=${encodeURIComponent(item.language)}`}
              className="text-sm text-zinc-800 hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
